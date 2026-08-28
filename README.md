# BlogSpace

A simple full-stack Blog Management Web Application built using **HTML, CSS, JavaScript, Node.js, Express.js, and MongoDB**.

## Features

* User Registration
* User Login
* Password Hashing
* Create Blogs
* View Blogs
* Update Blogs
* Delete Blogs
* Search Blogs
* Filter Blogs by Category
* MongoDB Database

## Technologies Used

* HTML
* CSS
* JavaScript
* Node.js
* Express.js
* MongoDB
* Mongoose
* bcryptjs

## API Endpoints

### User

* `POST /api/register` - Register user
* `POST /api/login` - Login user

### Blogs

* `POST /api/blogs` - Create blog
* `GET /api/blogs` - Get all blogs
* `GET /api/blogs/:id` - Get single blog
* `PUT /api/blogs/:id` - Update blog
* `DELETE /api/blogs/:id` - Delete blog
* `GET /api/blogs?search=keyword` - Search blogs
* `GET /api/blogs?category=Technology` - Filter by category

## Setup

```bash
npm install
```

Create a `.env` file:

```env
MONGO_URI=your_mongodb_connection_string
PORT=3010
```

Start the server:

```bash
node server.js
```

Server runs at:

`http://localhost:3010`

## Testing

APIs can be tested using **Thunder Client** or **Postman**.

## Project Structure

```text
BlogSpace/
├── models/
│   ├── blog.js
│   └── user.js
├── server.js
├── package.json
└── .env
```

## Author

**Harshitha S**
