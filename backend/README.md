# DMS Backend Server

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install fastapi uvicorn[standard] sqlalchemy python-jose[cryptography] passlib[bcrypt] pydantic pydantic-settings python-multipart python-dotenv
   ```

2. **Start the server:**
   ```bash
   python run.py
   ```
   
   Or on Windows:
   ```bash
   start.bat
   ```
   
   Or on Linux/Mac:
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

3. **The server will start on:** `http://localhost:8000`

4. **API Documentation:** `http://localhost:8000/docs`

## Configuration

The `.env` file contains the configuration. For local development, it uses SQLite database.

## Troubleshooting

- **Port 8000 already in use:** Change the port in `run.py` or stop the other service
- **Database errors:** Make sure the `uploads` directory exists or create it manually
- **Import errors:** Make sure you're running from the `backend` directory
