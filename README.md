# MesAIc - AI-Driven Signal Analysis Platform

MesAIc is an application for analyzing measurement data using AI techniques. It features an enhanced UI with a modern three-panel layout for improved signal visualization and analysis. The application consists of a Python backend server, a Node.js collaboration server, and a React frontend.

## Features

- **Enhanced Three-Panel Layout**:
  - Collapsible left sidebar for file management and signal selection
  - Central visualization area with interactive plots
  - Collapsible right panel for AI chat and data analysis
  - Bottom bar for annotations and collaboration

- **Data Management**:
  - Load and visualize measurement data from .mat and .mf4 files
  - Select and filter signals for analysis
  - View signal statistics and metadata

- **Interactive Visualization**:
  - Zoom, pan, and reset plot views
  - Position cursors for precise data analysis
  - View signal values at cursor positions

- **AI-Powered Analysis**:
  - Query the data using natural language
  - Get instant insights about signal patterns
  - Compare multiple signals with AI assistance

- **Collaboration and Annotation**:
  - Add annotations at specific time points
  - Collaborate with others in real-time
  - Share findings and insights

## Quick Start

### Using the Startup Scripts

We've provided convenient scripts to start all three servers with a single command:

#### For Windows Command Prompt:

```
start-mesaic.bat
```

This will:
1. Kill any existing Node.js processes (to avoid port conflicts)
2. Start the Python server in a new window
3. Start the Node.js collaboration server in a new window
4. Start the Next.js development server in another window
5. Keep a control window open where you can press any key to shut down all servers

#### For PowerShell:

```
.\start-mesaic.ps1
```

This will:
1. Kill any existing Node.js processes
2. Start the Python server in a new window
3. Start the Node.js collaboration server in a new window
4. Start the Next.js development server in another window
5. Keep the PowerShell window open until you press Ctrl+C to shut down all servers

#### For macOS/Linux:

First, make the script executable:
```
chmod +x start-mesaic.sh
```

Then run it:
```
./start-mesaic.sh
```

This will:
1. Kill any existing Node.js processes
2. Start the Python server in the background
3. Start the Node.js collaboration server in the background
4. Start the Next.js development server in the background
5. Log output to python_server.log, collab_server.log, and nextjs_server.log
6. Keep the terminal window open until you press Ctrl+C to shut down all servers

### Manual Startup

If you prefer to start the servers manually:

1. Start the Python server:
   ```
   python python/server.py
   ```

2. Start the Node.js collaboration server:
   ```
   node server/index.js
   ```

3. In a separate terminal, start the Next.js development server:
   ```
   npm run dev
   ```

## Accessing the Application

Once all servers are running:

- The Python backend API is available at: http://localhost:5000
- The Node.js collaboration server is available at: http://localhost:3001
- The Next.js frontend is available at: http://localhost:3000

## Requirements

- Python 3.8+
- Node.js 16+
- npm 7+

## Python Dependencies

- numpy
- pandas
- scipy
- asammdf (for .mf4 files)
- flask
- flask-cors

## JavaScript Dependencies

- React
- Plotly.js
- Tailwind CSS
- Socket.IO (for real-time collaboration)

## Project Structure

- `electron/`: Electron main process
- `src/`: React frontend
  - `components/`: UI components including the EnhancedLayout
  - `services/`: Data and visualization services
  - `data/`: Sample data and utilities
- `python/`: Python services for data processing
- `server/`: Collaboration server

## License

This project is licensed under the MIT License - see the LICENSE file for details. 