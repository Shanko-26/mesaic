# MesAIc AI Integration Structure

This document outlines the folder structure and organization for implementing the AI integration components in MesAIc.

## Folder Structure

```
mesaic/
├── python/                        # Python backend
│   ├── server.py                  # Main server entry point (update with new endpoints)
│   ├── data/                      # Data handling
│   │   ├── __init__.py
│   │   ├── loader.py              # File loading (.mat, .mf4) - existing
│   │   └── signal_processor.py    # NEW: Signal processing operations
│   ├── ai/                        # AI integration
│   │   ├── __init__.py
│   │   ├── openai_integration.py  # OpenAI API integration - existing
│   │   ├── query_processor.py     # Query processing - existing
│   │   └── query_engine.py        # NEW: AI query engine for signal operations
│   └── requirements.txt           # Update with new dependencies
│
├── src/                           # Frontend
│   ├── services/                  # Frontend services
│   │   ├── ai.ts                  # AI service - update with new methods
│   │   ├── api.ts                 # API communication - update with new endpoints
│   │   ├── file.ts                # File handling - existing
│   │   ├── socket.ts              # WebSocket client - existing
│   │   └── visualization.ts       # Visualization service - update for derived signals
│   ├── components/                # UI components
│   │   ├── EnhancedLayout.tsx     # Main layout - update for AI chat integration
│   │   └── Visualization/         # Visualization components - update as needed
│   ├── types/                     # TypeScript type definitions
│   │   └── signal.ts              # NEW: Types for signal operations
│   └── hooks/                     # React hooks
│       └── useSignalProcessing.ts # NEW: Hook for signal processing operations
│
└── server/                        # Collaboration server
    ├── index.js                   # WebSocket server - update for AI-generated signals
    └── session.js                 # Session management - update for AI-generated signals
```

## Component Responsibilities

### Python Backend

#### 1. `python/data/signal_processor.py`
- Implements the `SignalProcessor` class with methods for:
  - Basic operations (add, subtract, multiply, divide)
  - Signal transformations (absolute value, scaling)
  - Filtering operations (low-pass, high-pass, band-pass)
  - Derivative calculations (1st and 2nd order)
  - Frequency domain analysis (FFT)
  - Statistical analysis (min, max, mean, median, std, rms)
- Each method takes signal data and parameters, returns processed data with metadata

#### 2. `python/ai/query_engine.py`
- Implements the `AIQueryEngine` class that:
  - Uses LangChain and OpenAI to parse natural language queries
  - Extracts intended operations and parameters
  - Returns structured results that can be executed by the Signal Processor
  - Provides enhanced error handling for incomplete queries
  - Implements specialized handlers for different operation types
  - Offers context-aware responses with examples for users
- Uses Pydantic models for type safety and validation
- Includes robust fallback parsing for handling JSON parsing errors
- Features operation-specific guidance for filter, scale, derivative, and other operations

#### 3. `python/server.py` (Updates)
- Add new endpoints:
  - `/api/process-signal`: Execute signal processing operations
  - `/api/process-ai-query`: Process natural language queries with AI
- Improved error handling and parameter mapping for signal operations

### Frontend

#### 1. `src/services/ai.ts` (Updates)
- Add new methods:
  - `processAIQuery()`: Send queries to the AI engine
  - `executeSignalOperation()`: Execute signal operations via the API
- Enhanced default messages with categorized examples
- Improved user guidance for different types of operations
- Better organization of suggestions into Data Analysis, Signal Processing, and Interactive Analysis categories

#### 2. `src/services/visualization.ts` (Updates)
- Update `generatePlotData()` to handle derived signals
- Add support for different visualization types based on signal metadata

#### 3. `src/types/signal.ts` (New)
- Define TypeScript interfaces for:
  - `SignalOperation`: Structure of a signal operation
  - `AIQueryResult`: Result from the AI query engine
  - `DerivedSignal`: Structure of a derived signal

#### 4. `src/hooks/useSignalProcessing.ts` (New)
- Create a custom hook that:
  - Manages state for derived signals
  - Provides methods for executing signal operations
  - Handles loading states and errors

#### 5. `src/components/EnhancedLayout.tsx` (Updates)
- Update the chat component to:
  - Process AI queries for signal operations
  - Display results and new signals
  - Handle errors and loading states

### Collaboration Server

#### 1. `server/index.js` (Updates)
- Add support for:
  - Sharing AI-generated signals between users
  - Synchronizing signal operations across clients
  - Broadcasting new signals to all users in a session

## Implementation Order

For a smooth implementation process, follow this order:

1. **Python Backend**:
   - Implement `signal_processor.py` first
   - Add the signal processing endpoint to `server.py`
   - Implement `query_engine.py`
   - Add the AI query endpoint to `server.py`

2. **Frontend**:
   - Create `types/signal.ts`
   - Update `services/ai.ts` with new methods
   - Create `hooks/useSignalProcessing.ts`
   - Update `services/visualization.ts` for derived signals
   - Update `components/EnhancedLayout.tsx` for AI chat integration

3. **Collaboration Server**:
   - Update `server/index.js` for AI-generated signals
   - Update `server/session.js` for storing derived signals

## Dependencies to Add

### Python Dependencies
```
langchain==0.0.267
pydantic==2.0.3
openai==0.27.8
scipy==1.11.1
numpy==1.24.3
```

### Frontend Dependencies
```
# No new dependencies needed - using existing libraries
```

## Configuration Updates

### Environment Variables
Add the following to `.env`:
```
OPENAI_API_KEY=your_openai_api_key
```

## Testing Strategy

1. **Unit Tests**:
   - Test each signal processing operation individually
   - Test AI query parsing with sample queries

2. **Integration Tests**:
   - Test end-to-end flow from query to visualization
   - Test collaboration features with multiple clients

3. **User Acceptance Testing**:
   - Test with real user queries and data
   - Gather feedback on AI response quality and accuracy 