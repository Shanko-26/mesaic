# MesAIc Frontend

This is the frontend for the MesAIc application, an AI-driven tool for analyzing measurement data with natural language queries and collaboration features.

## Features

- **Data Visualization**: Interactive visualization of measurement data using Plotly.js
- **AI-Powered Analysis**: Natural language queries to analyze measurement data
- **Real-time Collaboration**: Collaborate with others in real-time using WebSockets
- **File Management**: Load and manage measurement files

## Tech Stack

- **Framework**: Next.js with App Router
- **UI**: React with TypeScript
- **Styling**: Tailwind CSS
- **Visualization**: Plotly.js
- **Real-time Communication**: Socket.IO

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
# or
yarn build
```

## Project Structure

- `src/app`: Next.js App Router pages
- `src/components`: React components
  - `Collaboration`: Components for real-time collaboration
  - `FileManagement`: Components for file management
  - `Query`: Components for AI queries
  - `Visualization`: Components for data visualization
- `src/services`: Service modules
  - `api.ts`: API service for communicating with the backend
  - `file.ts`: File service for handling file operations
  - `socket.ts`: Socket service for real-time collaboration
  - `visualization.ts`: Visualization service for handling plotting
  - `ai.ts`: AI service for handling natural language queries

## Backend Integration

The frontend communicates with two backend services:

1. **Python Server**: Handles file loading, data processing, and AI queries (port 5000)
2. **Collaboration Server**: Handles real-time collaboration using Socket.IO (port 3001)

Make sure both servers are running for full functionality.

## License

This project is licensed under the MIT License - see the LICENSE file for details.