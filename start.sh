#!/bin/bash

BACKEND_PATH="$PWD/backend"
FRONTEND_PATH="$PWD/frontend"

# Stop the backend process on script exit
trap 'fuser -k 8080/tcp' EXIT INT TERM

# Start the backend
echo "Starting the backend..."
cd "$BACKEND_PATH" && go run main.go &

# Wait a few seconds for the backend to start
sleep 5
cd -

# Start the frontend
echo "Starting the frontend..."
cd "$FRONTEND_PATH" && npm start

echo "Both backend and frontend started."
