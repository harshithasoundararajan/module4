const jwt = require("jsonwebtoken");
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

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
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
            message: "Server error"
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

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

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

        // Create JWT token
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.log("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

// ==============================
// JWT AUTH MIDDLEWARE
// ==============================

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Access token required"
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Invalid token format"
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(403).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}

// ==============================
// CREATE BLOG API
// ==============================

app.post(
    "/api/blogs",
    authenticateToken,
    async (req, res) => {
        try {
            const { title, content, category } = req.body;

            if (!title || !content) {
                return res.status(400).json({
                    success: false,
                    message: "Title and content are required"
                });
            }

            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const blog = new Blog({
                title,
                content,
                author: user.name,
                userId: user._id,
                category: category || "General"
            });

            await blog.save();

            res.status(201).json({
                success: true,
                message: "Blog created successfully",
                blog
            });

        } catch (error) {
            console.error("Create blog error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to create blog"
            });
        }
    }
);

// ==============================
// GET ALL BLOGS + SEARCH + CATEGORY
// ==============================

app.get("/api/blogs", async (req, res) => {
    try {
        const { search, category } = req.query;

        let filter = {};

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

        if (category) {
            filter.category = category;
        }

        const blogs = await Blog.find(filter)
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            blogs
        });

    } catch (error) {
        console.log("Get blogs error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve blogs"
        });
    }
});

// ==============================
// GET LOGGED-IN USER BLOGS
// ==============================

app.get(
    "/api/my-blogs",
    authenticateToken,
    async (req, res) => {
        try {
            const blogs = await Blog.find({
                userId: req.user.id
            }).sort({
                createdAt: -1
            });

            res.json({
                success: true,
                blogs
            });

        } catch (error) {
            console.log("My blogs error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to retrieve blogs"
            });
        }
    }
);

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
            blog
        });

    } catch (error) {
        console.log("Get single blog error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve blog"
        });
    }
});

// ==============================
// UPDATE BLOG API
// ==============================

app.put(
    "/api/blogs/:id",
    authenticateToken,
    async (req, res) => {
        try {
            const { title, content, category } = req.body;

            const blog = await Blog.findOneAndUpdate(
                {
                    _id: req.params.id,
                    userId: req.user.id
                },
                {
                    title,
                    content,
                    category
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!blog) {
                return res.status(404).json({
                    success: false,
                    message: "Blog not found or access denied"
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
    }
);

// ==============================
// DELETE BLOG API
// ==============================

app.delete(
    "/api/blogs/:id",
    authenticateToken,
    async (req, res) => {
        try {
            const blog = await Blog.findOneAndDelete({
                _id: req.params.id,
                userId: req.user.id
            });

            if (!blog) {
                return res.status(404).json({
                    success: false,
                    message: "Blog not found or access denied"
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
    }
);

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
    console.log(
        `Server running at http://localhost:${PORT}`
    );
});