#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import os
import re
import numpy as np
from typing import Dict, List, Any, Tuple, Optional

class QueryProcessor:
    """
    Process natural language queries about measurement data.
    """
    
    def __init__(self):
        """Initialize the query processor."""
        # Keywords for different types of queries
        self.keywords = {
            'max': ['maximum', 'max', 'highest', 'peak', 'largest'],
            'min': ['minimum', 'min', 'lowest', 'smallest'],
            'avg': ['average', 'mean', 'typical'],
            'correlation': ['correlation', 'relationship', 'connection', 'related'],
            'anomaly': ['anomaly', 'anomalies', 'unusual', 'abnormal', 'outlier'],
            'summary': ['summary', 'overview', 'describe']
        }
        
        # Signal name mappings (common variations)
        self.signal_mappings = {
            'rpm': ['rpm', 'engineRPM', 'engine rpm', 'revolutions'],
            'speed': ['speed', 'vehicleSpeed', 'vehicle speed'],
            'throttle': ['throttle', 'throttlePosition', 'throttle position'],
            'temp': ['temp', 'temperature', 'engineTemp', 'engine temperature'],
            'fuel': ['fuel', 'fuelConsumption', 'fuel consumption'],
            'battery': ['battery', 'batteryVoltage', 'battery voltage'],
            'ambient': ['ambient', 'ambientTemp', 'ambient temperature'],
            'oil': ['oil', 'oilPressure', 'oil pressure']
        }
        
        # Time regex pattern
        self.time_regex = re.compile(r'at\s+(\d+)(\.\d+)?(?:\s*)(ms|s|seconds|milliseconds)?', re.IGNORECASE)
    
    def process_query(self, query: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a natural language query about the data.
        
        Args:
            query (str): The natural language query
            data (Dict[str, Any]): The measurement data
            
        Returns:
            Dict[str, Any]: The query result
        """
        query = query.lower()
        
        # Check for time-specific queries first
        time_match = self.time_regex.search(query)
        if time_match:
            return self._process_time_query(query, data, time_match)
        
        # Determine query type
        query_type = self._determine_query_type(query)
        
        # Extract relevant signals
        signals = self._extract_signals(query, data)
        
        # Process based on query type
        if query_type == 'max':
            return self._process_max_query(query, data, signals)
        elif query_type == 'min':
            return self._process_min_query(query, data, signals)
        elif query_type == 'avg':
            return self._process_avg_query(query, data, signals)
        elif query_type == 'correlation':
            return self._process_correlation_query(query, data, signals)
        elif query_type == 'anomaly':
            return self._process_anomaly_query(query, data, signals)
        elif query_type == 'summary':
            return self._process_summary_query(query, data)
        else:
            return {
                'answer': "I'm not sure how to answer that question about the data. Try asking about maximum, minimum, or average values, correlations between signals, anomalies, or a general summary of the data.",
                'metadata': {
                    'confidence': 0.3,
                    'processingTime': 0.3
                }
            }
    
    def _process_time_query(self, query: str, data: Dict[str, Any], time_match) -> Dict[str, Any]:
        """Process a query about a specific time point."""
        # Extract time value and unit
        time_value = float(time_match.group(1) + (time_match.group(2) or ''))
        time_unit = (time_match.group(3) or 'ms').lower()
        
        # Convert to seconds (our standard unit)
        if time_unit in ['ms', 'milliseconds']:
            time_seconds = time_value / 1000
        else:
            time_seconds = time_value
        
        # Get the time array
        time_array = data.get('data', {}).get('time', [])
        if not time_array:
            return {
                'answer': "I couldn't find time data in the dataset.",
                'metadata': {
                    'confidence': 0.5,
                    'processingTime': 0.5
                }
            }
        
        # Find the closest time index
        closest_idx = self._find_closest_time_index(time_array, time_seconds)
        if closest_idx == -1:
            return {
                'answer': f"I couldn't find a time point close to {time_value} {time_unit} in the data.",
                'metadata': {
                    'confidence': 0.5,
                    'processingTime': 0.5
                }
            }
        
        # Extract signal from query
        signals = self._extract_signals(query, data)
        if not signals:
            # If no specific signal mentioned, return values for all signals
            results = []
            for signal in data.get('data', {}):
                if signal != 'time' and signal in data['data']:
                    signal_data = data['data'][signal]
                    if closest_idx < len(signal_data):
                        value = signal_data[closest_idx]
                        results.append((signal, value))
            
            if not results:
                return {
                    'answer': f"I couldn't find any signal data at time {time_value} {time_unit}.",
                    'metadata': {
                        'confidence': 0.5,
                        'processingTime': 0.5
                    }
                }
            
            # Format the answer
            actual_time = time_array[closest_idx]
            answer_parts = [f"At time {actual_time:.2f}s (closest to your requested time of {time_value} {time_unit}):"]
            for signal, value in results:
                answer_parts.append(f"- {signal}: {value:.2f} {self._get_unit(signal, data)}")
            
            return {
                'answer': "\n".join(answer_parts),
                'metadata': {
                    'confidence': 0.9,
                    'processingTime': 0.7,
                    'time': actual_time,
                    'requestedTime': time_seconds,
                    'values': {signal: value for signal, value in results}
                }
            }
        else:
            # Return value for the specific signal
            signal = signals[0]
            if signal in data.get('data', {}):
                signal_data = data['data'][signal]
                if closest_idx < len(signal_data):
                    value = signal_data[closest_idx]
                    actual_time = time_array[closest_idx]
                    
                    answer = f"At time {actual_time:.2f}s (closest to your requested time of {time_value} {time_unit}), the {signal} is {value:.2f} {self._get_unit(signal, data)}."
                    
                    return {
                        'answer': answer,
                        'metadata': {
                            'confidence': 0.95,
                            'processingTime': 0.5,
                            'value': value,
                            'time': actual_time,
                            'requestedTime': time_seconds
                        }
                    }
            
            return {
                'answer': f"I couldn't find data for {signal} at time {time_value} {time_unit}.",
                'metadata': {
                    'confidence': 0.5,
                    'processingTime': 0.5
                }
            }
    
    def _find_closest_time_index(self, time_array, target_time):
        """Find the index of the closest time value in the array."""
        if not time_array:
            return -1
        
        closest_idx = 0
        closest_diff = abs(time_array[0] - target_time)
        
        for i in range(1, len(time_array)):
            diff = abs(time_array[i] - target_time)
            if diff < closest_diff:
                closest_diff = diff
                closest_idx = i
        
        return closest_idx
    
    def _determine_query_type(self, query: str) -> str:
        """Determine the type of query based on keywords."""
        for query_type, keywords in self.keywords.items():
            for keyword in keywords:
                if keyword in query:
                    return query_type
        return 'unknown'
    
    def _extract_signals(self, query: str, data: Dict[str, Any]) -> List[str]:
        """Extract signal names from the query."""
        available_signals = list(data.get('data', {}).keys())
        matched_signals = []
        
        for signal_key, variations in self.signal_mappings.items():
            for variation in variations:
                if variation in query:
                    # Find the actual signal name in the data
                    for signal in available_signals:
                        if signal.lower() in variations or any(v in signal.lower() for v in variations):
                            if signal not in matched_signals and signal != 'time':
                                matched_signals.append(signal)
                                break
        
        # If no signals matched, return all signals
        if not matched_signals and available_signals:
            return [s for s in available_signals if s != 'time']
        
        return matched_signals
    
    def _process_max_query(self, query: str, data: Dict[str, Any], signals: List[str]) -> Dict[str, Any]:
        """Process a query about maximum values."""
        if not signals:
            return {
                'answer': "I'm not sure which signal you're asking about. Please specify a signal like RPM, speed, temperature, etc.",
                'metadata': {
                    'confidence': 0.5,
                    'processingTime': 0.5
                }
            }
        
        results = []
        for signal in signals:
            if signal in data.get('data', {}):
                signal_data = data['data'][signal]
                max_value = max(signal_data)
                results.append((signal, max_value))
        
        if not results:
            return {
                'answer': "I couldn't find the signals you're asking about in the data.",
                'metadata': {
                    'confidence': 0.5,
                    'processingTime': 0.5
                }
            }
        
        # Format the answer
        if len(results) == 1:
            signal, value = results[0]
            answer = f"The maximum {signal} recorded is {value:.2f} {self._get_unit(signal, data)}."
            metadata = {
                'confidence': 0.95,
                'processingTime': 0.5,
                'value': value
            }
        else:
            answer_parts = []
            for signal, value in results:
                answer_parts.append(f"The maximum {signal} is {value:.2f} {self._get_unit(signal, data)}")
            answer = ". ".join(answer_parts) + "."
            metadata = {
                'confidence': 0.9,
                'processingTime': 0.7,
                'values': {signal: value for signal, value in results}
            }
        
        return {
            'answer': answer,
            'metadata': metadata
        }
    
    def _process_min_query(self, query: str, data: Dict[str, Any], signals: List[str]) -> Dict[str, Any]:
        """Process a query about minimum values."""
        if not signals:
            return {
                'answer': "I'm not sure which signal you're asking about. Please specify a signal like RPM, speed, temperature, etc.",
                'metadata': {
                    'confidence': 0.5,
                    'processingTime': 0.5
                }
            }
        
        results = []
        for signal in signals:
            if signal in data.get('data', {}):
                signal_data = data['data'][signal]
                min_value = min(signal_data)
                results.append((signal, min_value))
        
        if not results:
            return {
                'answer': "I couldn't find the signals you're asking about in the data.",
                'metadata': {
                    'confidence': 0.5,
                    'processingTime': 0.5
                }
            }
        
        # Format the answer
        if len(results) == 1:
            signal, value = results[0]
            answer = f"The minimum {signal} recorded is {value:.2f} {self._get_unit(signal, data)}."
            metadata = {
                'confidence': 0.95,
                'processingTime': 0.5,
                'value': value
            }
        else:
            answer_parts = []
            for signal, value in results:
                answer_parts.append(f"The minimum {signal} is {value:.2f} {self._get_unit(signal, data)}")
            answer = ". ".join(answer_parts) + "."
            metadata = {
                'confidence': 0.9,
                'processingTime': 0.7,
                'values': {signal: value for signal, value in results}
            }
        
        return {
            'answer': answer,
            'metadata': metadata
        }
    
    def _process_avg_query(self, query: str, data: Dict[str, Any], signals: List[str]) -> Dict[str, Any]:
        """Process a query about average values."""
        if not signals:
            return {
                'answer': "I'm not sure which signal you're asking about. Please specify a signal like RPM, speed, temperature, etc.",
                'metadata': {
                    'confidence': 0.5,
                    'processingTime': 0.5
                }
            }
        
        results = []
        for signal in signals:
            if signal in data.get('data', {}):
                signal_data = data['data'][signal]
                avg_value = sum(signal_data) / len(signal_data)
                results.append((signal, avg_value))
        
        if not results:
            return {
                'answer': "I couldn't find the signals you're asking about in the data.",
                'metadata': {
                    'confidence': 0.5,
                    'processingTime': 0.5
                }
            }
        
        # Format the answer
        if len(results) == 1:
            signal, value = results[0]
            answer = f"The average {signal} recorded is {value:.2f} {self._get_unit(signal, data)}."
            metadata = {
                'confidence': 0.95,
                'processingTime': 0.5,
                'value': value
            }
        else:
            answer_parts = []
            for signal, value in results:
                answer_parts.append(f"The average {signal} is {value:.2f} {self._get_unit(signal, data)}")
            answer = ". ".join(answer_parts) + "."
            metadata = {
                'confidence': 0.9,
                'processingTime': 0.7,
                'values': {signal: value for signal, value in results}
            }
        
        return {
            'answer': answer,
            'metadata': metadata
        }
    
    def _process_correlation_query(self, query: str, data: Dict[str, Any], signals: List[str]) -> Dict[str, Any]:
        """Process a query about correlations between signals."""
        if len(signals) < 2:
            return {
                'answer': "I need at least two signals to analyze correlation. Please specify which signals you want to compare.",
                'metadata': {
                    'confidence': 0.5,
                    'processingTime': 0.5
                }
            }
        
        # Take the first two signals mentioned
        signal1, signal2 = signals[:2]
        
        if signal1 in data.get('data', {}) and signal2 in data.get('data', {}):
            signal1_data = data['data'][signal1]
            signal2_data = data['data'][signal2]
            
            # Calculate correlation coefficient
            correlation = np.corrcoef(signal1_data, signal2_data)[0, 1]
            
            # Interpret the correlation
            if correlation > 0.8:
                strength = "strong positive"
            elif correlation > 0.5:
                strength = "moderate positive"
            elif correlation > 0.2:
                strength = "weak positive"
            elif correlation > -0.2:
                strength = "negligible"
            elif correlation > -0.5:
                strength = "weak negative"
            elif correlation > -0.8:
                strength = "moderate negative"
            else:
                strength = "strong negative"
            
            answer = f"There is a {strength} correlation ({correlation:.2f}) between {signal1} and {signal2}."
            
            if correlation > 0.5:
                answer += f" As {signal1} increases, {signal2} tends to increase as well."
            elif correlation < -0.5:
                answer += f" As {signal1} increases, {signal2} tends to decrease."
            
            return {
                'answer': answer,
                'metadata': {
                    'confidence': 0.9,
                    'processingTime': 0.8,
                    'correlation': correlation
                }
            }
        else:
            return {
                'answer': "I couldn't find one or both of the signals you mentioned in the data.",
                'metadata': {
                    'confidence': 0.5,
                    'processingTime': 0.5
                }
            }
    
    def _process_anomaly_query(self, query: str, data: Dict[str, Any], signals: List[str]) -> Dict[str, Any]:
        """Process a query about anomalies in the data."""
        # Simple anomaly detection: look for values that are more than 3 standard deviations from the mean
        anomalies = []
        
        signals_to_check = signals if signals else [s for s in data.get('data', {}).keys() if s != 'time']
        
        for signal in signals_to_check:
            if signal in data.get('data', {}):
                signal_data = data['data'][signal]
                mean = sum(signal_data) / len(signal_data)
                std_dev = np.std(signal_data)
                threshold = 3 * std_dev
                
                for i, value in enumerate(signal_data):
                    if abs(value - mean) > threshold:
                        time_value = data['data']['time'][i] if 'time' in data['data'] else i
                        anomalies.append({
                            'signal': signal,
                            'time': time_value,
                            'value': value,
                            'expected': mean,
                            'deviation': abs(value - mean) / std_dev
                        })
        
        if not anomalies:
            return {
                'answer': "I didn't detect any significant anomalies in the data.",
                'metadata': {
                    'confidence': 0.7,
                    'processingTime': 1.0
                }
            }
        
        # Sort anomalies by deviation (most severe first)
        anomalies.sort(key=lambda x: x['deviation'], reverse=True)
        
        # Format the answer
        answer_parts = ["I detected the following potential anomalies in the data:"]
        
        for i, anomaly in enumerate(anomalies[:5]):  # Show top 5 anomalies
            signal = anomaly['signal']
            time = anomaly['time']
            value = anomaly['value']
            expected = anomaly['expected']
            deviation = anomaly['deviation']
            
            answer_parts.append(f"{i+1}. At time {time:.2f}s, {signal} has a value of {value:.2f} {self._get_unit(signal, data)}, which is {deviation:.1f} standard deviations from the mean ({expected:.2f}).")
        
        if len(anomalies) > 5:
            answer_parts.append(f"... and {len(anomalies) - 5} more anomalies.")
        
        return {
            'answer': "\n".join(answer_parts),
            'metadata': {
                'confidence': 0.85,
                'processingTime': 1.2,
                'anomalies': anomalies[:10]  # Include top 10 anomalies in metadata
            }
        }
    
    def _process_summary_query(self, query: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a query asking for a summary of the data."""
        signals = [s for s in data.get('data', {}).keys() if s != 'time']
        
        if not signals:
            return {
                'answer': "The dataset doesn't contain any signals to summarize.",
                'metadata': {
                    'confidence': 0.5,
                    'processingTime': 0.5
                }
            }
        
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
        
        summary_parts = [f"This dataset contains {duration:.1f} seconds of measurement data with {len(signals)} signals:"]
        
        for signal in signals:
            unit = self._get_unit(signal, data)
            summary_parts.append(f"- {signal} ranges from {stats[signal]['min']:.2f} to {stats[signal]['max']:.2f} {unit} with an average of {stats[signal]['avg']:.2f} {unit}")
        
        return {
            'answer': "\n".join(summary_parts),
            'metadata': {
                'confidence': 0.95,
                'processingTime': 1.5,
                'signalStats': stats
            }
        }
    
    def _get_unit(self, signal: str, data: Dict[str, Any]) -> str:
        """Get the unit for a signal from the metadata."""
        units = data.get('metadata', {}).get('units', {})
        return units.get(signal, "")

# For testing
if __name__ == "__main__":
    import sys
    
    # Create a simple test dataset
    test_data = {
        'metadata': {
            'duration': 10,
            'sampleRate': 100,
            'units': {
                'time': 's',
                'engineRPM': 'rpm',
                'vehicleSpeed': 'km/h'
            }
        },
        'data': {
            'time': [i/10 for i in range(100)],
            'engineRPM': [1000 + i*20 for i in range(100)],
            'vehicleSpeed': [i for i in range(100)]
        }
    }
    
    processor = QueryProcessor()
    
    # Test with a sample query
    if len(sys.argv) > 1:
        query = sys.argv[1]
    else:
        query = "What is the maximum RPM?"
    
    result = processor.process_query(query, test_data)
    print(json.dumps(result, indent=2)) 