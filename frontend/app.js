// ==============================
// API CONFIGURATION
// ==============================

const API_URL = "https://module4-cpcu.onrender.com/api";

// ==============================
// STORAGE HELPERS
// ==============================

const DB = {

    currentUser: () => {
        const user = localStorage.getItem("bp_user");
        return user ? JSON.parse(user) : null;
    },

    token: () => {
        return localStorage.getItem("bp_token");
    },

    setAuth: (token, user) => {
        localStorage.setItem("bp_token", token);
        localStorage.setItem("bp_user", JSON.stringify(user));
    },

    logout: () => {
        localStorage.removeItem("bp_token");
        localStorage.removeItem("bp_user");
    }
};

// ==============================
// AUTHORIZATION HEADERS
// ==============================

function authHeaders() {

    const token = DB.token();

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

// ==============================
// NAVIGATION
// ==============================

function initNav(active) {

    const user = DB.currentUser();

    const links = document.getElementById("navLinks");

    if (!links) return;

    links.innerHTML = `

        <a href="index.html"
           class="${active === "home" ? "active" : ""}">
            Home
        </a>

        ${
            user
                ? `

                    <a href="dashboard.html"
                       class="${active === "dashboard" ? "active" : ""}">
                        Dashboard
                    </a>

                    <a href="create.html"
                       class="${active === "create" ? "active" : ""}">
                        Write
                    </a>

                    <a href="#"
                       onclick="DB.logout(); location.href='index.html'">
                        Logout
                    </a>

                `
                : `

                    <a href="login.html"
                       class="${active === "login" ? "active" : ""}">
                        Login
                    </a>

                    <a href="register.html"
                       class="btn btn-primary">
                        Sign Up
                    </a>

                `
        }

    `;

    document
        .getElementById("hamburger")
        ?.addEventListener("click", () => {

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

        const response =
            await fetch(`${API_URL}/blogs`);

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Unable to load blogs"
            );

        }

        const blogs =
            data.blogs || [];

        if (!blogs.length) {

            grid.innerHTML = `

                <div class="empty">

                    No blog posts yet.

                    <br><br>

                    <a href="register.html"
                       style="color:var(--primary)">

                        Be the first to write one!

                    </a>

                </div>

            `;

            return;
        }

        grid.innerHTML = blogs.map(blog => {

            const date = blog.createdAt
                ? new Date(blog.createdAt)
                    .toLocaleDateString(
                        "en-US",
                        {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                        }
                    )
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

        console.error(
            "Error loading blogs:",
            error
        );

        grid.innerHTML = `

            <div class="empty">

                <p>
                    Unable to load blogs.
                </p>

                <p
                    style="color:var(--danger);
                           font-size:0.85rem;"
                >
                    ${escapeHtml(error.message)}
                </p>

            </div>

        `;

    }
}

// ==============================
// DASHBOARD - GET USER BLOGS
// ==============================

async function renderDashboard() {
    const grid = document.getElementById("myPosts");
    const welcomeName = document.getElementById("welcomeName");

    if (!grid) return;

    const user = DB.currentUser();
    const token = DB.token();

    // User must be logged in
    if (!user || !token) {
        location.href = "login.html";
        return;
    }

    if (welcomeName) {
        welcomeName.textContent = user.name || "User";
    }

    grid.innerHTML = `
        <div class="empty">
            Loading your posts...
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/my-blogs`, {
            method: "GET",
            headers: authHeaders()
        });

        const data = await response.json();

        if (!response.ok) {

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                DB.logout();

                alert(
                    "Your session has expired. Please login again."
                );

                location.href = "login.html";
                return;
            }

            throw new Error(
                data.message || "Unable to retrieve blogs"
            );
        }

        const blogs = data.blogs || [];

        if (!blogs.length) {
            grid.innerHTML = `
                <div class="empty">
                    <p>You haven't published any posts yet.</p>
                    <br>
                    <a href="create.html"
                       class="btn btn-primary">
                        Create Your First Post
                    </a>
                </div>
            `;
            return;
        }

        grid.innerHTML = blogs.map(blog => {

            const date = blog.createdAt
                ? new Date(blog.createdAt).toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    }
                )
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
                            ${escapeHtml(
                                blog.category || "General"
                            )}
                        </span>

                        <span>
                            ${date}
                        </span>

                    </div>

                    <br>

                    <a
                        href="blog-details.html?id=${blog._id}"
                        class="btn btn-primary">
                        View Post
                    </a>

                    <button
                        class="delete-btn"
                        onclick="deleteBlog('${blog._id}')">
                        Delete
                    </button>

                </div>
            `;

        }).join("");

    } catch (error) {

        console.error(
            "Error loading dashboard:",
            error
        );

        grid.innerHTML = `
            <div class="empty">

                <p>
                    Unable to load your posts.
                </p>

                <p style="color:var(--danger);font-size:0.85rem;">
                    ${escapeHtml(error.message)}
                </p>

            </div>
        `;
    }
}

// ==============================
// DELETE BLOG
// ==============================

async function deleteBlog(id) {

    if (!confirm("Are you sure you want to delete this post?")) {
        return;
    }

    const token = DB.token();

    if (!token) {
        location.href = "login.html";
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/blogs/${id}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        const data = await response.json();

        if (!response.ok) {

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                DB.logout();
                alert("Your session has expired. Please login again.");
                location.href = "login.html";
                return;
            }

            throw new Error(
                data.message || "Unable to delete blog"
            );
        }

        alert("Blog deleted successfully!");

        renderDashboard();

    } catch (error) {

        console.error(
            "Delete blog error:",
            error
        );

        alert(
            error.message || "Unable to delete blog"
        );
    }
}

// ==============================
// REGISTER
// ==============================

async function handleRegister(e) {

    e.preventDefault();

    const name =
        document.getElementById("regName")
            .value
            .trim();

    const email =
        document.getElementById("regEmail")
            .value
            .trim()
            .toLowerCase();

    const password =
        document.getElementById("regPass")
            .value;

    const msg =
        document.getElementById("regMsg");

    if (name.length < 2) {

        return showMsg(
            msg,
            "Please enter your full name.",
            false
        );

    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {

        return showMsg(
            msg,
            "Please enter a valid email.",
            false
        );

    }

    if (password.length < 6) {

        return showMsg(
            msg,
            "Password must be at least 6 characters.",
            false
        );

    }

    try {

        const response =
            await fetch(`${API_URL}/register`, {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    password
                })

            });

        const data =
            await response.json();

        if (!response.ok) {

            return showMsg(
                msg,
                data.message ||
                    "Registration failed",
                false
            );

        }

        showMsg(
            msg,
            "Account created! Redirecting to login...",
            true
        );

        setTimeout(() => {

            location.href =
                "login.html";

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

    const email =
        document.getElementById("loginEmail")
            .value
            .trim()
            .toLowerCase();

    const password =
        document.getElementById("loginPass")
            .value;

    const msg =
        document.getElementById("loginMsg");

    try {

        const response =
            await fetch(`${API_URL}/login`, {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })

            });

        const data =
            await response.json();

        if (!response.ok) {

            return showMsg(
                msg,
                data.message ||
                    "Invalid email or password",
                false
            );

        }

        // SAVE JWT TOKEN + USER
        DB.setAuth(
            data.token,
            data.user
        );

        showMsg(
            msg,
            "Welcome back! Redirecting...",
            true
        );

        setTimeout(() => {

            location.href =
                "dashboard.html";

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

    const token =
        DB.token();

    if (!token) {

        return location.href =
            "login.html";

    }

    const title =
        document.getElementById("postTitle")
            .value
            .trim();

    const content =
        document.getElementById("postContent")
            .value
            .trim();

    const categoryElement =
        document.getElementById("postCategory");

    const category =
        categoryElement
            ? categoryElement.value.trim()
            : "General";

    const msg =
        document.getElementById("createMsg");

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
            headers: authHeaders(),
            body: JSON.stringify({
                title,
                content,
                category
            })
        });



        const data =
            await response.json();

        if (!response.ok) {

            if (
                response.status === 401
            ) {

                DB.logout();

                alert(
                    "Your session has expired. Please login again."
                );

                return location.href =
                    "login.html";

            }

            return showMsg(
                msg,
                data.message ||
                    "Unable to create blog",
                false
            );

        }

        showMsg(
            msg,
            "Post published successfully!",
            true
        );

        setTimeout(() => {

            location.href =
                "index.html";

        }, 1000);

    } catch (error) {

        console.error(
            "Create blog error:",
            error
        );

        showMsg(
            msg,
            "Unable to connect to server.",
            false
        );

    }
}

// ==============================
// GET SINGLE BLOG
// ==============================

async function loadBlogDetails() {

    const container =
        document.getElementById(
            "blogDetails"
        );

    if (!container) return;

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        params.get("id");

    if (!id) {

        container.innerHTML = `
            <div class="empty">
                Blog ID is missing.
            </div>
        `;

        return;

    }

    try {

        const response =
            await fetch(
                `${API_URL}/blogs/${id}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                    "Unable to load blog"
            );

        }

        const blog =
            data.blog;

        const date =
            blog.createdAt
                ? new Date(
                    blog.createdAt
                ).toLocaleDateString(
                    "en-US",
                    {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                    }
                )
                : "";

        container.innerHTML = `

            <article class="blog-details">

                <h1>
                    ${escapeHtml(blog.title)}
                </h1>

                <div class="post-meta">

                    <span>
                        By ${escapeHtml(blog.author)}
                    </span>

                    <span>
                        ${date}
                    </span>

                    <span>
                        ${escapeHtml(
                            blog.category ||
                            "General"
                        )}
                    </span>

                </div>

                <div class="blog-content">

                    ${escapeHtml(blog.content)}

                </div>

            </article>

        `;

    } catch (error) {

        console.error(error);

        container.innerHTML = `

            <div class="empty">

                Unable to load blog.

                <br><br>

                ${escapeHtml(
                    error.message
                )}

            </div>

        `;

    }
}

// ==============================
// MESSAGE
// ==============================

function showMsg(
    el,
    text,
    ok
) {

    if (!el) return;

    el.textContent =
        text;

    el.className =
        "msg show " +
        (ok ? "ok" : "bad");

}

// ==============================
// ESCAPE HTML
// ==============================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}

// ==============================
// PAGE INITIALIZATION
// ==============================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // Home
        renderHome();

        // Blog details
        loadBlogDetails();

    }
);
