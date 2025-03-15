#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os
import json
import traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
import socketserver
import urllib.parse
from data.loader import load_mat_file, load_mf4_file
from ai.query_processor import QueryProcessor
from ai.openai_integration import OpenAIIntegration
from data.signal_processor import SignalProcessor
from ai.query_engine import AIQueryEngine

# Default port for the server
PORT = 5000

# Initialize the query processors
query_processor = QueryProcessor()
openai_integration = OpenAIIntegration()
signal_processor = SignalProcessor()
query_engine = AIQueryEngine()

class DataProcessingHandler(BaseHTTPRequestHandler):
    """
    HTTP request handler for data processing requests.
    """
    
    def _set_headers(self, content_type="application/json"):
        self.send_response(200)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        try:
            # Parse the URL and query parameters
            parsed_path = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_path.query)
            
            # Route to the appropriate handler based on the path
            if parsed_path.path == '/api/health':
                self._handle_health_check()
            else:
                self._handle_not_found()
                
        except Exception as e:
            self._handle_error(str(e))
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            # Get the content length
            content_length = int(self.headers['Content-Length'])
            
            # Read the request body
            post_data = self.rfile.read(content_length)
            request = json.loads(post_data.decode('utf-8'))
            
            # Route to the appropriate handler based on the path
            if self.path == '/api/load-file':
                self._handle_load_file(request)
            elif self.path == '/api/process-query':
                self._handle_process_query(request)
            elif self.path == '/api/process-signal':
                self._handle_process_signal(request)
            elif self.path == '/api/process-ai-query':
                self._handle_process_ai_query(request)
            else:
                self._handle_not_found()
                
        except Exception as e:
            self._handle_error(str(e))
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def _handle_health_check(self):
        """Handle health check requests"""
        self._set_headers()
        response = {
            'status': 'ok',
            'message': 'Server is running',
            'openai_available': openai_integration.is_available()
        }
        self.wfile.write(json.dumps(response).encode())
    
    def _handle_load_file(self, request):
        """Handle file loading requests"""
        try:
            file_path = request.get('filePath')
            
            if not file_path:
                raise ValueError("No file path provided")
            
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
            
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.mat':
                result = load_mat_file(file_path)
            elif file_extension == '.mf4':
                result = load_mf4_file(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
            
            self._set_headers()
            response = {
                'success': True,
                'data': result
            }
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self._handle_error(str(e))
    
    def _handle_process_query(self, request):
        """Handle natural language query processing"""
        try:
            query = request.get('query')
            file_path = request.get('filePath')
            context = request.get('context')
            use_openai = request.get('use_openai', True)  # Default to using OpenAI if available
            
            if not query:
                raise ValueError("No query provided")
            
            # Log the context if available
            if context:
                print(f"Received context with query: {json.dumps(context, default=str)}")
            
            # Get the file data
            # In a real implementation, we would load the file if it's not already loaded
            # For now, we'll just use the file path to determine which file to load
            
            if file_path and os.path.exists(file_path):
                file_extension = os.path.splitext(file_path)[1].lower()
                
                if file_extension == '.mat':
                    file_data = load_mat_file(file_path)
                elif file_extension == '.mf4':
                    file_data = load_mf4_file(file_path)
                else:
                    raise ValueError(f"Unsupported file type: {file_extension}")
            else:
                # Use a dummy dataset for testing
                file_data = {
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
            
            # Process the query with context if available
            # Try to use OpenAI if available and requested
            if use_openai and openai_integration.is_available():
                print(f"Processing query with OpenAI: {query}")
                result = openai_integration.process_query(query, file_data, context)
            else:
                print(f"Processing query with built-in processor: {query}")
                result = query_processor.process_query(query, file_data, context)
            
            self._set_headers()
            response = {
                'success': True,
                'data': result,
                'used_openai': use_openai and openai_integration.is_available()
            }
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self._handle_error(str(e))
    
    def _handle_process_signal(self, request):
        """Handle signal processing requests"""
        try:
            operation_type = request.get('operation')
            signals_data = request.get('signals', {})
            parameters = request.get('parameters', {}) or {}
            
            if not operation_type:
                raise ValueError("No operation specified")
            
            # For operations that require specific signal parameters, map them from the signals array
            signals = request.get('signals_list', [])
            
            # If we have a signals array and it's not already in parameters, add them
            if operation_type in ['add', 'subtract', 'multiply', 'divide'] and len(signals) >= 2:
                if 'signal1' not in parameters:
                    parameters['signal1'] = signals[0]
                if 'signal2' not in parameters:
                    parameters['signal2'] = signals[1]
            elif operation_type in ['abs', 'scale', 'derivative', 'filter', 'fft', 'stats'] and len(signals) >= 1:
                if 'signal' not in parameters:
                    parameters['signal'] = signals[0]
            
            # Execute the operation
            result = signal_processor.execute_operation(operation_type, signals_data, **parameters)
            
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
    
    def _handle_process_ai_query(self, request):
        """Handle AI query processing"""
        try:
            query = request.get('query')
            available_signals = request.get('availableSignals', [])
            
            if not query:
                raise ValueError("No query provided")
            
            # Process the query
            result = query_engine.process_query(query, available_signals)
            
            # Return the result
            self._set_headers()
            response = {
                'status': 'success',
                'operations': [op.dict() for op in result.operations],
                'explanation': result.explanation
            }
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self._handle_error(f"Error processing AI query: {str(e)}")
            traceback.print_exc()
    
    def _handle_not_found(self):
        """Handle 404 Not Found errors"""
        self.send_response(404)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = {
            'success': False,
            'error': 'Not Found'
        }
        self.wfile.write(json.dumps(response).encode())
    
    def _handle_error(self, error_message):
        """Handle internal server errors"""
        self.send_response(500)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = {
            'success': False,
            'error': error_message,
            'traceback': traceback.format_exc()
        }
        self.wfile.write(json.dumps(response).encode())

def run_server(port=PORT):
    """
    Run the HTTP server on the specified port.
    """
    server_address = ('', port)
    httpd = HTTPServer(server_address, DataProcessingHandler)
    print(f"Starting server on port {port}...")
    print(f"OpenAI integration {'available' if openai_integration.is_available() else 'not available'}")
    httpd.serve_forever()

if __name__ == "__main__":
    # Get the port from command line arguments if provided
    port = PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port number: {sys.argv[1]}")
            sys.exit(1)
    
    run_server(port) 