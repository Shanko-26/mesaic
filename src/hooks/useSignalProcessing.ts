import { useState, useCallback } from 'react';
import { SignalOperation, DerivedSignal, AIQueryResult } from '../types/signal';
import { processAIQuery, executeSignalOperation } from '../services/ai';
import { FileData } from '../services/file';

/**
 * Custom hook for signal processing operations
 */
export function useSignalProcessing() {
  // State for derived signals
  const [derivedSignals, setDerivedSignals] = useState<Record<string, DerivedSignal>>({});
  
  // State for loading
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // State for error
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Process an AI query for signal operations
   * @param query The natural language query
   * @param fileData The file data
   * @param selectedSignals The selected signals
   * @returns The AI query result with operations and explanation
   */
  const processQuery = useCallback(async (
    query: string,
    fileData: FileData | null,
    selectedSignals: string[]
  ): Promise<AIQueryResult> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Get available signals
      const availableSignals = fileData ? 
        [...fileData.signals, ...Object.keys(derivedSignals)] : 
        Object.keys(derivedSignals);
      
      // Process the query
      const result = await processAIQuery(query, availableSignals);
      
      return result;
    } catch (error) {
      console.error('Error processing query:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [derivedSignals]);
  
  /**
   * Execute signal operations from an AI query result
   * @param aiResult The AI query result
   * @param fileData The file data
   * @returns The new derived signals
   */
  const executeOperations = useCallback(async (
    aiResult: AIQueryResult,
    fileData: FileData | null
  ): Promise<Record<string, DerivedSignal>> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // If there are no operations, return empty object
      if (aiResult.operations.length === 0) {
        return {};
      }
      
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
      const newDerivedSignals: Record<string, DerivedSignal> = {};
      
      for (const operation of aiResult.operations) {
        const result = await executeSignalOperation(operation, signalsData);
        
        // Add the result to derived signals
        newDerivedSignals[operation.outputName] = result;
        
        // Add to signals data for potential use in subsequent operations
        signalsData[operation.outputName] = result.data;
      }
      
      // Update derived signals
      setDerivedSignals(prevSignals => ({
        ...prevSignals,
        ...newDerivedSignals
      }));
      
      return newDerivedSignals;
    } catch (error) {
      console.error('Error executing operations:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [derivedSignals]);
  
  /**
   * Process a query and execute the operations
   * @param query The natural language query
   * @param fileData The file data
   * @param selectedSignals The selected signals
   * @returns The AI query result and new derived signals
   */
  const processAndExecute = useCallback(async (
    query: string,
    fileData: FileData | null,
    selectedSignals: string[]
  ): Promise<{
    aiResult: AIQueryResult;
    newSignals: Record<string, DerivedSignal>;
  }> => {
    // Process the query
    const aiResult = await processQuery(query, fileData, selectedSignals);
    
    // Execute the operations
    const newSignals = await executeOperations(aiResult, fileData);
    
    return { aiResult, newSignals };
  }, [processQuery, executeOperations]);
  
  /**
   * Clear all derived signals
   */
  const clearDerivedSignals = useCallback(() => {
    setDerivedSignals({});
  }, []);
  
  /**
   * Remove a derived signal
   * @param signalName The name of the signal to remove
   */
  const removeDerivedSignal = useCallback((signalName: string) => {
    setDerivedSignals(prevSignals => {
      const newSignals = { ...prevSignals };
      delete newSignals[signalName];
      return newSignals;
    });
  }, []);
  
  return {
    derivedSignals,
    isProcessing,
    error,
    processQuery,
    executeOperations,
    processAndExecute,
    clearDerivedSignals,
    removeDerivedSignal
  };
} 