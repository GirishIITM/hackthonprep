# SynergySphere API Testing with Postman

This document provides comprehensive test cases for the SynergySphere API using Postman, including authentication, task management, and project management functionality.

## 📋 Prerequisites

1. **Backend Server Running**: Ensure your Flask backend is running on `http://localhost:5000`
2. **Admin User Setup**: Make sure you have an admin user with credentials:
   - Email: `admin@synergysphere.com`
   - Password: `12345678`
3. **Postman Installed**: Download and install [Postman](https://www.postman.com/downloads/)

## 🚀 Setup Instructions

### 1. Import the Collection

1. Open Postman
2. Click "Import" in the top left
3. Select the `postman_tests.json` file from your project directory
4. The collection "SynergySphere API Tests" will be imported

### 2. Configure Environment Variables

The collection uses the following variables (automatically set during execution):
- `base_url`: http://localhost:5000 (pre-configured)
- `access_token`: JWT access token (set after login)
- `refresh_token`: JWT refresh token (set after login)
- `user_id`: User ID (set after login)
- `project_id`: Project ID (set after project creation)
- `task_id`: Task ID (set after task creation)

## 📊 Test Collection Structure

### 1. Authentication Tests
- **Login Admin**: Authenticates with admin credentials and saves tokens
- **Get Profile**: Retrieves user profile information

### 2. Project CRUD Tests
- **Create Project**: Creates a new test project
- **Get All Projects**: Retrieves all projects for the user
- **Get Single Project**: Retrieves specific project details
- **Update Project**: Updates project name and description
- **Delete Project**: Removes the project

### 3. Task CRUD Tests
- **Create Project for Tasks**: Sets up a project for task testing
- **Create Task (Project-based)**: Creates task via `/projects/{id}/tasks` endpoint
- **Create Task (Direct)**: Creates task via `/tasks/` endpoint
- **Get All Tasks**: Retrieves all tasks assigned to the user
- **Update Task (Project-based)**: Updates task via project endpoint
- **Update Task (Direct)**: Updates task via direct endpoint
- **Delete Task (Project-based)**: Deletes task (project owner only)
- **Delete Task (Direct)**: Deletes task via direct endpoint

### 4. Error Handling & Edge Cases
- **Unauthorized Access**: Tests access without authentication
- **Missing Required Fields**: Tests validation errors
- **Non-existent Resources**: Tests 404 error handling

### 5. Advanced Features
- **Add Member to Project**: Tests project membership functionality
- **Create Task with Assignment**: Tests task assignment
- **Token Refresh**: Tests JWT token refresh mechanism
- **Logout**: Tests token revocation

## 🏃‍♂️ Running the Tests

### Option 1: Run Individual Tests
1. Select any test from the collection
2. Click "Send" to execute
3. View the test results in the "Test Results" tab

### Option 2: Run Entire Collection
1. Click on the collection name "SynergySphere API Tests"
2. Click "Run collection"
3. Select all tests or specific folders
4. Click "Run SynergySphere API Tests"
5. View the test runner with pass/fail results

### Option 3: Run Specific Folders
1. Right-click on a folder (e.g., "Authentication", "Projects", "Tasks")
2. Select "Run folder"
3. View results in the test runner

## 🔍 Test Execution Order

**Recommended execution order for best results:**

1. **Authentication** → Login Admin (must run first)
2. **Projects** → Create, Read, Update, Delete operations
3. **Tasks** → Create project first, then task operations
4. **Error Handling** → Can run independently
5. **Advanced Features** → Run after basic CRUD operations

## ✅ Expected Test Results

### Successful Test Run Should Show:

**Authentication (2 tests)**
- ✅ Login Admin - Status 200, tokens saved
- ✅ Get Profile - Status 200, profile data returned

**Projects (5 tests)**
- ✅ Create Project - Status 201, project created
- ✅ Get All Projects - Status 200, array returned
- ✅ Get Single Project - Status 200, project details
- ✅ Update Project - Status 200, project updated
- ✅ Delete Project - Status 200, project deleted

**Tasks (8 tests)**
- ✅ Create Project for Tasks - Status 201
- ✅ Create Task (Project-based) - Status 201
- ✅ Create Task (Direct) - Status 201
- ✅ Get All Tasks - Status 200, array returned
- ✅ Update Task (Project-based) - Status 200
- ✅ Update Task (Direct) - Status 200
- ✅ Delete Task (Project-based) - Status 200
- ✅ Delete Task (Direct) - Status 200

## 🐛 Troubleshooting

### Common Issues:

1. **401 Unauthorized Error**
   - Solution: Run "Login Admin" test first to get authentication tokens

2. **404 Not Found Error**
   - Solution: Ensure the backend server is running on port 5000
   - Check that the admin user exists in the database

3. **500 Internal Server Error**
   - Solution: Check backend server logs for detailed error information
   - Verify database connection and schema

4. **Test Failures**
   - Solution: Run tests in the recommended order
   - Clear collection variables and start fresh with login

### Backend Server Issues:

```bash
# Start the backend server
cd hackthonprep/backend
python app.py

# Check if server is running
curl http://localhost:5000/auth/profile
```

### Database Issues:

```bash
# If you need to reset the database
cd hackthonprep/backend
python -c "from app import app; from extensions import db; app.app_context().push(); db.drop_all(); db.create_all()"
```

## 📝 Test Data Used

### Projects:
- **Name**: "Test Project" / "Task Test Project"
- **Description**: Descriptive text for testing

### Tasks:
- **Title**: "Test Task" / "Direct Task"
- **Description**: Descriptive text
- **Due Date**: "2024-12-31T23:59:59Z"
- **Status**: "To Do" / "In Progress" / "Done"

### Authentication:
- **Username**: "admin@synergysphere.com"
- **Email**: "admin@synergysphere.com"
- **Password**: "12345678"

## 🔐 Security Notes

- Tests use JWT Bearer token authentication
- Tokens are automatically managed by the collection
- Refresh token functionality is tested
- Logout properly revokes tokens

## 📊 API Endpoints Tested

### Authentication Endpoints:
- `POST /auth/login`
- `GET /auth/profile`
- `POST /auth/refresh`
- `DELETE /auth/logout`

### Project Endpoints:
- `POST /projects`
- `GET /projects`
- `GET /projects/{id}`
- `PUT /projects/{id}`
- `DELETE /projects/{id}`
- `POST /projects/{id}/members`

### Task Endpoints:
- `POST /projects/{id}/tasks`
- `POST /tasks/`
- `GET /tasks/`
- `PUT /tasks/{id}`
- `DELETE /tasks/{id}`

## 📈 Monitoring & Reporting

The test collection includes comprehensive assertions for:
- HTTP status codes
- Response data structure
- Required fields presence
- Error message validation
- Token management
- Variable persistence

Each test includes detailed logging and variable extraction for debugging purposes. 