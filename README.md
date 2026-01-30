# DMS Project - Quick Start Guide

## Prerequisites
- Python 3.11+ installed
- Node.js and npm installed
- Backend dependencies installed
- Frontend dependencies installed

## Running the Application

### Option 1: Run Backend and Frontend Separately

#### Terminal 1 - Backend Server
```bash
cd backend
python run.py
```
The backend will start on `http://localhost:8000`

#### Terminal 2 - Frontend Server
```bash
cd frontend
npm run dev
```
The frontend will start on `http://localhost:5173` (or another port if 5173 is busy)

### Option 2: Using Batch Files (Windows)

#### Start Backend (Windows)
```bash
cd backend
start.bat
```

#### Start Frontend (Windows)
```bash
cd frontend
npm run dev
```

### Option 3: Using Shell Scripts (Linux/Mac)

#### Start Backend (Linux/Mac)
```bash
cd backend
chmod +x start.sh
./start.sh
```

#### Start Frontend (Linux/Mac)
```bash
cd frontend
npm run dev
```

## First Time Setup

### Backend Setup
```bash
cd backend
pip install fastapi uvicorn[standard] sqlalchemy python-jose[cryptography] passlib[bcrypt] pydantic pydantic-settings python-multipart python-dotenv email-validator bcrypt
```

### Frontend Setup
```bash
cd frontend
npm install
```

## Access the Application

1. **Frontend**: Open `http://localhost:5173` in your browser
2. **Backend API**: `http://localhost:8000`
3. **API Documentation**: `http://localhost:8000/docs`

## Default Admin Account

- **Email**: mampotjemabusela@gmail.com
- **Password**: Mampotje
- **Role**: Admin (full access)

## Troubleshooting

### Backend won't start
- Make sure Python is installed: `python --version`
- Check if port 8000 is available
- Verify `.env` file exists in `backend/` directory
- Install missing dependencies: `pip install -r requirements.txt`

### Frontend won't start
- Make sure Node.js is installed: `node --version`
- Check if port 5173 is available
- Install dependencies: `npm install`
- Check for errors in the terminal

### Can't connect to backend
- Make sure backend is running on port 8000
- Check CORS settings in `backend/app/main.py`
- Verify `VITE_API_BASE` environment variable (if set)

## Stopping the Servers

- **Backend**: Press `Ctrl+C` in the backend terminal
- **Frontend**: Press `Ctrl+C` in the frontend terminal
