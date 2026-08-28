// ==============================
// API CONFIGURATION
// ==============================

const API_URL = "http://localhost:3010/api";

// ==============================
// STORAGE HELPERS
// ==============================

const DB = {
    currentUser: () => localStorage.getItem("bp_current"),

    setCurrentUser: (email) => {
        localStorage.setItem("bp_current", email);
    },

    logout: () => {
        localStorage.removeItem("bp_current");
    }
};

// ==============================
// NAVIGATION
// ==============================

function initNav(active) {

    const user = DB.currentUser();
    const links = document.getElementById("navLinks");

    if (!links) return;

    links.innerHTML = `
        <a href="index.html" class="${active === "home" ? "active" : ""}">
            Home
        </a>

        ${
            user
                ? `
                    <a href="dashboard.html" class="${active === "dashboard" ? "active" : ""}">
                        Dashboard
                    </a>

                    <a href="create.html" class="${active === "create" ? "active" : ""}">
                        Write
                    </a>

                    <a href="#" onclick="DB.logout(); location.href='index.html'">
                        Logout
                    </a>
                `
                : `
                    <a href="login.html" class="${active === "login" ? "active" : ""}">
                        Login
                    </a>

                    <a href="register.html" class="btn btn-primary">
                        Sign Up
                    </a>
                `
        }
    `;

    document.getElementById("hamburger")?.addEventListener("click", () => {
        links.classList.toggle("open");
    });
}

// ==============================
// HOME PAGE - GET ALL BLOGS
// ==============================

async function renderHome() {

    const grid = document.getElementById("postsGrid");

    if (!grid) return;

    grid.innerHTML = `
        <div class="empty">
            Loading blogs...
        </div>
    `;

    try {

        const response = await fetch(`${API_URL}/blogs`);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load blogs");
        }

        const blogs = data.blogs || [];

        if (!blogs.length) {

            grid.innerHTML = `
                <div class="empty">
                    No blog posts yet.
                    <br><br>
                    <a href="register.html" style="color:var(--primary)">
                        Be the first to write one!
                    </a>
                </div>
            `;

            return;
        }

        grid.innerHTML = blogs.map(blog => {

            const date = blog.createdAt
                ? new Date(blog.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                })
                : "";

            return `
                <div class="post-card">

                    <h3>
                        ${escapeHtml(blog.title)}
                    </h3>

                    <p>
                        ${escapeHtml(blog.content)}
                    </p>

                    <div class="post-meta">

                        <span>
                            ${escapeHtml(blog.author)}
                        </span>

                        <span>
                            ${date}
                        </span>

                    </div>

                    <br>

                    <a
                        href="blog-details.html?id=${blog._id}"
                        class="btn btn-primary"
                    >
                        Read More
                    </a>

                </div>
            `;

        }).join("");

    } catch (error) {

        console.error("Error loading blogs:", error);

        grid.innerHTML = `
            <div class="empty">
                <p>Unable to load blogs.</p>
                <p style="color:var(--danger); font-size:0.85rem;">
                    ${escapeHtml(error.message)}
                </p>
            </div>
        `;
    }
}

// ==============================
// REGISTER
// ==============================

async function handleRegister(e) {

    e.preventDefault();

    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const password = document.getElementById("regPass").value;

    const msg = document.getElementById("regMsg");

    if (name.length < 2) {
        return showMsg(msg, "Please enter your full name.", false);
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return showMsg(msg, "Please enter a valid email.", false);
    }

    if (password.length < 6) {
        return showMsg(msg, "Password must be at least 6 characters.", false);
    }

    try {

        const response = await fetch(`${API_URL}/register`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name,
                email,
                password
            })

        });

        const data = await response.json();

        if (!response.ok) {

            return showMsg(
                msg,
                data.message || "Registration failed",
                false
            );
        }

        showMsg(
            msg,
            "Account created! Redirecting to login...",
            true
        );

        setTimeout(() => {
            location.href = "login.html";
        }, 1200);

    } catch (error) {

        console.error(error);

        showMsg(
            msg,
            "Unable to connect to server.",
            false
        );
    }
}

// ==============================
// LOGIN
// ==============================

async function handleLogin(e) {

    e.preventDefault();

    const email = document.getElementById("loginEmail")
        .value
        .trim()
        .toLowerCase();

    const password = document.getElementById("loginPass").value;

    const msg = document.getElementById("loginMsg");

    try {

        const response = await fetch(`${API_URL}/login`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })

        });

        const data = await response.json();

        if (!response.ok) {

            return showMsg(
                msg,
                data.message || "Invalid email or password",
                false
            );
        }

        DB.setCurrentUser(data.user.email);

        showMsg(
            msg,
            "Welcome back! Redirecting...",
            true
        );

        setTimeout(() => {
            location.href = "dashboard.html";
        }, 800);

    } catch (error) {

        console.error(error);

        showMsg(
            msg,
            "Unable to connect to server.",
            false
        );
    }
}

// ==============================
// CREATE BLOG
// ==============================

async function handleCreate(e) {

    e.preventDefault();

    const email = DB.currentUser();

    if (!email) {
        return location.href = "login.html";
    }

    const title = document.getElementById("postTitle")
        .value
        .trim();

    const content = document.getElementById("postContent")
        .value
        .trim();

    const msg = document.getElementById("createMsg");

    if (title.length < 3) {
        return showMsg(
            msg,
            "Title must be at least 3 characters.",
            false
        );
    }

    if (content.length < 10) {
        return showMsg(
            msg,
            "Content must be at least 10 characters.",
            false
        );
    }

    try {

        const response = await fetch(`${API_URL}/blogs`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                title,
                content,
                email

            })

        });

        const data = await response.json();

        if (!response.ok) {

            return showMsg(
                msg,
                data.message || "Unable to create blog",
                false
            );
        }

        showMsg(
            msg,
            "Post published successfully!",
            true
        );

        setTimeout(() => {
            location.href = "index.html";
        }, 1000);

    } catch (error) {

        console.error(error);

        showMsg(
            msg,
            "Unable to connect to server.",
            false
        );
    }
}

// ==============================
// MESSAGE
// ==============================

function showMsg(el, text, ok) {

    if (!el) return;

    el.textContent = text;

    el.className =
        "msg show " +
        (ok ? "ok" : "bad");
}

// ==============================
// ESCAPE HTML
// ==============================

function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}