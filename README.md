# Mini Jira

A full-stack bug and project tracking application inspired by Jira.

Mini Jira allows teams to create projects, manage tickets, assign work to team members, track ticket status and priority, and securely authenticate using JWT-based authentication.

## Live Demo

- Frontend: https://mini-jira-gamma.vercel.app
- Backend API: https://mini-jira-api.vercel.app

---

## Features

### Authentication

- User registration
- User login
- JWT-based authentication
- Protected routes
- Persistent login using local storage
- Logout functionality
- Password hashing using bcrypt

### Project Management

- Create projects
- View projects
- Search projects
- View project details
- Update projects
- Delete projects
- Project membership

### Ticket Management

- Create tickets
- View project tickets
- View ticket details
- Edit tickets
- Delete tickets
- Assign tickets to team members
- Change ticket status
- Set ticket priority
- Ticket types
- Ticket labels
- Search tickets
- Filter tickets by status and priority
- Automatic ticket numbering

### Dashboard

- Project overview
- Ticket statistics
- Priority breakdown
- Ticket status overview
- Recent tickets
- Workload information

### UI/UX

- Responsive React interface
- Tailwind CSS
- Loading states
- Error handling
- Success notifications
- Modal forms
- Responsive layouts
- Protected navigation

---

---

## Screenshots

### Dashboard

The dashboard provides an overview of projects, ticket status, workload, priorities, and recent tickets.

![Mini Jira Dashboard](docs/screenshots/dashboard.png)

### Project Details

Project pages provide ticket management, filtering, project progress, and team member information.

![Project Details](docs/screenshots/project-details.png)

### Edit Project

Projects can be updated through a dedicated modal interface.

![Edit Project](docs/screenshots/edit-project.png)

### Create Ticket

Tickets can be created with a title, description, type, priority, assignee, and labels.

![Create Ticket](docs/screenshots/create-ticket.png)

### Ticket Details

The ticket details page allows users to view and update ticket status, assignee, priority, and other information.

![Ticket Details](docs/screenshots/ticket-details.png)

---

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Context API
- Tailwind CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- CORS

### Deployment

- Vercel
- MongoDB Atlas

---

## Architecture

```text
                    ┌──────────────────────┐
                    │      React Client    │
                    │   Vite + Tailwind    │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │    Express Backend   │
                    │      Node.js         │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴───────────┐
                    │                      │
                    ▼                      ▼
              JWT Authentication     Mongoose ODM
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │ MongoDB Atlas   │
                                  └─────────────────┘
```

---

## Project Structure

```text
mini-jira/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       │   └── ProtectedRoute.jsx
│       │
│       ├── context/
│       │   └── AuthContext.jsx
│       │
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Login.jsx
│       │   ├── Projects.jsx
│       │   ├── ProjectDetails.jsx
│       │   └── TicketDetails.jsx
│       │
│       ├── services/
│       │   ├── api.js
│       │   ├── authService.js
│       │   ├── projectService.js
│       │   └── ticketService.js
│       │
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
│
├── server/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   └── ticketController.js
│   │
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── models/
│   │   ├── Project.js
│   │   ├── Ticket.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   └── ticketRoutes.js
│   │
│   ├── utils/
│   │   └── generateToken.js
│   │
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

# Getting Started

## Prerequisites

Make sure you have the following installed:

- Node.js 18+
- npm
- Git
- MongoDB Atlas account

---

# Installation

## 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/mini-jira.git
cd mini-jira
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## 2. Install backend dependencies

```bash
cd server
npm install
```

---

## 3. Configure backend environment variables

Create:

```text
server/.env
```

Add:

```env
PORT=5000

MONGO_URI=your_mongodb_atlas_connection_string

JWT_SECRET=your_jwt_secret

JWT_EXPIRES_IN=1d
```

### MongoDB URI

Your MongoDB Atlas connection string should follow this format:

```text
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/mini-jira
```

Do not commit `.env` to GitHub.

---

## 4. Start the backend

From the `server` directory:

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:5000
```

Test the API:

```text
http://localhost:5000/
```

Expected response:

```json
{
  "message": "Mini Jira API is running"
}
```

---

# Frontend Setup

Open another terminal.

From the project root:

```bash
cd client
npm install
```

---

## Frontend Environment Variables

Create:

```text
client/.env
```

Add:

```env
VITE_API_URL=http://localhost:5000/api
```

The frontend uses this URL to communicate with the backend.

---

## Start the frontend

```bash
npm run dev
```

Vite will provide a local URL similar to:

```text
http://localhost:5173
```

Open it in your browser.

---

# Running the Full Application

You need two terminals.

### Terminal 1 — Backend

```bash
cd server
npm run dev
```

### Terminal 2 — Frontend

```bash
cd client
npm run dev
```

Then open the frontend URL provided by Vite.

---

# API Documentation

## Authentication

### Register

```http
POST /api/auth/register
```

Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Current User

```http
GET /api/auth/me
```

Requires:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# Projects API

All project routes require authentication.

### Create Project

```http
POST /api/projects
```

Example:

```json
{
  "name": "E-Commerce Platform",
  "key": "ECOM",
  "description": "E-commerce application project"
}
```

### Get Projects

```http
GET /api/projects
```

### Get Project

```http
GET /api/projects/:id
```

### Update Project

```http
PUT /api/projects/:id
```

### Delete Project

```http
DELETE /api/projects/:id
```

### Get Project Members

```http
GET /api/projects/:id/members
```

### Add Project Member

```http
POST /api/projects/:id/members
```

Request:

```json
{
  "userId": "USER_ID"
}
```

---

# Tickets API

All ticket routes require authentication.

### Create Ticket

```http
POST /api/tickets
```

Example:

```json
{
  "title": "Fix checkout redirect",
  "description": "Users are redirected incorrectly after checkout.",
  "project": "PROJECT_ID",
  "type": "BUG",
  "priority": "HIGH",
  "assignedTo": "USER_ID",
  "labels": ["checkout", "frontend"]
}
```

### Get Tickets

```http
GET /api/tickets
```

### Search Tickets

```http
GET /api/tickets?search=checkout
```

### Filter by Project

```http
GET /api/tickets?project=PROJECT_ID
```

### Filter by Status

```http
GET /api/tickets?status=IN_PROGRESS
```

### Filter by Priority

```http
GET /api/tickets?priority=HIGH
```

Filters can also be combined:

```http
GET /api/tickets?project=PROJECT_ID&status=TODO&priority=HIGH
```

### Get Ticket

```http
GET /api/tickets/:id
```

### Update Ticket

```http
PUT /api/tickets/:id
```

### Assign Ticket

```http
PATCH /api/tickets/:id/assign
```

Request:

```json
{
  "assignedTo": "USER_ID"
}
```

### Update Ticket Status

```http
PATCH /api/tickets/:id/status
```

Request:

```json
{
  "status": "IN_PROGRESS"
}
```

### Delete Ticket

```http
DELETE /api/tickets/:id
```

---

# Authentication Flow

Mini Jira uses JWT-based authentication.

```text
User
 │
 │ Login
 ▼
React Client
 │
 │ POST /api/auth/login
 ▼
Express API
 │
 │ Validate credentials
 ▼
MongoDB
 │
 │ User found
 ▼
bcrypt password comparison
 │
 ▼
JWT generated
 │
 ▼
React Client
 │
 │ Store token
 ▼
Authenticated requests
 │
 │ Authorization: Bearer <token>
 ▼
Protected API routes
```

The frontend automatically attaches the JWT to API requests using an Axios interceptor.

---

# Ticket Statuses

Tickets can have one of the following statuses:

```text
TODO
IN_PROGRESS
IN_REVIEW
DONE
```

# Ticket Priorities

```text
LOW
MEDIUM
HIGH
```

# Ticket Types

```text
TASK
BUG
STORY
```

---

# Database

MongoDB Atlas is used as the production database.

The application uses three main collections:

```text
users
projects
tickets
```

Mongoose is used as the ODM layer.

### User

Stores:

- Name
- Email
- Hashed password
- Role

### Project

Stores:

- Project name
- Project key
- Description
- Creator
- Members

### Ticket

Stores:

- Ticket number
- Ticket key
- Title
- Description
- Project
- Type
- Status
- Priority
- Creator
- Assignee
- Labels

---

# Deployment

## Frontend

The React frontend is deployed using Vercel.

Production frontend:

https://mini-jira-gamma.vercel.app

The frontend environment variable is:

```env
VITE_API_URL=https://mini-jira-api.vercel.app/api
```

---

## Backend

The Express backend is deployed using Vercel.

Production API:

https://mini-jira-api.vercel.app

Production environment variables:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
```

`PORT` is not required for the Vercel deployment.

---

# Security

The application follows several basic security practices:

- Passwords are hashed using bcrypt
- JWT is used for authentication
- Protected routes require authentication
- MongoDB credentials are stored in environment variables
- Environment files are excluded from Git
- API requests use authorization headers
- Project membership is validated before accessing project resources

Never commit:

```text
.env
```

or database credentials to GitHub.

---

# Local Development

Recommended development workflow:

```bash
# Backend
cd server
npm run dev
```

```bash
# Frontend
cd client
npm run dev
```

---

# Future Improvements

Potential improvements include:

- Role-based access control
- Email notifications
- Team invitation system
- Pagination for tickets
- Ticket comments
- Activity history
- File attachments
- Advanced ticket filtering
- Drag-and-drop Kanban board
- Automated testing
- CI/CD pipeline
- Improved project member management

---

# License

This project was created as a project-based full-stack development application.
