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

# Default port for the server
PORT = 5000

# Initialize the query processor
query_processor = QueryProcessor()

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
            'message': 'Server is running'
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
            
            if not query:
                raise ValueError("No query provided")
            
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
            
            # Process the query
            result = query_processor.process_query(query, file_data)
            
            self._set_headers()
            response = {
                'success': True,
                'data': result
            }
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self._handle_error(str(e))
    
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