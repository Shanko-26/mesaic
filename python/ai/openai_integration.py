#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import json
import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import io
import base64
from typing import Dict, List, Any, Optional
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class OpenAIIntegration:
    """
    Integration with OpenAI API for advanced data analysis and visualization.
    """
    
    def __init__(self):
        """Initialize the OpenAI integration."""
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.api_url = "https://api.openai.com/v1/chat/completions"
        
        # Get model name from environment and clean it (remove any comments)
        model_env = os.getenv("OPENAI_MODEL", "gpt-4-1106-preview")
        # Strip any comments (anything after #)
        self.model = model_env.split('#')[0].strip()
        
        print(f"Initialized OpenAI integration with model: {self.model}")
        
        if not self.api_key:
            print("WARNING: OPENAI_API_KEY environment variable not set. OpenAI integration will not work.")
    
    def is_available(self) -> bool:
        """Check if OpenAI integration is available."""
        return self.api_key is not None
    
    def process_query(self, query: str, data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a natural language query using OpenAI.
        
        Args:
            query (str): The natural language query
            data (Dict[str, Any]): The measurement data
            context (Optional[Dict[str, Any]]): Context about the current visualization state
            
        Returns:
            Dict[str, Any]: The query result
        """
        if not self.is_available():
            return {
                'answer': "OpenAI integration is not available. Please set the OPENAI_API_KEY environment variable.",
                'metadata': {
                    'confidence': 0.0,
                    'processingTime': 0.0
                }
            }
        
        start_time = time.time()
        
        try:
            # Prepare data for OpenAI
            data_summary = self._prepare_data_summary(data)
            
            # Prepare context information
            context_info = self._prepare_context_info(context) if context else ""
            
            # Create the prompt
            system_prompt = self._create_system_prompt(data_summary)
            user_prompt = self._create_user_prompt(query, context_info)
            
            # Call OpenAI API
            response = self._call_openai_api(system_prompt, user_prompt, data)
            
            # Process the response
            result = self._process_response(response, data, query)
            
            # Add processing time
            processing_time = time.time() - start_time
            if 'metadata' not in result:
                result['metadata'] = {}
            result['metadata']['processingTime'] = processing_time
            
            return result
        
        except Exception as e:
            print(f"Error in OpenAI integration: {str(e)}")
            return {
                'answer': f"An error occurred while processing your query: {str(e)}",
                'metadata': {
                    'confidence': 0.0,
                    'processingTime': time.time() - start_time,
                    'error': str(e)
                }
            }
    
    def _prepare_data_summary(self, data: Dict[str, Any]) -> str:
        """Prepare a summary of the data for the prompt."""
        signals = [s for s in data.get('data', {}).keys() if s != 'time']
        
        if not signals:
            return "The dataset doesn't contain any signals."
        
        # Calculate basic statistics for each signal
        stats = {}
        for signal in signals:
            signal_data = data['data'][signal]
            stats[signal] = {
                'min': min(signal_data),
                'max': max(signal_data),
                'avg': sum(signal_data) / len(signal_data),
                'std': np.std(signal_data)
            }
        
        # Generate summary text
        time_data = data.get('data', {}).get('time', [])
        if time_data:
            duration = time_data[-1] - time_data[0]
            sample_rate = len(time_data) / duration if duration > 0 else 0
        else:
            duration = data.get('metadata', {}).get('duration', 0)
            sample_rate = data.get('metadata', {}).get('sampleRate', 0)
        
        summary_parts = [f"Dataset contains {duration:.1f} seconds of measurement data with {len(signals)} signals:"]
        
        for signal in signals:
            unit = data.get('metadata', {}).get('units', {}).get(signal, "")
            summary_parts.append(f"- {signal}: range [{stats[signal]['min']:.2f} to {stats[signal]['max']:.2f}] {unit}, avg={stats[signal]['avg']:.2f} {unit}, std={stats[signal]['std']:.2f} {unit}")
        
        summary_parts.append(f"Sample rate: {sample_rate:.1f} Hz")
        summary_parts.append(f"Number of samples: {len(time_data)}")
        
        return "\n".join(summary_parts)
    
    def _prepare_context_info(self, context: Dict[str, Any]) -> str:
        """Prepare context information for the prompt."""
        context_parts = ["Current visualization context:"]
        
        if context.get('selectedSignals'):
            context_parts.append(f"- Selected signals: {', '.join(context['selectedSignals'])}")
        
        if context.get('primaryCursor'):
            cursor = context['primaryCursor']
            context_parts.append(f"- Primary cursor at x={cursor.get('x', 0):.3f}s")
        
        if context.get('diffCursor'):
            cursor = context['diffCursor']
            context_parts.append(f"- Diff cursor at x={cursor.get('x', 0):.3f}s")
        
        if context.get('timeRange'):
            time_range = context['timeRange']
            context_parts.append(f"- Current time range: {time_range[0]:.3f}s to {time_range[1]:.3f}s")
        
        return "\n".join(context_parts)
    
    def _create_system_prompt(self, data_summary: str) -> str:
        """Create the system prompt for OpenAI."""
        return f"""You are an AI assistant specialized in analyzing measurement data. You have access to time series data with various signals.

{data_summary}

Your task is to answer questions about this data. You can perform calculations, statistical analysis, and generate visualizations.

When responding:
1. Provide clear, concise answers
2. Include relevant numerical values with appropriate units
3. Explain your methodology when performing complex calculations
4. If asked to transform data (e.g., absolute value, derivative, etc.), explain how you did it
5. Format your response in a readable way

You have access to Python libraries like numpy, pandas, and matplotlib for calculations and visualizations.
If you generate a visualization, return it as a base64-encoded image in the metadata.

Return your response in JSON format with these fields:
- answer: Your natural language response to the query
- metadata: Additional information including:
  - confidence: Your confidence in the answer (0.0-1.0)
  - calculations: Any calculations you performed
  - visualizationSuggestion: (optional) Suggested visualization parameters
  - visualizationBase64: (optional) Base64-encoded image of a visualization
"""
    
    def _create_user_prompt(self, query: str, context_info: str) -> str:
        """Create the user prompt for OpenAI."""
        if context_info:
            return f"{query}\n\n{context_info}"
        return query
    
    def _call_openai_api(self, system_prompt: str, user_prompt: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Call the OpenAI API."""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        # Create a simplified version of the data for the API call
        # We'll include only the first 100 samples to avoid token limits
        simplified_data = {
            'metadata': data.get('metadata', {}),
            'signals': [s for s in data.get('data', {}).keys() if s != 'time'],
            'sample_data': {}
        }
        
        # Add sample data (first 100 points)
        for signal in simplified_data['signals']:
            if signal in data.get('data', {}):
                simplified_data['sample_data'][signal] = data['data'][signal][:100]
        
        if 'time' in data.get('data', {}):
            simplified_data['sample_data']['time'] = data['data']['time'][:100]
        
        # Create the function calling definition using the tools parameter (newer API)
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "generate_visualization",
                    "description": "Generate a visualization of the data",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "signals": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                },
                                "description": "The signals to include in the visualization"
                            },
                            "transformations": {
                                "type": "object",
                                "description": "Transformations to apply to the signals",
                                "additionalProperties": {
                                    "type": "string"
                                }
                            },
                            "title": {
                                "type": "string",
                                "description": "The title of the visualization"
                            },
                            "x_label": {
                                "type": "string",
                                "description": "The label for the x-axis"
                            },
                            "y_label": {
                                "type": "string",
                                "description": "The label for the y-axis"
                            }
                        },
                        "required": ["signals"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "perform_calculation",
                    "description": "Perform a calculation on the data",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "calculation_type": {
                                "type": "string",
                                "enum": ["abs", "derivative", "integral", "fft", "filter", "custom"],
                                "description": "The type of calculation to perform"
                            },
                            "signals": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                },
                                "description": "The signals to perform the calculation on"
                            },
                            "parameters": {
                                "type": "object",
                                "description": "Additional parameters for the calculation",
                                "additionalProperties": True
                            },
                            "custom_code": {
                                "type": "string",
                                "description": "Custom Python code to execute (only used if calculation_type is 'custom')"
                            }
                        },
                        "required": ["calculation_type", "signals"]
                    }
                }
            }
        ]
        
        # Create the messages
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        # Create the request payload
        payload = {
            "model": self.model,
            "messages": messages,
            "tools": tools,
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        print(f"Calling OpenAI API with model: {self.model}")
        
        # Call the API
        try:
            response = requests.post(self.api_url, headers=headers, json=payload)
            
            if response.status_code != 200:
                error_message = f"OpenAI API error: {response.status_code} - {response.text}"
                print(error_message)
                raise Exception(error_message)
            
            return response.json()
        except Exception as e:
            print(f"Error calling OpenAI API: {str(e)}")
            raise
    
    def _process_response(self, response: Dict[str, Any], data: Dict[str, Any], query: str) -> Dict[str, Any]:
        """Process the response from OpenAI."""
        try:
            # Debug the response structure
            print(f"OpenAI response structure: {json.dumps(list(response.keys()), indent=2)}")
            
            # Check if the response has the expected structure
            if 'choices' not in response or not response['choices']:
                print(f"Error: 'choices' not found in response or empty: {response}")
                return {
                    'answer': f"I processed your query '{query}' but received an invalid response from OpenAI. Please try again.",
                    'metadata': {
                        'confidence': 0.1,
                        'error': "Invalid response structure"
                    }
                }
            
            # Get the first choice
            choice = response['choices'][0]
            print(f"Choice structure: {json.dumps(list(choice.keys()), indent=2)}")
            
            # Check if the choice has a message
            if 'message' not in choice:
                print(f"Error: 'message' not found in choice: {choice}")
                return {
                    'answer': f"I processed your query '{query}' but received an invalid response format. Please try again.",
                    'metadata': {
                        'confidence': 0.1,
                        'error': "No message in response"
                    }
                }
            
            message = choice['message']
            print(f"Message structure: {json.dumps(list(message.keys()), indent=2)}")
            
            # Check if the message has content
            if 'content' not in message or message['content'] is None:
                # This might be a function call without content
                content = ""
                print("No content in message, might be a function call only")
            else:
                content = message['content']
            
            # Initialize result with a default structure
            result = {
                'answer': content,
                'metadata': {
                    'confidence': 0.5
                }
            }
            
            # Try to parse content as JSON if it's not empty
            if content:
                try:
                    parsed_content = json.loads(content)
                    # If parsing succeeds, use the parsed content as the result
                    result = parsed_content
                except json.JSONDecodeError as e:
                    print(f"Content is not valid JSON, using as plain text: {e}")
                    # Keep the default result with content as answer
            
            # Flag to track if we processed any tool calls
            processed_tool_calls = False
            calculation_results = {}
            visualization_result = None
            
            # Check for function calls (tool calls in newer API versions)
            if 'function_call' in message:
                print("Found function_call in message")
                function_call = message['function_call']
                function_name = function_call.get('name')
                
                try:
                    function_args = json.loads(function_call.get('arguments', '{}'))
                    
                    if function_name == 'generate_visualization':
                        # Generate a visualization
                        visualization_result = self._generate_visualization(function_args, data)
                        processed_tool_calls = True
                        
                        # Add the visualization to the result
                        if 'metadata' not in result:
                            result['metadata'] = {}
                        
                        result['metadata']['visualizationBase64'] = visualization_result['base64']
                        result['metadata']['visualizationSuggestion'] = visualization_result['suggestion']
                    
                    elif function_name == 'perform_calculation':
                        # Perform a calculation
                        calculation_results = self._perform_calculation(function_args, data)
                        processed_tool_calls = True
                        
                        # Add the calculation to the result
                        if 'metadata' not in result:
                            result['metadata'] = {}
                        
                        result['metadata']['calculations'] = calculation_results
                except json.JSONDecodeError as e:
                    print(f"Error parsing function arguments: {e}")
                    if 'metadata' not in result:
                        result['metadata'] = {}
                    result['metadata']['error'] = f"Error parsing function arguments: {str(e)}"
            
            # Check for tool calls in newer API versions
            elif 'tool_calls' in message:
                print("Found tool_calls in message")
                tool_calls = message['tool_calls']
                
                for tool_call in tool_calls:
                    if 'function' not in tool_call:
                        continue
                    
                    function = tool_call['function']
                    function_name = function.get('name')
                    
                    try:
                        function_args = json.loads(function.get('arguments', '{}'))
                        
                        if function_name == 'generate_visualization':
                            # Generate a visualization
                            visualization_result = self._generate_visualization(function_args, data)
                            processed_tool_calls = True
                            
                            # Add the visualization to the result
                            if 'metadata' not in result:
                                result['metadata'] = {}
                            
                            result['metadata']['visualizationBase64'] = visualization_result['base64']
                            result['metadata']['visualizationSuggestion'] = visualization_result['suggestion']
                        
                        elif function_name == 'perform_calculation':
                            # Perform a calculation
                            calculation_results = self._perform_calculation(function_args, data)
                            processed_tool_calls = True
                            
                            # Add the calculation to the result
                            if 'metadata' not in result:
                                result['metadata'] = {}
                            
                            result['metadata']['calculations'] = calculation_results
                    except json.JSONDecodeError as e:
                        print(f"Error parsing tool function arguments: {e}")
                        if 'metadata' not in result:
                            result['metadata'] = {}
                        result['metadata']['error'] = f"Error parsing tool function arguments: {str(e)}"
            
            # If we processed tool calls but have no content, generate a response based on the tool results
            if processed_tool_calls and not content:
                print("Generating response based on tool results")
                
                # Handle calculation results
                if calculation_results:
                    # For unit conversions and other calculations, create a human-readable response
                    descriptions = []
                    for signal, calc_result in calculation_results.items():
                        if 'error' in calc_result:
                            descriptions.append(f"Error processing {signal}: {calc_result['error']}")
                        elif 'description' in calc_result:
                            descriptions.append(calc_result['description'])
                            
                            # For unit conversions, add some sample values
                            if 'transformed' in calc_result and len(calc_result['transformed']) > 0:
                                # Get some sample values (first, middle, last)
                                transformed = calc_result['transformed']
                                samples = [
                                    transformed[0],
                                    transformed[len(transformed) // 2],
                                    transformed[-1]
                                ]
                                
                                # Add time points if available
                                time_points = []
                                if 'time' in data.get('data', {}) and len(data['data']['time']) >= len(transformed):
                                    time_data = data['data']['time']
                                    time_points = [
                                        time_data[0],
                                        time_data[len(time_data) // 2],
                                        time_data[-1]
                                    ]
                                
                                # Add sample values to the description
                                sample_text = "Sample values: "
                                if time_points:
                                    sample_text += ", ".join([
                                        f"at {time_points[i]:.2f}s: {samples[i]:.2f}"
                                        for i in range(len(samples))
                                    ])
                                else:
                                    sample_text += ", ".join([f"{val:.2f}" for val in samples])
                                
                                descriptions.append(sample_text)
                    
                    # Create a response based on the descriptions
                    if descriptions:
                        result['answer'] = "\n".join(descriptions)
                    else:
                        result['answer'] = f"I processed your query '{query}' and performed the requested calculations, but couldn't generate a meaningful description."
                
                # Handle visualization results
                if visualization_result:
                    if not result['answer']:
                        result['answer'] = "I've generated a visualization based on your query."
                    
                    # If we have a suggestion with data, add information about what was plotted
                    if 'suggestion' in visualization_result and 'data' in visualization_result['suggestion']:
                        plot_data = visualization_result['suggestion']['data']
                        if plot_data:
                            signals_plotted = [trace.get('name', 'unknown') for trace in plot_data]
                            result['answer'] += f"\n\nThe visualization includes the following signals: {', '.join(signals_plotted)}."
            
            return result
        
        except Exception as e:
            print(f"Error processing OpenAI response: {str(e)}")
            print(f"Response that caused the error: {json.dumps(response, indent=2, default=str)}")
            return {
                'answer': f"I processed your query '{query}' but encountered an error formatting the response. Please try again or rephrase your question.",
                'metadata': {
                    'confidence': 0.3,
                    'error': str(e)
                }
            }
    
    def _generate_visualization(self, args: Dict[str, Any], data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a visualization based on the function call arguments."""
        signals = args.get('signals', [])
        transformations = args.get('transformations', {})
        title = args.get('title', 'Data Visualization')
        x_label = args.get('x_label', 'Time (s)')
        y_label = args.get('y_label', 'Value')
        
        # Create a figure
        plt.figure(figsize=(10, 6))
        
        # Get the time data
        time_data = data.get('data', {}).get('time', [])
        
        # Plot each signal
        for signal in signals:
            if signal in data.get('data', {}):
                signal_data = data['data'][signal]
                
                # Apply transformations if specified
                if signal in transformations:
                    transform_type = transformations[signal]
                    if transform_type == 'abs':
                        signal_data = np.abs(signal_data)
                        label = f"|{signal}|"
                    elif transform_type == 'derivative':
                        signal_data = np.gradient(signal_data, time_data)
                        label = f"d({signal})/dt"
                    elif transform_type == 'integral':
                        signal_data = np.cumsum(signal_data) * (time_data[1] - time_data[0])
                        label = f"∫{signal} dt"
                    else:
                        label = signal
                else:
                    label = signal
                
                plt.plot(time_data, signal_data, label=label)
        
        # Add labels and legend
        plt.title(title)
        plt.xlabel(x_label)
        plt.ylabel(y_label)
        plt.legend()
        plt.grid(True)
        
        # Save the figure to a base64-encoded string
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close()
        
        # Create a visualization suggestion for Plotly
        suggestion = {
            'data': [],
            'layout': {
                'title': title,
                'xaxis': {
                    'title': x_label
                },
                'yaxis': {
                    'title': y_label
                }
            }
        }
        
        for signal in signals:
            if signal in data.get('data', {}):
                signal_data = data['data'][signal]
                
                # Apply transformations if specified
                if signal in transformations:
                    transform_type = transformations[signal]
                    if transform_type == 'abs':
                        signal_data = np.abs(signal_data)
                        name = f"|{signal}|"
                    elif transform_type == 'derivative':
                        signal_data = np.gradient(signal_data, time_data)
                        name = f"d({signal})/dt"
                    elif transform_type == 'integral':
                        signal_data = np.cumsum(signal_data) * (time_data[1] - time_data[0])
                        name = f"∫{signal} dt"
                    else:
                        name = signal
                else:
                    name = signal
                
                suggestion['data'].append({
                    'x': time_data.tolist(),
                    'y': signal_data.tolist(),
                    'type': 'scatter',
                    'mode': 'lines',
                    'name': name
                })
        
        return {
            'base64': img_base64,
            'suggestion': suggestion
        }
    
    def _perform_calculation(self, args: Dict[str, Any], data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform a calculation based on the function call arguments."""
        print(f"Performing calculation with args: {json.dumps(args, indent=2)}")
        calculation_type = args.get('calculation_type')
        signals = args.get('signals', [])
        parameters = args.get('parameters', {})
        custom_code = args.get('custom_code', '')
        
        print(f"Calculation type: {calculation_type}, Signals: {signals}")
        
        results = {}
        
        for signal in signals:
            if signal in data.get('data', {}):
                signal_data = np.array(data['data'][signal])
                time_data = np.array(data.get('data', {}).get('time', []))
                
                print(f"Processing signal: {signal}, Data length: {len(signal_data)}")
                
                if calculation_type == 'abs':
                    results[signal] = {
                        'original': signal_data.tolist(),
                        'transformed': np.abs(signal_data).tolist(),
                        'description': f"Absolute value of {signal}"
                    }
                
                elif calculation_type == 'derivative':
                    results[signal] = {
                        'original': signal_data.tolist(),
                        'transformed': np.gradient(signal_data, time_data).tolist(),
                        'description': f"Derivative of {signal} with respect to time"
                    }
                
                elif calculation_type == 'integral':
                    dt = time_data[1] - time_data[0] if len(time_data) > 1 else 1
                    results[signal] = {
                        'original': signal_data.tolist(),
                        'transformed': np.cumsum(signal_data * dt).tolist(),
                        'description': f"Integral of {signal} with respect to time"
                    }
                
                elif calculation_type == 'fft':
                    # Perform FFT
                    fft_result = np.fft.fft(signal_data)
                    fft_freq = np.fft.fftfreq(len(signal_data), d=(time_data[1] - time_data[0]))
                    
                    # Get the magnitude spectrum (only the positive frequencies)
                    n = len(fft_result) // 2
                    magnitude = np.abs(fft_result[:n]) / n
                    freq = fft_freq[:n]
                    
                    results[signal] = {
                        'original': signal_data.tolist(),
                        'transformed': magnitude.tolist(),
                        'frequency': freq.tolist(),
                        'description': f"FFT of {signal}"
                    }
                
                elif calculation_type == 'filter':
                    filter_type = parameters.get('filter_type', 'lowpass')
                    cutoff = parameters.get('cutoff', 0.1)
                    order = parameters.get('order', 4)
                    
                    from scipy import signal as scipy_signal
                    
                    # Normalize cutoff frequency
                    fs = 1 / (time_data[1] - time_data[0]) if len(time_data) > 1 else 1
                    nyquist = 0.5 * fs
                    normal_cutoff = cutoff / nyquist
                    
                    # Design the filter
                    b, a = scipy_signal.butter(order, normal_cutoff, btype=filter_type, analog=False)
                    
                    # Apply the filter
                    filtered_data = scipy_signal.filtfilt(b, a, signal_data)
                    
                    results[signal] = {
                        'original': signal_data.tolist(),
                        'transformed': filtered_data.tolist(),
                        'description': f"{filter_type} filter applied to {signal} with cutoff={cutoff} Hz, order={order}"
                    }
                
                elif calculation_type == 'custom':
                    # Create a safe environment for executing custom code
                    local_vars = {
                        'signal_data': signal_data,
                        'time_data': time_data,
                        'np': np,
                        'pd': pd,
                        'result': None
                    }
                    
                    try:
                        print(f"Executing custom code: {custom_code}")
                        # Execute the custom code
                        exec(custom_code, {}, local_vars)
                        
                        # Get the result
                        transformed_data = local_vars.get('result', None)
                        
                        if transformed_data is not None:
                            results[signal] = {
                                'original': signal_data.tolist(),
                                'transformed': transformed_data.tolist() if hasattr(transformed_data, 'tolist') else transformed_data,
                                'description': f"Custom calculation applied to {signal}"
                            }
                        else:
                            results[signal] = {
                                'error': "Custom code did not set the 'result' variable"
                            }
                    except Exception as e:
                        print(f"Error executing custom code: {str(e)}")
                        results[signal] = {
                            'error': f"Error executing custom code: {str(e)}"
                        }
                else:
                    # Handle unit conversion or other simple transformations
                    conversion_factor = None
                    description = ""
                    
                    # Check for common unit conversions
                    if calculation_type.lower() in ['convert', 'conversion', 'unit_conversion']:
                        from_unit = parameters.get('from_unit', '').lower()
                        to_unit = parameters.get('to_unit', '').lower()
                        
                        print(f"Unit conversion requested: {from_unit} to {to_unit}")
                        
                        # Speed conversions
                        if (from_unit in ['kmh', 'km/h', 'kph'] and to_unit in ['mph', 'mi/h']):
                            conversion_factor = 0.621371  # km/h to mph
                            description = f"Converted {signal} from km/h to mph"
                        elif (from_unit in ['mph', 'mi/h'] and to_unit in ['kmh', 'km/h', 'kph']):
                            conversion_factor = 1.60934  # mph to km/h
                            description = f"Converted {signal} from mph to km/h"
                        # Temperature conversions
                        elif (from_unit in ['c', 'celsius'] and to_unit in ['f', 'fahrenheit']):
                            transformed_data = (signal_data * 9/5) + 32
                            description = f"Converted {signal} from Celsius to Fahrenheit"
                            results[signal] = {
                                'original': signal_data.tolist(),
                                'transformed': transformed_data.tolist(),
                                'description': description
                            }
                        elif (from_unit in ['f', 'fahrenheit'] and to_unit in ['c', 'celsius']):
                            transformed_data = (signal_data - 32) * 5/9
                            description = f"Converted {signal} from Fahrenheit to Celsius"
                            results[signal] = {
                                'original': signal_data.tolist(),
                                'transformed': transformed_data.tolist(),
                                'description': description
                            }
                    
                    # If we have a simple conversion factor, apply it
                    if conversion_factor is not None:
                        transformed_data = signal_data * conversion_factor
                        results[signal] = {
                            'original': signal_data.tolist(),
                            'transformed': transformed_data.tolist(),
                            'description': description
                        }
                    elif not results.get(signal):
                        # If no conversion was applied and no results were set
                        results[signal] = {
                            'error': f"Unknown calculation type: {calculation_type}"
                        }
            else:
                print(f"Signal {signal} not found in data")
                results[signal] = {
                    'error': f"Signal {signal} not found in data"
                }
        
        print(f"Calculation results: {json.dumps(list(results.keys()), indent=2)}")
        return results 