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
        except ValueError as e:
            # Check if this is an incomplete query error
            error_str = str(e)
            if "Invalid filter type" in error_str or "filter_type" in error_str:
                # This is likely an incomplete filter query
                return self._handle_incomplete_filter_query(query, available_signals)
            elif "operation requires exactly 2 signals" in error_str or "signal1" in error_str or "signal2" in error_str:
                # This is likely an incomplete binary operation query
                return self._handle_incomplete_binary_operation(query, available_signals, error_str)
            elif "operation requires exactly 1 signal" in error_str or "signal" in error_str:
                # This is likely an incomplete unary operation query
                return self._handle_incomplete_unary_operation(query, available_signals, error_str)
            elif "factor" in error_str and ("scale" in query.lower() or "multiply" in query.lower()):
                # This is likely an incomplete scale operation query
                mentioned_signals = [s for s in available_signals if s.lower() in query.lower()]
                return self._handle_incomplete_scale_operation(query, available_signals, mentioned_signals)
            else:
                # Other validation error
                traceback.print_exc()
                return AIQueryResult(
                    operations=[],
                    explanation=f"I need more information to process your request: {str(e)}"
                )
        except Exception as e:
            traceback.print_exc()
            # Try to extract operation type and signals from the query
            operation_type = None
            for op in ['add', 'subtract', 'multiply', 'divide', 'abs', 'scale', 'derivative', 'filter', 'fft', 'stats']:
                if op in query.lower():
                    operation_type = op
                    break
            
            mentioned_signals = [s for s in available_signals if s.lower() in query.lower()]
            
            if operation_type and mentioned_signals:
                if operation_type in ['add', 'subtract', 'multiply', 'divide']:
                    return self._handle_incomplete_binary_operation(query, available_signals, f"{operation_type} operation requires exactly 2 signals")
                elif operation_type in ['abs', 'derivative', 'fft', 'stats']:
                    return self._handle_incomplete_unary_operation(query, available_signals, f"{operation_type} operation requires exactly 1 signal")
                elif operation_type == 'scale':
                    return self._handle_incomplete_scale_operation(query, available_signals, mentioned_signals)
                elif operation_type == 'filter':
                    return self._handle_incomplete_filter_query(query, available_signals)
            
            # Fallback to a simple response
            return AIQueryResult(
                operations=[],
                explanation=f"I couldn't understand how to process your request. Please try rephrasing your query with more specific instructions."
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
- For add, subtract, multiply, divide: signal1, signal2 (REQUIRED: exactly 2 signals)
- For abs: signal (REQUIRED: exactly 1 signal)
- For scale: signal (REQUIRED: exactly 1 signal), factor (REQUIRED: numeric value)
- For derivative: signal (REQUIRED: exactly 1 signal), order (REQUIRED: 1 or 2)
- For filter: signal (REQUIRED: exactly 1 signal), filter_type (REQUIRED: one of "lowpass", "highpass", "bandpass", "bandstop"), cutoff_freq (REQUIRED: numeric value between 0-1 for lowpass/highpass, or [low, high] array for bandpass/bandstop), order (OPTIONAL: default is 4)
- For fft: signal (REQUIRED: exactly 1 signal), sample_rate (REQUIRED: numeric value)
- For stats: signal (REQUIRED: exactly 1 signal)

Choose meaningful output names that describe the result.

IMPORTANT: If the user's query is incomplete and doesn't provide all required parameters for an operation, DO NOT guess or use default values. Instead, return the operation with the parameters that are explicitly mentioned, and leave out the ones that aren't specified.

If the query doesn't specify an operation at all, return an empty operations list and provide a helpful explanation asking for more information.
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
            
            # Debug: Print the JSON string we're trying to parse
            print(f"Attempting to parse JSON: {json_str[:100]}...")
            
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
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Response content: {response[:200]}...")
            
            # Try to extract any JSON-like structure from the response
            import re
            json_pattern = r'\{.*\}'
            match = re.search(json_pattern, response, re.DOTALL)
            
            if match:
                try:
                    # Try to parse the extracted JSON
                    extracted_json = match.group(0)
                    print(f"Extracted JSON-like structure: {extracted_json[:100]}...")
                    result_dict = json.loads(extracted_json)
                    
                    result = AIQueryResult(
                        operations=result_dict.get("operations", []),
                        explanation=result_dict.get("explanation", "I've processed your request.")
                    )
                    
                    # Validate the operations
                    self._validate_operations(result.operations, available_signals)
                    
                    return result
                except Exception as inner_e:
                    print(f"Failed to parse extracted JSON: {inner_e}")
            
            # If we get here, we couldn't parse the JSON, so use the fallback parsing
            return self._fallback_parsing(response, query, available_signals)
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
        print(f"Using fallback parsing for query: {query}")
        
        # Try to determine the operation type from the query
        operation_type = None
        operation_keywords = {
            'add': ['add', 'sum', 'plus', 'combine'],
            'subtract': ['subtract', 'minus', 'difference', 'take away'],
            'multiply': ['multiply', 'product', 'times'],
            'divide': ['divide', 'ratio', 'quotient'],
            'abs': ['absolute', 'abs', 'magnitude'],
            'scale': ['scale', 'multiply by', 'factor'],
            'derivative': ['derivative', 'rate of change', 'slope'],
            'filter': ['filter', 'smooth', 'lowpass', 'highpass', 'bandpass', 'bandstop'],
            'fft': ['fft', 'fourier', 'frequency', 'spectrum'],
            'stats': ['stats', 'statistics', 'mean', 'average', 'std', 'min', 'max']
        }
        
        for op, keywords in operation_keywords.items():
            for keyword in keywords:
                if keyword in query.lower():
                    operation_type = op
                    break
            if operation_type:
                break
        
        # Try to extract signals from the query
        mentioned_signals = []
        for signal in available_signals:
            if signal.lower() in query.lower():
                mentioned_signals.append(signal)
        
        # If we found an operation type, try to handle it specifically
        if operation_type:
            if operation_type in ['add', 'subtract', 'multiply', 'divide']:
                return self._handle_incomplete_binary_operation(query, available_signals, f"{operation_type} operation requires exactly 2 signals")
            elif operation_type in ['abs', 'derivative', 'fft', 'stats']:
                return self._handle_incomplete_unary_operation(query, available_signals, f"{operation_type} operation requires exactly 1 signal")
            elif operation_type == 'scale':
                return self._handle_incomplete_scale_operation(query, available_signals, mentioned_signals)
            elif operation_type == 'filter':
                return self._handle_incomplete_filter_query(query, available_signals)
        
        if mentioned_signals:
            signals_str = ", ".join(mentioned_signals)
            return AIQueryResult(
                operations=[],
                explanation=f"I see you mentioned the following signals: {signals_str}. Could you please specify what operation you'd like to perform on them?\n\n"
                           f"Available operations include:\n"
                           f"- add, subtract, multiply, divide (require 2 signals)\n"
                           f"- abs, scale, derivative, filter, fft, stats (require 1 signal)\n\n"
                           f"For example, you could say:\n"
                           f"- 'Add {mentioned_signals[0]} and {available_signals[0] if available_signals[0] != mentioned_signals[0] else available_signals[1]}'\n"
                           f"- 'Apply a lowpass filter to {mentioned_signals[0]} with cutoff frequency 0.1'\n"
                           f"- 'Compute the derivative of {mentioned_signals[0]}'"
            )
        
        # Default fallback response with more helpful guidance
        signals_str = ", ".join(available_signals)
        return AIQueryResult(
            operations=[],
            explanation=f"I couldn't determine what operation you want to perform. Please try rephrasing your query with more specific instructions.\n\n"
                       f"Available operations include:\n"
                       f"- add, subtract, multiply, divide (require 2 signals)\n"
                       f"- abs, scale, derivative, filter, fft, stats (require 1 signal)\n\n"
                       f"Available signals: {signals_str}\n\n"
                       f"For example, you could say:\n"
                       f"- 'Add {available_signals[0]} and {available_signals[1]}'\n"
                       f"- 'Apply a lowpass filter to {available_signals[0]} with cutoff frequency 0.1'\n"
                       f"- 'Compute the derivative of {available_signals[0]}'"
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

    def _handle_incomplete_filter_query(self, query: str, available_signals: List[str]) -> AIQueryResult:
        """Handle incomplete filter queries by providing specific guidance."""
        # Try to extract the signal from the query
        signal_match = None
        for signal in available_signals:
            if signal.lower() in query.lower():
                signal_match = signal
                break
        
        if signal_match:
            # We found a signal in the query
            operation = {
                "operation": "filter",
                "signals": [signal_match],
                "parameters": {},
                "output_name": f"filtered_{signal_match}"
            }
            
            return AIQueryResult(
                operations=[operation],
                explanation=f"To filter the {signal_match} signal, I need more information:\n\n"
                           f"1. What type of filter would you like to apply? (lowpass, highpass, bandpass, or bandstop)\n"
                           f"2. What cutoff frequency would you like to use? (a value between 0 and 1)\n\n"
                           f"For example, you could say: 'Apply a lowpass filter to {signal_match} with cutoff frequency 0.1'"
            )
        else:
            # We couldn't find a signal in the query
            signals_str = ", ".join(available_signals)
            return AIQueryResult(
                operations=[],
                explanation=f"To filter a signal, I need to know:\n\n"
                           f"1. Which signal to filter (available signals: {signals_str})\n"
                           f"2. What type of filter to apply (lowpass, highpass, bandpass, or bandstop)\n"
                           f"3. What cutoff frequency to use (a value between 0 and 1)\n\n"
                           f"For example, you could say: 'Apply a lowpass filter to vehicleSpeed with cutoff frequency 0.1'"
            )

    def _handle_incomplete_binary_operation(self, query: str, available_signals: List[str], error_str: str) -> AIQueryResult:
        """Handle incomplete binary operation queries by providing specific guidance."""
        # Try to determine the operation type from the error message
        operation_type = None
        for op in ['add', 'subtract', 'multiply', 'divide']:
            if op in error_str:
                operation_type = op
                break
        
        if not operation_type:
            operation_type = 'binary operation'
        
        # Try to extract signals from the query
        found_signals = []
        for signal in available_signals:
            if signal.lower() in query.lower():
                found_signals.append(signal)
        
        if len(found_signals) == 1:
            # We found one signal, need one more
            signals_str = ", ".join([s for s in available_signals if s != found_signals[0]])
            return AIQueryResult(
                operations=[{
                    "operation": operation_type,
                    "signals": found_signals,
                    "parameters": {},
                    "output_name": f"{operation_type}_{found_signals[0]}"
                }],
                explanation=f"To {operation_type} signals, I need one more signal to {operation_type} with {found_signals[0]}.\n\n"
                           f"Available signals: {signals_str}\n\n"
                           f"For example, you could say: '{operation_type} {found_signals[0]} with engineRPM'"
            )
        else:
            # We couldn't find any signals or found too many
            signals_str = ", ".join(available_signals)
            return AIQueryResult(
                operations=[],
                explanation=f"To {operation_type} signals, I need to know which two signals to use.\n\n"
                           f"Available signals: {signals_str}\n\n"
                           f"For example, you could say: '{operation_type} vehicleSpeed and engineRPM'"
            )

    def _handle_incomplete_unary_operation(self, query: str, available_signals: List[str], error_str: str) -> AIQueryResult:
        """Handle incomplete unary operation queries by providing specific guidance."""
        # Try to determine the operation type from the error message
        operation_type = None
        for op in ['abs', 'scale', 'derivative', 'filter', 'fft', 'stats']:
            if op in error_str:
                operation_type = op
                break
        
        if not operation_type:
            operation_type = 'operation'
        
        # Try to extract a signal from the query
        signal_match = None
        for signal in available_signals:
            if signal.lower() in query.lower():
                signal_match = signal
                break
        
        if signal_match:
            # We found a signal in the query
            operation = {
                "operation": operation_type,
                "signals": [signal_match],
                "parameters": {},
                "output_name": f"{operation_type}_{signal_match}"
            }
            
            # Add specific guidance based on operation type
            if operation_type == 'scale':
                return AIQueryResult(
                    operations=[operation],
                    explanation=f"To scale the {signal_match} signal, I need to know what scaling factor to use.\n\n"
                               f"For example, you could say: 'Scale {signal_match} by a factor of 2.5'"
                )
            elif operation_type == 'derivative':
                return AIQueryResult(
                    operations=[operation],
                    explanation=f"To compute the derivative of {signal_match}, I need to know which order of derivative to use (1 or 2).\n\n"
                               f"For example, you could say: 'Compute the first derivative of {signal_match}'"
                )
            elif operation_type == 'fft':
                return AIQueryResult(
                    operations=[operation],
                    explanation=f"To compute the FFT of {signal_match}, I need to know the sample rate.\n\n"
                               f"For example, you could say: 'Compute the FFT of {signal_match} with sample rate 100'"
                )
            else:
                return AIQueryResult(
                    operations=[operation],
                    explanation=f"I need more information to apply the {operation_type} operation to {signal_match}."
                )
        else:
            # We couldn't find a signal in the query
            signals_str = ", ".join(available_signals)
            return AIQueryResult(
                operations=[],
                explanation=f"To apply the {operation_type} operation, I need to know which signal to use.\n\n"
                           f"Available signals: {signals_str}\n\n"
                           f"For example, you could say: 'Apply {operation_type} to vehicleSpeed'"
            )

    def _handle_incomplete_scale_operation(self, query: str, available_signals: List[str], mentioned_signals: List[str]) -> AIQueryResult:
        """Handle incomplete scale operation queries by providing specific guidance."""
        if len(mentioned_signals) == 1:
            # We found one signal in the query
            signal = mentioned_signals[0]
            return AIQueryResult(
                operations=[{
                    "operation": "scale",
                    "signals": [signal],
                    "parameters": {},
                    "output_name": f"scaled_{signal}"
                }],
                explanation=f"To scale the {signal} signal, I need to know what scaling factor to use.\n\n"
                           f"For example, you could say: 'Scale {signal} by a factor of 2.5'"
            )
        else:
            # We couldn't find a signal in the query
            signals_str = ", ".join(available_signals)
            return AIQueryResult(
                operations=[],
                explanation=f"To scale a signal, I need to know which signal to scale.\n\n"
                           f"Available signals: {signals_str}\n\n"
                           f"For example, you could say: 'Scale vehicleSpeed by a factor of 2.5'"
            ) 