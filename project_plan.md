# MesAIc: AI-Powered Collaborative Measurement & Calibration Tool

## Project Overview
MesAIc is a desktop-based measurement analysis and visualization tool with AI-powered insights and real-time collaboration capabilities. This MVP aims to prove the concept by implementing core functionalities with a focus on speed of development and a modern, minimalist UI.

## Project Timeline
- **Target**: Develop MVP as quickly as possible 
- **Focus**: Speed of implementation over extensive features
- **UI Priority**: Clean, modern, minimalist interface

## Core Requirements (MVP)

### 1. Data Handling & Visualization
- [x] Support for .mat (MATLAB) and .mf4 (MDF4) files
- [x] Basic parsing and rendering of datasets (up to 10MB)
- [x] Interactive visualization: Zoom, pan, multi-signal plotting
- [x] Signal selection with customizable views

### 2. AI-Driven Data Analysis
- [x] Natural language query interface
- [x] AI processing for text-based insights
- [x] Generation of automated visualizations based on queries
- [x] Integration with OpenAI API

### 3. Real-Time Collaboration & Annotation
- [x] Support for 2 concurrent users
- [x] Live annotations on plots
- [x] Shared session with comments and highlights
- [x] WebSocket-based synchronization
- [x] Basic version control for annotations

## Technical Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     Next.js Application                     │
│                                                             │
│  ┌─────────────────┐          ┌─────────────────────────┐  │
│  │                 │          │                         │  │
│  │  React          │◄────────►│  Next.js API Routes     │  │
│  │  Frontend       │          │  (File System Access)   │  │
│  │                 │          │                         │  │
│  └────────┬────────┘          └─────────────┬───────────┘  │
│           │                                 │              │
└───────────┼─────────────────────────────────┼──────────────┘
            │                                 │
            ▼                                 ▼
┌─────────────────────┐           ┌─────────────────────────┐
│                     │           │                         │
│  Python Services    │◄─────────►│  Local SQLite Database  │
│  (Data Processing)  │           │                         │
│                     │           │                         │
└──────────┬──────────┘           └─────────────────────────┘
           │
           ▼
┌─────────────────────┐           ┌─────────────────────────┐
│                     │           │                         │
│  WebSocket Server   │◄─────────►│  Other Client Browsers  │
│  (Collaboration)    │           │                         │
│                     │           │                         │
└─────────────────────┘           └─────────────────────────┘
```

### Tech Stack
| Component | Technology | Justification |
|-----------|------------|---------------|
| Frontend Framework | Next.js | Modern React framework with built-in API routes |
| Frontend | React with TypeScript | Modern, component-based UI development |
| UI Styling | Tailwind CSS | Rapid development of clean, minimalist interfaces |
| Data Processing | Python (NumPy, Pandas) | Powerful libraries for scientific data |
| MF4 Handling | asammdf (Python) | Specialized library for MF4 files |
| Visualization | Plotly.js | Interactive, modern visualizations |
| Backend Communication | Python Flask API | Efficient communication between JS and Python |
| AI | OpenAI API | Quick integration, high-quality responses |
| Collaboration | Socket.io | Real-time communication between clients |
| Storage | SQLite | Embedded, no setup required |

## Project Structure
```
mesaic/
├── src/                     # React frontend
│   ├── app/                 # Next.js app router
│   │   ├── page.tsx         # Main page component
│   │   ├── layout.tsx       # Root layout
│   │   └── api/             # API routes
│   ├── components/          # UI components
│   │   ├── MainLayout.tsx   # Main application layout
│   │   ├── Visualization/   # Visualization components
│   │   │   ├── PlotArea.tsx # Main plotting area
│   │   │   └── Controls.tsx # Plot controls
│   │   ├── Query/           # AI query components
│   │   │   ├── QueryInput.tsx  # Query input interface
│   │   │   └── Results.tsx     # Query results display
│   │   ├── FileManagement/  # File management components
│   │   │   └── FileSelector.tsx # File selection interface
│   │   └── Collaboration/   # Collaboration components
│   │       ├── Session.tsx  # Session management
│   │       └── Annotations.tsx # Annotation interface
│   ├── services/            # Frontend services
│   │   ├── api.ts           # API communication
│   │   ├── socket.ts        # WebSocket client
│   │   ├── file.ts          # File handling
│   │   ├── ai.ts            # AI service
│   │   └── visualization.ts # Visualization service
│
├── python/                  # Python services
│   ├── server.py            # Python service entry point
│   ├── data/                # Data handling
│   │   ├── __init__.py
│   │   ├── loader.py        # File loading (.mat, .mf4)
│   │   └── processor.py     # Data processing utilities
│   ├── ai/                  # AI integration
│   │   ├── __init__.py
│   │   └── query.py         # Query processing
│   └── api/                 # API endpoints
│       ├── __init__.py
│       ├── file.py          # File operations
│       └── ai.py            # AI operations
│
├── server/                  # Collaboration server
│   └── index.js             # WebSocket server
│
├── public/                  # Static assets
│
├── start-mesaic.bat         # Windows startup script
├── start-mesaic.ps1         # PowerShell startup script
├── start-mesaic.sh          # macOS/Linux startup script
├── package.json             # Node.js dependencies
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── requirements.txt         # Python dependencies
└── README.md                # Project documentation
```

## Development Phases

### Phase 1: Basic Application Structure
- [x] Set up Next.js project with React and TypeScript
- [x] Create Python microservice for data processing
- [x] Implement API communication between Next.js and Python
- [x] Implement file loading for .mat files
- [x] Implement file loading for .mf4 files
- [x] Create basic UI layout with Tailwind CSS

### Phase 2: Core Functionality
- [x] Implement Plotly.js visualization
- [x] Create signal selection and customizable views
- [x] Add basic annotation capabilities
- [x] Set up OpenAI API integration
- [x] Implement natural language query processing
- [x] Create AI-driven visualization generation

### Phase 3: Collaboration Features
- [x] Set up Socket.io server
- [x] Implement client-server communication
- [x] Create shared session management
- [x] Add real-time annotation syncing
- [x] Implement basic version control for annotations
- [x] Test multi-user scenarios

### Phase 4: Finalization
- [x] Optimize performance for larger datasets
- [x] Improve UI/UX based on testing
- [x] Create unified startup scripts
- [x] Create documentation and usage examples
- [x] Final testing and bug fixes

## Getting Started

### Prerequisites
- Node.js 16+
- Python 3.8+
- npm 7+

### Setup Instructions
1. Clone the repository
2. Install Node.js dependencies: `npm install`
3. Create a Python virtual environment: `python -m venv venv`
4. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
5. Install Python dependencies: `pip install -r requirements.txt`
6. Start all servers with a single command:
   - Windows: `start-mesaic.bat`
   - PowerShell: `.\start-mesaic.ps1`
   - macOS/Linux: `./start-mesaic.sh` (after making it executable with `chmod +x start-mesaic.sh`)

## Progress Tracking

### Current Status
- [x] Project completed successfully
- [x] All core functionality implemented
- [x] Collaboration features working
- [x] Unified startup scripts created

### Key Achievements
- [x] Implemented data visualization with Plotly.js
- [x] Created AI-powered natural language query system
- [x] Built real-time collaboration with Socket.io
- [x] Developed unified startup scripts for all platforms
- [x] Enhanced UI with modern, clean design using Tailwind CSS
- [x] Optimized data processing for .mat and .mf4 files

### Future Enhancements
- [ ] Add support for larger datasets (>10MB)
- [ ] Implement more advanced AI visualization capabilities
- [ ] Add user authentication and permission management
- [ ] Create export functionality for reports and findings
- [ ] Develop offline mode for standalone usage
- [ ] Add support for real-time ECU data via MCP integration 