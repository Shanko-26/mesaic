# MesAIc AI Integration Roadmap

This document outlines the plan for integrating AI-powered data manipulation and visualization capabilities into the MesAIc application.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Implementation Phases](#implementation-phases)
  - [Phase 1: Core Signal Processing](#phase-1-core-signal-processing)
  - [Phase 2: AI Integration](#phase-2-ai-integration)
  - [Phase 3: UI Integration](#phase-3-ui-integration)
  - [Phase 4: Advanced Features](#phase-4-advanced-features)
- [Technical Details](#technical-details)
  - [Signal Processor](#signal-processor)
  - [AI Query Engine](#ai-query-engine)
  - [Frontend Integration](#frontend-integration)
- [Progress Tracking](#progress-tracking)

## Architecture Overview

The AI integration architecture consists of four main components:

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                          │
│  ┌─────────────────┐          ┌─────────────────────────┐   │
│  │  Signal Display │◄────────►│  AI Chat Interface      │   │
│  │  & Visualization│          │                         │   │
│  └────────┬────────┘          └─────────────┬───────────┘   │
│           │                                 │               │
└───────────┼─────────────────────────────────┼───────────────┘
            │                                 │
            ▼                                 ▼
┌─────────────────────┐           ┌─────────────────────────┐
│                     │           │                         │
│  WebSocket Server   │◄─────────►│  AI Query Engine        │
│  (Collaboration)    │           │  (LangChain + OpenAI)   │
│                     │           │                         │
└──────────┬──────────┘           └─────────────┬───────────┘
           │                                    │
           ▼                                    ▼
┌─────────────────────┐           ┌─────────────────────────┐
│                     │           │                         │
│  Signal Processing  │◄─────────►│  Function Execution     │
│  (NumPy/SciPy)      │           │  Layer                  │
│                     │           │                         │
└─────────────────────┘           └─────────────────────────┘
```

### Key Components:

1. **AI Query Engine**: Parses natural language queries and maps them to signal processing operations
2. **Function Execution Layer**: Defines and executes signal processing operations
3. **WebSocket Server**: Enables real-time collaboration and updates
4. **React Frontend**: Displays AI-generated signals and visualizations

## Implementation Phases

### Phase 1: Core Signal Processing
**Timeline**: 1-2 weeks  
**Goal**: Implement the foundation for signal processing operations

#### Tasks:
- [x] Define the `SignalProcessor` class structure
- [x] Implement basic operations (add, subtract, multiply, divide)
- [x] Implement filtering operations (low-pass, high-pass, etc.)
- [x] Implement derivative calculations
- [x] Implement FFT and frequency domain analysis
- [x] Add Python server endpoint for signal processing
- [ ] Create unit tests for signal processing functions

#### Key Deliverable: Signal Processor Class

```python
# python/data/signal_processor.py
import numpy as np
from scipy import signal
from scipy.fft import fft, fftfreq

class SignalProcessor:
    def __init__(self):
        self.operations = {
            'add': self.add_signals,
            'subtract': self.subtract_signals,
            'multiply': self.multiply_signals,
            'divide': self.divide_signals,
            'abs': self.absolute_value,
            'scale': self.scale_signal,
            'derivative': self.compute_derivative,
            'filter': self.filter_signal,
            'fft': self.apply_fft,
            'stats': self.compute_statistics
        }
    
    def execute_operation(self, operation_type, signals_data, parameters=None):
        """Execute a signal operation"""
        if parameters is None:
            parameters = {}
            
        if operation_type not in self.operations:
            raise ValueError(f"Unknown operation: {operation_type}")
            
        return self.operations[operation_type](signals_data, **parameters)
    
    def add_signals(self, signals_data, signal1=None, signal2=None):
        """Add two signals"""
        if signal1 is None or signal2 is None:
            raise ValueError("Must specify two signals to add")
            
        if signal1 not in signals_data or signal2 not in signals_data:
            raise ValueError(f"Signal not found: {signal1 if signal1 not in signals_data else signal2}")
            
        return {
            'data': np.add(signals_data[signal1], signals_data[signal2]),
            'metadata': {
                'operation': 'add',
                'inputs': [signal1, signal2],
                'description': f"Sum of {signal1} and {signal2}"
            }
        }
    
    # Additional methods will be implemented here
```

#### Python Server Endpoint

```python
# In python/server.py - Add to the existing handler class

def _handle_process_signal(self, request):
    """Handle signal processing requests"""
    try:
        operation_type = request.get('operation')
        signals_data = request.get('signals', {})
        parameters = request.get('parameters', {})
        
        if not operation_type:
            raise ValueError("No operation specified")
        
        # Initialize signal processor
        from data.signal_processor import SignalProcessor
        processor = SignalProcessor()
        
        # Execute the operation
        result = processor.execute_operation(operation_type, signals_data, parameters)
        
        # Return the processed signal
        self._set_headers()
        response = {
            'status': 'success',
            'result': result
        }
        self.wfile.write(json.dumps(response).encode())
        
    except Exception as e:
        self._handle_error(f"Error processing signal: {str(e)}")
        traceback.print_exc()
```

### Phase 2: AI Integration
**Timeline**: 1-2 weeks  
**Goal**: Implement AI query parsing and function calling

#### Tasks:
- [x] Set up LangChain with OpenAI integration
- [x] Implement the AI query engine
- [x] Create models for signal operations
- [x] Implement query parsing logic
- [x] Add Python server endpoint for AI queries
- [ ] Test AI query parsing with sample queries

#### Key Deliverable: AI Query Engine

```python
# python/ai/query_engine.py
from langchain.llms import OpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class SignalOperation(BaseModel):
    """Signal operation to be executed"""
    operation: str = Field(description="The operation to perform (add, subtract, filter, derivative, etc.)")
    signals: List[str] = Field(description="List of signal names to operate on")
    parameters: Optional[Dict[str, Any]] = Field(default=None, description="Parameters for the operation")
    output_name: str = Field(description="Name for the output signal")

class AIQueryResult(BaseModel):
    """Result of an AI query"""
    operations: List[SignalOperation] = Field(description="List of operations to perform")
    explanation: str = Field(description="Explanation of what the operations will do")

class AIQueryEngine:
    def __init__(self, api_key=None):
        self.llm = OpenAI(temperature=0, api_key=api_key)
        self.parser = PydanticOutputParser(pydantic_object=AIQueryResult)
        
        self.prompt_template = PromptTemplate(
            input_variables=["query", "available_signals"],
            partial_variables={"format_instructions": self.parser.get_format_instructions()},
            template="""
            You are an AI assistant for signal processing. Parse the user's query into specific signal operations.
            
            Available signals: {available_signals}
            
            User query: {query}
            
            Based on the user's query, determine the signal processing operations to perform.
            
            {format_instructions}
            """
        )
        
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt_template)
    
    def process_query(self, query, available_signals):
        """Process a natural language query and return operations to perform"""
        signals_str = ", ".join(available_signals)
        
        result = self.chain.run(query=query, available_signals=signals_str)
        
        try:
            parsed_result = self.parser.parse(result)
            return parsed_result
        except Exception as e:
            print(f"Error parsing AI response: {e}")
            print(f"Raw response: {result}")
            # Fallback to a simple response
            return AIQueryResult(
                operations=[],
                explanation=f"I couldn't understand how to process your request. Error: {str(e)}"
            )
```

#### Python Server Endpoint for AI Queries

```python
# In python/server.py - Add to the existing handler class

def _handle_process_ai_query(self, request):
    """Handle AI query processing"""
    try:
        query = request.get('query')
        available_signals = request.get('availableSignals', [])
        
        if not query:
            raise ValueError("No query provided")
        
        # Initialize AI query engine
        from ai.query_engine import AIQueryEngine
        engine = AIQueryEngine()
        
        # Process the query
        result = engine.process_query(query, available_signals)
        
        # Return the result
        self._set_headers()
        response = {
            'status': 'success',
            'operations': result.operations,
            'explanation': result.explanation
        }
        self.wfile.write(json.dumps(response).encode())
        
    except Exception as e:
        self._handle_error(f"Error processing AI query: {str(e)}")
        traceback.print_exc()
```

### Phase 3: UI Integration
**Timeline**: 1-2 weeks  
**Goal**: Integrate AI capabilities into the frontend

#### Tasks:
- [x] Create frontend service for AI queries
- [x] Update chat component to handle signal operations
- [ ] Enhance visualization service for derived signals
- [ ] Add UI elements to display AI-generated signals
- [ ] Implement error handling and user feedback
- [ ] Test end-to-end functionality

#### Key Deliverable: Frontend AI Service

```typescript
// src/services/ai.ts
export interface SignalOperation {
  operation: string;
  signals: string[];
  parameters?: Record<string, any>;
  outputName: string;
}

export interface AIQueryResult {
  operations: SignalOperation[];
  explanation: string;
}

export async function processAIQuery(
  query: string,
  availableSignals: string[]
): Promise<AIQueryResult> {
  try {
    const response = await fetch('/api/process-ai-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        availableSignals
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error processing AI query:', error);
    throw error;
  }
}

export async function executeSignalOperation(
  operation: SignalOperation,
  signalsData: Record<string, number[]>
): Promise<{
  data: number[];
  metadata: Record<string, any>;
}> {
  try {
    const response = await fetch('/api/process-signal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: operation.operation,
        signals: signalsData,
        parameters: operation.parameters
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error('Error executing signal operation:', error);
    throw error;
  }
}
```

#### Enhanced Chat Component

```typescript
// In EnhancedLayout.tsx - Update the chat handling

// Add state for derived signals
const [derivedSignals, setDerivedSignals] = useState<Record<string, {
  data: number[];
  metadata: Record<string, any>;
}>>({}); 

// Handle AI chat for signal processing
const handleChatSubmit = async (message: string) => {
  try {
    // Add user message to chat
    setChatMessages([...chatMessages, { type: 'user', text: message }]);
    setIsSendingMessage(true);
    
    // Get available signals
    const availableSignals = fileData ? 
      [...fileData.signals, ...Object.keys(derivedSignals)] : [];
    
    // Process the query with AI
    const aiResult = await processAIQuery(message, availableSignals);
    
    // If there are operations to perform
    if (aiResult.operations.length > 0) {
      // Create a temporary message to show processing status
      setChatMessages([
        ...chatMessages, 
        { type: 'user', text: message },
        { type: 'assistant', text: `Processing your request: ${aiResult.explanation}` }
      ]);
      
      // Get the signals data
      const signalsData: Record<string, number[]> = {};
      
      // Add original signals
      if (fileData && fileData.data) {
        Object.keys(fileData.data).forEach(signal => {
          signalsData[signal] = fileData.data[signal];
        });
      }
      
      // Add derived signals
      Object.keys(derivedSignals).forEach(signal => {
        signalsData[signal] = derivedSignals[signal].data;
      });
      
      // Execute each operation
      const newDerivedSignals: Record<string, {
        data: number[];
        metadata: Record<string, any>;
      }> = {};
      
      for (const operation of aiResult.operations) {
        const result = await executeSignalOperation(operation, signalsData);
        
        // Add the result to derived signals
        newDerivedSignals[operation.outputName] = result;
        
        // Add to signals data for potential use in subsequent operations
        signalsData[operation.outputName] = result.data;
      }
      
      // Update derived signals
      setDerivedSignals({
        ...derivedSignals,
        ...newDerivedSignals
      });
      
      // Create a response message with the results
      const responseMessage = `${aiResult.explanation}\n\nI've created the following new signals:\n${
        Object.entries(newDerivedSignals)
          .map(([name, signal]) => `- ${name}: ${signal.metadata.description || 'Processed signal'}`)
          .join('\n')
      }`;
      
      // Update chat messages
      setChatMessages([
        ...chatMessages,
        { type: 'user', text: message },
        { type: 'assistant', text: responseMessage }
      ]);
      
      // Automatically select the new signals
      setSelectedSignals([
        ...selectedSignals,
        ...Object.keys(newDerivedSignals)
      ]);
    } else {
      // Just a regular chat response
      setChatMessages([
        ...chatMessages,
        { type: 'user', text: message },
        { type: 'assistant', text: aiResult.explanation }
      ]);
    }
  } catch (error) {
    console.error('Error processing chat:', error);
    setChatMessages([
      ...chatMessages,
      { type: 'user', text: message },
      { type: 'assistant', text: 'Sorry, I encountered an error processing your request.' }
    ]);
  } finally {
    setIsSendingMessage(false);
  }
};
```

### Phase 4: Advanced Features
**Timeline**: 2-3 weeks  
**Goal**: Enhance the AI capabilities with advanced features

#### Tasks:
- [ ] Implement complex signal operations (convolution, correlation, etc.)
- [ ] Add signal combination chains
- [ ] Implement visualization suggestions for different signal types
- [ ] Add support for batch operations
- [ ] Implement caching for expensive operations
- [ ] Add support for saving and loading derived signals
- [ ] Enhance collaboration features for AI-generated signals

## Technical Details

### Signal Processor

The `SignalProcessor` class is the core of the signal processing functionality. It provides a set of operations that can be applied to signals, including:

- Basic arithmetic operations (add, subtract, multiply, divide)
- Signal transformations (absolute value, scaling)
- Filtering operations (low-pass, high-pass, band-pass)
- Derivative calculations (1st and 2nd order)
- Frequency domain analysis (FFT)
- Statistical analysis (min, max, mean, median, std, rms)

Each operation takes one or more signals as input and returns a result with both the processed data and metadata about the operation.

### AI Query Engine

The AI Query Engine uses LangChain and OpenAI to parse natural language queries into specific signal operations. It follows these steps:

1. Parse the user's query using a structured prompt
2. Extract the intended operations and parameters
3. Return a structured result that can be executed by the Signal Processor

The engine uses Pydantic models to ensure type safety and proper validation of the AI's output.

### Frontend Integration

The frontend integration consists of:

1. A service for communicating with the AI Query Engine
2. An enhanced chat component that can process signal operations
3. Updates to the visualization service to handle derived signals

The frontend maintains a state of derived signals that can be used in subsequent operations, allowing for complex signal processing chains.

## Progress Tracking

### Phase 1: Core Signal Processing
- [x] Define the `SignalProcessor` class structure
- [x] Implement basic operations (add, subtract, multiply, divide)
- [x] Implement filtering operations (low-pass, high-pass, etc.)
- [x] Implement derivative calculations
- [x] Implement FFT and frequency domain analysis
- [x] Add Python server endpoint for signal processing
- [ ] Create unit tests for signal processing functions

### Phase 2: AI Integration
- [x] Set up LangChain with OpenAI integration
- [x] Implement the AI query engine
- [x] Create models for signal operations
- [x] Implement query parsing logic
- [x] Add Python server endpoint for AI queries
- [ ] Test AI query parsing with sample queries

### Phase 3: UI Integration
- [x] Create frontend service for AI queries
- [x] Update chat component to handle signal operations
- [ ] Enhance visualization service for derived signals
- [ ] Add UI elements to display AI-generated signals
- [ ] Implement error handling and user feedback
- [ ] Test end-to-end functionality

### Phase 4: Advanced Features
- [ ] Implement complex signal operations (convolution, correlation, etc.)
- [ ] Add signal combination chains
- [ ] Implement visualization suggestions for different signal types
- [ ] Add support for batch operations
- [ ] Implement caching for expensive operations
- [ ] Add support for saving and loading derived signals
- [ ] Enhance collaboration features for AI-generated signals 