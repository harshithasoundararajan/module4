const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/user");
const Blog = require("./models/blog");

const app = express();

const PORT = process.env.PORT || 3010;

// ==============================
// MIDDLEWARE
// ==============================

app.use(cors());
app.use(express.json());

// ==============================
// CONNECT TO MONGODB
// ==============================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.log("MongoDB connection error:", error);
    });

// ==============================
// HOME ROUTE
// ==============================

app.get("/", (req, res) => {
    res.send("Blog Backend Server is Running");
});

// ==============================
// REGISTER API
// ==============================

app.post("/api/register", async (req, res) => {
    try {
        const { name, password } = req.body;
        const email = req.body.email?.trim().toLowerCase();

        // Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            name: name,
            email: email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: "User registered successfully"
        });

    } catch (error) {
        console.log("Registration error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            debug: error.message
        });
    }
});

// ==============================
// LOGIN API
// ==============================

app.post("/api/login", async (req, res) => {
    try {
        const { password } = req.body;
        const email = req.body.email?.trim().toLowerCase();

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        res.json({
            success: true,
            message: "Login successful",
            user: {
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.log("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            debug: error.message
        });
    }
});

// ==============================
// CREATE BLOG API
// ==============================

app.post("/api/blogs", async (req, res) => {
    try {
        const { title, content, email, category } = req.body;

        // Check required fields
        if (!title || !content || !email) {
            return res.status(400).json({
                success: false,
                message: "Title, content and email are required"
            });
        }

        // Find the logged-in user from MongoDB
        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Create blog using user's name from MongoDB
        const blog = new Blog({
            title: title,
            content: content,
            author: user.name,
            category: category || "General"
        });

        await blog.save();

        res.status(201).json({
            success: true,
            message: "Blog created successfully",
            blog: blog
        });

    } catch (error) {
        console.error("Create blog error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create blog",
            debug: error.message
        });
    }
});

// ==============================
// GET ALL BLOGS + SEARCH + CATEGORY
// ==============================

app.get("/api/blogs", async (req, res) => {
    try {
        const { search, category } = req.query;

        let filter = {};

        // Search by title or content
        if (search) {
            filter.$or = [
                {
                    title: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    content: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }

        // Filter by category
        if (category) {
            filter.category = category;
        }

        const blogs = await Blog.find(filter)
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            blogs: blogs
        });

    } catch (error) {
        console.log("Get blogs error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve blogs",
            debug: error.message
        });
    }
});

// ==============================
// GET SINGLE BLOG API
// ==============================

app.get("/api/blogs/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }

        res.json({
            success: true,
            blog: blog
        });

    } catch (error) {
        console.log("Get single blog error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve blog",
            debug: error.message
        });
    }
});

// ==============================
// UPDATE BLOG API
// ==============================

app.put("/api/blogs/:id", async (req, res) => {

    try {

        const { title, content, author } = req.body;

        const blog = await Blog.findByIdAndUpdate(
            req.params.id,
            {
                title,
                content,
                author
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }

        res.json({
            success: true,
            message: "Blog updated successfully",
            blog
        });

    } catch (error) {

        console.log("Update blog error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update blog"
        });
    }
});


// ==============================
// DELETE BLOG API
// ==============================

app.delete("/api/blogs/:id", async (req, res) => {

    try {

        const blog = await Blog.findByIdAndDelete(req.params.id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }

        res.json({
            success: true,
            message: "Blog deleted successfully"
        });

    } catch (error) {

        console.log("Delete blog error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to delete blog"
        });
    }
});

// ==============================
// 404 ROUTE
// ==============================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// ==============================
// START SERVER
// ==============================

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});