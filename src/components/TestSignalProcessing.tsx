import React, { useState, useEffect } from 'react';
import { useSignalProcessing } from '../hooks/useSignalProcessing';
import { FileData } from '../services/file';

/**
 * Test component for signal processing
 */
const TestSignalProcessing: React.FC = () => {
  // State for test signals
  const [testSignals, setTestSignals] = useState<FileData | null>(null);
  
  // State for query
  const [query, setQuery] = useState<string>('');
  
  // State for results
  const [results, setResults] = useState<string[]>([]);
  
  // Get the signal processing hook
  const {
    derivedSignals,
    isProcessing,
    error,
    processQuery,
    executeOperations,
    processAndExecute,
    clearDerivedSignals,
    removeDerivedSignal
  } = useSignalProcessing();
  
  // Create test signals on mount
  useEffect(() => {
    // Create test signals
    const createTestSignals = () => {
      // Create time array
      const time = Array.from({ length: 1000 }, (_, i) => i / 100);
      
      // Create sine signal
      const sine = time.map(t => Math.sin(2 * Math.PI * t));
      
      // Create cosine signal
      const cosine = time.map(t => Math.cos(2 * Math.PI * t));
      
      // Create linear signal
      const linear = time.map(t => t);
      
      // Create random signal
      const random = Array.from({ length: 1000 }, () => Math.random());
      
      // Create file data
      const fileData: FileData = {
        signals: ['time', 'sine', 'cosine', 'linear', 'random'],
        data: {
          time,
          sine,
          cosine,
          linear,
          random
        },
        metadata: {
          sampleRate: 100,
          duration: 10,
          units: {
            time: 's',
            sine: '',
            cosine: '',
            linear: '',
            random: ''
          }
        }
      };
      
      setTestSignals(fileData);
      
      // Add log
      addLog('Created test signals');
    };
    
    createTestSignals();
  }, []);
  
  // Add a log message
  const addLog = (message: string) => {
    setResults(prev => [...prev, message]);
  };
  
  // Handle query change
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  
  // Handle query submit
  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || !testSignals) return;
    
    try {
      addLog(`Processing query: ${query}`);
      
      // Process the query
      const { aiResult, newSignals } = await processAndExecute(
        query,
        testSignals,
        testSignals.signals
      );
      
      // Add logs
      addLog(`AI explanation: ${aiResult.explanation}`);
      addLog(`Operations: ${aiResult.operations.length}`);
      
      // Log each operation
      aiResult.operations.forEach((op, i) => {
        addLog(`Operation ${i + 1}: ${op.operation}`);
        addLog(`  Signals: ${op.signals.join(', ')}`);
        addLog(`  Parameters: ${JSON.stringify(op.parameters)}`);
        addLog(`  Output name: ${op.outputName}`);
      });
      
      // Log new signals
      addLog(`New signals: ${Object.keys(newSignals).length}`);
      Object.entries(newSignals).forEach(([name, signal]) => {
        addLog(`  ${name}: ${signal.metadata.description}`);
        addLog(`    Data length: ${signal.data.length}`);
      });
      
      // Clear the query
      setQuery('');
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle clear derived signals
  const handleClearDerivedSignals = () => {
    clearDerivedSignals();
    addLog('Cleared derived signals');
  };
  
  // Handle remove derived signal
  const handleRemoveDerivedSignal = (signalName: string) => {
    removeDerivedSignal(signalName);
    addLog(`Removed derived signal: ${signalName}`);
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Signal Processing Test</h1>
      
      {/* Test signals info */}
      <div className="mb-4 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Test Signals</h2>
        {testSignals ? (
          <div>
            <p>Available signals: {testSignals.signals.join(', ')}</p>
            <p>Sample rate: {testSignals.metadata?.sampleRate || 'N/A'} Hz</p>
            <p>Duration: {testSignals.metadata?.duration || 'N/A'} s</p>
          </div>
        ) : (
          <p>Loading test signals...</p>
        )}
      </div>
      
      {/* Query form */}
      <form onSubmit={handleQuerySubmit} className="mb-4 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">AI Query</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Enter a query (e.g., 'Add sine and cosine signals')"
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            disabled={isProcessing || !query.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            {isProcessing ? 'Processing...' : 'Process'}
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
      
      {/* Derived signals */}
      <div className="mb-4 p-4 border rounded">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Derived Signals</h2>
          <button
            onClick={handleClearDerivedSignals}
            disabled={Object.keys(derivedSignals).length === 0}
            className="px-2 py-1 bg-red-500 text-white rounded text-sm disabled:bg-gray-300"
          >
            Clear All
          </button>
        </div>
        {Object.keys(derivedSignals).length > 0 ? (
          <ul className="space-y-2">
            {Object.entries(derivedSignals).map(([name, signal]) => (
              <li key={name} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                <div>
                  <span className="font-semibold">{name}:</span> {signal.metadata.description}
                  <div className="text-sm text-gray-600">
                    Data length: {signal.data.length}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveDerivedSignal(name)}
                  className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No derived signals yet</p>
        )}
      </div>
      
      {/* Results log */}
      <div className="p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Results Log</h2>
        <div className="bg-gray-100 p-2 rounded h-64 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="space-y-1">
              {results.map((result, index) => (
                <li key={index} className="font-mono text-sm">
                  {result}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No results yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestSignalProcessing; 