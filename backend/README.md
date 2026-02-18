# Project Control System - Backend API

A complete Node.js + Express + MongoDB backend for the Project Control Management System.

## 🚀 Features

- **Authentication** - JWT based login/register with role-based access
- **User Management** - Admin, SubAdmin, Developer roles
- **Project Management** - Full CRUD with stages, team, milestones
- **Task Management** - Assign, track, complete tasks
- **Payment Tracking** - Client payments & Developer payments
- **Time Logging** - Track time spent on tasks
- **Activity Timeline** - Project activity logs
- **Remarks** - Add notes/remarks to projects

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   ├── auth.controller.js      # Auth logic
│   ├── user.controller.js      # User management
│   ├── project.controller.js   # Project CRUD
│   ├── task.controller.js      # Task management
│   ├── payment.controller.js   # Payments
│   └── timeLog.controller.js   # Time tracking
├── middleware/
│   ├── auth.middleware.js      # JWT & role protection
│   └── validation.middleware.js # Request validation
├── models/
│   ├── User.model.js
│   ├── Project.model.js
│   ├── Task.model.js
│   ├── Payment.model.js
│   ├── TimeLog.model.js
│   └── Activity.model.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── project.routes.js
│   ├── task.routes.js
│   ├── payment.routes.js
│   └── timeLog.routes.js
├── .env                    # Environment variables
├── package.json
├── seeder.js               # Demo data seeder
└── server.js               # Entry point
```

## 🛠️ Installation

1. **Install MongoDB** (if not installed)
   - Download from https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas cloud

2. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment**
   - Edit `.env` file with your settings
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/project_control_db
   JWT_SECRET=your_secret_key_here
   ```

4. **Seed Demo Data**
   ```bash
   npm run seed
   ```

5. **Start Server**
   ```bash
   # Development with auto-reload
   npm run dev
   
   # Production
   npm start
   ```

## 📋 API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| POST | `/api/auth/logout` | Logout user | Private |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/updatedetails` | Update user details | Private |
| PUT | `/api/auth/updatepassword` | Update password | Private |

### Users (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get single user |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/users/stats` | Get user stats |
| GET | `/api/users/developers` | Get developers list |

### Projects
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/projects` | Get all projects | Admin/SubAdmin |
| GET | `/api/projects/:id` | Get single project | Private |
| POST | `/api/projects` | Create project | Admin |
| PUT | `/api/projects/:id` | Update project | Admin |
| DELETE | `/api/projects/:id` | Delete project | Admin |
| PUT | `/api/projects/:id/stages/:stageId` | Update stage | Admin/SubAdmin |
| GET | `/api/projects/:id/activities` | Get activities | Private |
| POST | `/api/projects/:id/activities` | Add activity | Private |
| GET | `/api/projects/:id/remarks` | Get remarks | Private |
| POST | `/api/projects/:id/remarks` | Add remark | Private |

### Tasks
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/tasks` | Get all tasks | Private |
| GET | `/api/tasks/my` | Get my tasks | Private |
| GET | `/api/tasks/my/completed` | Get completed | Private |
| POST | `/api/tasks` | Create task | Admin/SubAdmin |
| PUT | `/api/tasks/:id` | Update task | Private |
| DELETE | `/api/tasks/:id` | Delete task | Admin |
| PUT | `/api/tasks/:id/time` | Update time | Private |

### Payments
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/payments/client/:projectId` | Get client payments | Admin |
| POST | `/api/payments/client` | Add client payment | Admin |
| GET | `/api/payments/developer/my` | Get my payments | Private |
| POST | `/api/payments/developer` | Add dev payment | Admin |

### Time Logs
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/timelogs` | Get all logs | Private |
| GET | `/api/timelogs/my` | Get my logs | Private |
| GET | `/api/timelogs/my/stats` | Get my stats | Private |
| POST | `/api/timelogs` | Create log | Private |
| DELETE | `/api/timelogs/:id` | Delete log | Private |

## 👥 User Roles

| Role | Description |
|------|-------------|
| **admin** | Full access - manage users, projects, payments |
| **subadmin** | Can assign tasks, view projects, update stages |
| **developer** | View assigned tasks, profile, payments |

## 🔐 Demo Credentials

```
Admin:     admin@company.com / admin123
SubAdmin:  subadmin@company.com / subadmin123
Developer: bilal@company.com / dev123
```

## 📝 Notes

- All protected routes require `Authorization: Bearer <token>` header
- Token is also stored in httpOnly cookie
- Passwords are hashed using bcrypt
- MongoDB indexes for better performance
