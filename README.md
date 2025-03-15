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

npm run start:all

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