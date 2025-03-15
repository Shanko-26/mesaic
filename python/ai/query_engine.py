#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
AI query engine for processing natural language queries about signal operations.
"""

import os
import json
import traceback
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Import OpenAI integration
from .openai_integration import OpenAIIntegration

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
    """
    AI query engine for processing natural language queries about signal operations.
    
    This class uses OpenAI to parse natural language queries into specific signal operations.
    """
    
    def __init__(self):
        """Initialize the AI query engine."""
        self.openai_integration = OpenAIIntegration()
    
    def process_query(self, query: str, available_signals: List[str]) -> AIQueryResult:
        """
        Process a natural language query and return operations to perform.
        
        Args:
            query (str): The natural language query.
            available_signals (List[str]): List of available signal names.
            
        Returns:
            AIQueryResult: The result with operations and explanation.
            
        Raises:
            ValueError: If the query cannot be processed.
        """
        try:
            # Create a prompt for the OpenAI model
            prompt = self._create_prompt(query, available_signals)
            
            # Create a mock data structure for the OpenAI integration
            mock_data = {
                'data': {signal: [0] * 10 for signal in available_signals},
                'metadata': {
                    'sampleRate': 100,
                    'duration': 0.1,
                    'units': {signal: '' for signal in available_signals}
                }
            }
            
            # Get the response from OpenAI using the process_query method
            response_data = self.openai_integration.process_query(prompt, mock_data)
            
            # Extract the answer from the response
            response = response_data.get('answer', '')
            
            # Parse the response
            return self._parse_response(response, query, available_signals)
        except Exception as e:
            traceback.print_exc()
            # Fallback to a simple response
            return AIQueryResult(
                operations=[],
                explanation=f"I couldn't understand how to process your request. Error: {str(e)}"
            )
    
    def _create_prompt(self, query: str, available_signals: List[str]) -> str:
        """
        Create a prompt for the OpenAI model.
        
        Args:
            query (str): The natural language query.
            available_signals (List[str]): List of available signal names.
            
        Returns:
            str: The prompt for the OpenAI model.
        """
        signals_str = ", ".join(available_signals)
        
        return f"""
You are an AI assistant for signal processing. Parse the user's query into specific signal operations.

Available signals: {signals_str}

User query: {query}

Based on the user's query, determine the signal processing operations to perform.
Return a JSON object with the following structure:
{{
    "operations": [
        {{
            "operation": "operation_type",
            "signals": ["signal1", "signal2"],
            "parameters": {{"param1": value1, "param2": value2}},
            "output_name": "result_signal_name"
        }}
    ],
    "explanation": "Explanation of what the operations will do"
}}

Available operation types:
- add: Add two signals together
- subtract: Subtract one signal from another
- multiply: Multiply two signals
- divide: Divide one signal by another
- abs: Compute the absolute value of a signal
- scale: Scale a signal by a factor
- derivative: Compute the derivative of a signal
- filter: Apply a filter to a signal
- fft: Apply Fast Fourier Transform to a signal
- stats: Compute statistics for a signal

For each operation, provide appropriate parameters:
- For add, subtract, multiply, divide: signal1, signal2
- For abs: signal
- For scale: signal, factor
- For derivative: signal, order (1 or 2)
- For filter: signal, filter_type (lowpass, highpass, bandpass, bandstop), cutoff_freq, order
- For fft: signal, sample_rate
- For stats: signal

Choose meaningful output names that describe the result.
If the query doesn't specify an operation, return an empty operations list and provide a helpful explanation.
"""
    
    def _parse_response(self, response: str, query: str, available_signals: List[str]) -> AIQueryResult:
        """
        Parse the response from OpenAI.
        
        Args:
            response (str): The response from OpenAI.
            query (str): The original query.
            available_signals (List[str]): List of available signal names.
            
        Returns:
            AIQueryResult: The parsed result.
            
        Raises:
            ValueError: If the response cannot be parsed.
        """
        try:
            # Extract JSON from the response
            json_str = response.strip()
            
            # Handle potential formatting issues
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].strip()
            
            # Parse the JSON
            result_dict = json.loads(json_str)
            
            # Create the result object
            result = AIQueryResult(
                operations=result_dict.get("operations", []),
                explanation=result_dict.get("explanation", "I've processed your request.")
            )
            
            # Validate the operations
            self._validate_operations(result.operations, available_signals)
            
            return result
        except Exception as e:
            traceback.print_exc()
            # Try a simpler approach
            return self._fallback_parsing(response, query, available_signals)
    
    def _fallback_parsing(self, response: str, query: str, available_signals: List[str]) -> AIQueryResult:
        """
        Fallback parsing for when the JSON parsing fails.
        
        Args:
            response (str): The response from OpenAI.
            query (str): The original query.
            available_signals (List[str]): List of available signal names.
            
        Returns:
            AIQueryResult: The parsed result.
        """
        # Just return an explanation without operations
        return AIQueryResult(
            operations=[],
            explanation=f"I understood your request but couldn't determine the specific operations to perform. Please try rephrasing your query with more specific instructions."
        )
    
    def _validate_operations(self, operations: List[SignalOperation], available_signals: List[str]) -> None:
        """
        Validate the operations.
        
        Args:
            operations (List[SignalOperation]): The operations to validate.
            available_signals (List[str]): List of available signal names.
            
        Raises:
            ValueError: If an operation is invalid.
        """
        valid_operations = [
            'add', 'subtract', 'multiply', 'divide', 
            'abs', 'scale', 'derivative', 'filter', 'fft', 'stats'
        ]
        
        for op in operations:
            # Check operation type
            if op.operation not in valid_operations:
                raise ValueError(f"Invalid operation type: {op.operation}")
            
            # Check signals
            for signal in op.signals:
                if signal not in available_signals:
                    raise ValueError(f"Signal not found: {signal}")
            
            # Check parameters based on operation type
            if op.parameters is None:
                op.parameters = {}
            
            # Validate parameters for specific operations
            if op.operation in ['add', 'subtract', 'multiply', 'divide']:
                if len(op.signals) != 2:
                    raise ValueError(f"{op.operation} operation requires exactly 2 signals")
            
            elif op.operation in ['abs', 'scale', 'derivative', 'filter', 'fft', 'stats']:
                if len(op.signals) != 1:
                    raise ValueError(f"{op.operation} operation requires exactly 1 signal")
            
            # Additional parameter validation
            if op.operation == 'derivative':
                order = op.parameters.get('order', 1)
                if order not in [1, 2]:
                    raise ValueError(f"Derivative order must be 1 or 2, got {order}")
            
            elif op.operation == 'filter':
                filter_type = op.parameters.get('filter_type', 'lowpass')
                if filter_type not in ['lowpass', 'highpass', 'bandpass', 'bandstop']:
                    raise ValueError(f"Invalid filter type: {filter_type}")
                
                if filter_type in ['bandpass', 'bandstop']:
                    cutoff_freq = op.parameters.get('cutoff_freq')
                    if not isinstance(cutoff_freq, (list, tuple)) or len(cutoff_freq) != 2:
                        op.parameters['cutoff_freq'] = [0.1, 0.4]  # Default values 