#!/bin/bash

# MesAIc Application Starter for macOS/Linux
echo -e "\033[1;36mStarting MesAIc Application...\033[0m"

# Kill any existing Node.js processes (optional)
if pgrep node > /dev/null; then
    pkill node
    echo -e "\033[1;33mKilled existing Node.js processes\033[0m"
else
    echo -e "\033[1;30mNo existing Node.js processes found\033[0m"
fi

# Function to clean up when script is terminated
cleanup() {
    echo -e "\n\033[1;33mShutting down servers...\033[0m"
    
    # Kill the Python server
    if [ ! -z "$PYTHON_PID" ]; then
        kill $PYTHON_PID 2>/dev/null
    fi
    
    # Kill the Collaboration server
    if [ ! -z "$COLLAB_PID" ]; then
        kill $COLLAB_PID 2>/dev/null
    fi
    
    # Kill the Next.js server
    if [ ! -z "$NEXTJS_PID" ]; then
        kill $NEXTJS_PID 2>/dev/null
    fi
    
    # Kill any remaining Node.js processes
    pkill node 2>/dev/null
    
    echo -e "\033[1;32mAll servers have been shut down.\033[0m"
    exit 0
}

# Set up trap to catch SIGINT (Ctrl+C) and other termination signals
trap cleanup SIGINT SIGTERM EXIT

# Start the Python server in the background
python python/server.py > python_server.log 2>&1 &
PYTHON_PID=$!
echo -e "\033[1;32mStarted Python server (PID: $PYTHON_PID)\033[0m"

# Wait a moment to ensure Python server is up
echo -e "\033[1;30mWaiting for Python server to initialize...\033[0m"
sleep 2

# Start the Node.js collaboration server in the background
node server/index.js > collab_server.log 2>&1 &
COLLAB_PID=$!
echo -e "\033[1;32mStarted Collaboration server (PID: $COLLAB_PID)\033[0m"

# Wait a moment to ensure Collaboration server is up
echo -e "\033[1;30mWaiting for Collaboration server to initialize...\033[0m"
sleep 2

# Start the Next.js development server in the background
npm run dev > nextjs_server.log 2>&1 &
NEXTJS_PID=$!
echo -e "\033[1;32mStarted Next.js server (PID: $NEXTJS_PID)\033[0m"

echo -e "\n\033[1;36mMesAIc application is now running!\033[0m"
echo -e "\033[1;35mPython server: http://localhost:5000\033[0m"
echo -e "\033[1;35mCollaboration server: http://localhost:3001\033[0m"
echo -e "\033[1;35mNext.js server: http://localhost:3000\033[0m"
echo -e "\033[1;35mLogs: python_server.log, collab_server.log, and nextjs_server.log\033[0m"

# Keep this script running until Ctrl+C is pressed
echo -e "\n\033[1;33mPress Ctrl+C to shut down all servers...\033[0m"
while true; do
    sleep 1
done 