# MesAIc Backend Setup

This document provides instructions for setting up and running the backend services for the MesAIc application.

## Overview

The MesAIc backend consists of two main components:

1. **Python Server**: Handles data processing, file loading, and AI query processing
2. **Node.js WebSocket Server**: Manages real-time collaboration features

## Prerequisites

- Python 3.8+ with pip
- Node.js 16+ with npm
- Virtual environment (recommended for Python)

## Python Server Setup

The Python server handles data processing and AI query processing.

### 1. Set up a Python virtual environment (recommended)

```bash
# Navigate to the project root
cd /path/to/mesaic

# Create a virtual environment if not already created
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Python server

```bash
# Navigate to the project root
cd /path/to/mesaic

# Run the server (default port is 5000)
python python/server.py

# Optionally specify a different port
python python/server.py 5001
```

The Python server will start and listen on http://localhost:5000 (or your specified port).

## Node.js WebSocket Server Setup

The WebSocket server handles real-time collaboration features.

### 1. Install Node.js dependencies

```bash
# Navigate to the project root
cd /path/to/mesaic

# Install dependencies
npm install
```

### 2. Run the WebSocket server

```bash
# Navigate to the project root
cd /path/to/mesaic

# Run the server (default port is 3001)
node server/index.js
```

The WebSocket server will start and listen on http://localhost:3001.

## Testing the Backend

### Testing the Python Server

You can test if the Python server is running by accessing the health endpoint:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"ok","message":"Server is running"}
```

### Testing the WebSocket Server

The WebSocket server doesn't have a direct HTTP endpoint for testing, but you can verify it's running by checking the console output after starting it.

## Troubleshooting

### Python Server Issues

- **ModuleNotFoundError**: Make sure you've activated the virtual environment and installed all dependencies.
- **Port already in use**: Try specifying a different port when starting the server.
- **File not found errors**: Make sure the file paths you're trying to load exist on your system.

### WebSocket Server Issues

- **Port already in use**: Check if another process is using port 3001 and either stop that process or modify the port in `server/index.js`.
- **Connection refused**: Make sure the server is running and the client is connecting to the correct address.

## Development Notes

- The Python server uses a simple HTTP server implementation.
- The WebSocket server uses Socket.IO for real-time communication.
- Both servers have CORS enabled for development purposes.

## File Structure

```
mesaic/
├── python/                # Python server code
│   ├── server.py          # Main server implementation
│   ├── ai/                # AI-related code
│   │   └── query_processor.py  # Natural language query processor
│   └── data/              # Data processing code
│       └── loader.py      # File loader implementation
├── server/                # WebSocket server code
│   ├── index.js           # Main server implementation
│   └── session.js         # Session management
└── requirements.txt       # Python dependencies
``` 