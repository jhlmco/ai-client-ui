# System Patterns

**System Architecture:**

The system follows a client-server architecture with an Electron frontend and a Go backend. The backend handles AI model interactions and MCP server communication. The frontend provides a user interface for interacting with the backend.

**Key Technical Decisions:**

*   Use Go for the backend due to its performance and concurrency capabilities.
*   Use Electron for the frontend to enable cross-platform compatibility.
*   Use a modular design to allow for easy addition of new MCP server extensions.

**Design Patterns in Use:**

*   **Plugin Pattern:** MCP server extensions are treated as plugins that can be dynamically loaded and unloaded.
*   **Observer Pattern:** The frontend observes changes in the backend and updates the UI accordingly.

**Component Relationships:**

*   The frontend communicates with the backend via HTTP or gRPC.
*   The backend communicates with AI models and MCP servers via their respective APIs.

**Critical Implementation Paths:**

*   Loading and unloading MCP server extensions.
*   Handling user requests from the frontend.
*   Communicating with AI models and MCP servers.
