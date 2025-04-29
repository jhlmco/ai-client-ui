# AI Client UI

A user interface for interacting with AI models, with the ability to extend functionality through MCP server extensions.

## Project Goal

To create a user interface for interacting with AI models, with the ability to extend functionality through MCP server extensions.

## System Architecture

The system follows a client-server architecture with an Electron frontend and a Go backend. The backend handles AI model interactions and MCP server communication. The frontend provides a user interface for interacting with the backend.

## Technologies Used

*   Go: Backend programming language.
*   Electron: Frontend framework.
*   gRPC (optional): Communication protocol between frontend and backend.
*   React (optional): Frontend UI library.

## Development Setup

*   Go development environment.
*   Node.js and npm for Electron development.

## Progress

*   Basic project structure and memory bank files created.
*   Electron frontend files created and the application can be launched (with non-fatal DBus errors).
*   Go backend implementation and environment configuration are pending.
*   MCP server extension loading and management are pending.
*   AI model integration is pending.

## Known Issues

*   DBus errors when running the Electron frontend.
*   Persistent Go backend environment configuration issues preventing it from running.
