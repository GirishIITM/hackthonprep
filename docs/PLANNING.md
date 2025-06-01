# Project Planning & Architecture

## Project Overview
This is a hackathon prep project with a Flask backend and React frontend architecture.

## Architecture
- **Backend**: Flask API running on port 5000
- **Frontend**: React application (likely running on a different port)
- **Database**: SQLite/PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with Flask-JWT-Extended

## Key Components

### Backend Structure
- `app.py`: Main Flask application with CORS configuration
- `routes/`: API endpoint modules
  - `task.py`: Task management endpoints
  - `auth.py`: Authentication endpoints  
  - `project.py`: Project management endpoints
- `models/`: SQLAlchemy database models
- `utils/`: Helper utilities

### Frontend Structure
- `src/`: React application source
- `utils/apiCalls/`: API client modules
- `pages/`: React page components

## CORS Configuration
The Flask backend is configured with CORS to allow cross-origin requests:
```python
CORS(app, 
     origins="*", 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials", "X-Requested-With"],  
     supports_credentials=False)
```

## URL Convention Fix (2024-12-19)
Fixed CORS redirect issue by ensuring backend routes match frontend API calls:
- Backend routes now support both `/tasks` and `/tasks/` to prevent redirects
- Frontend makes requests to `/tasks` without trailing slash
- This prevents the "CORS request external redirect not allowed" error

## Style & Conventions
- Python backend follows PEP8
- Use type hints and docstrings
- File size limit: 500 lines max per file
- Tests in `/tests` directory mirroring main structure 