# Active Context

**Current Work Focus:** Update Memory Bank files to reflect recent changes.

**Recent Changes:**

*   Removed use of config.yaml file.
*   Updated backend/server/server.go to read config settings from environment variables.

**Next Steps:**

*   Update remaining memory bank files.
*   Use attempt_completion to present the result.

**Active Decisions and Considerations:**

*   How to handle errors when fetching the list of OpenAI models.
*   How to persist the selected model across sessions.

**Important Patterns and Preferences:**

*   Use a modular design for both the backend and frontend.
*   Follow Go coding conventions for the backend.
*   Use React or a similar framework for the frontend.

**Learnings and Project Insights:**

*   The project requires a clear separation of concerns between the backend and frontend.
*   MCP server extensions should be easily pluggable into the system.

**Current Status:**

*   Project setup is in progress.
*   Electron frontend is partially functional.
*   Go backend is running.
*   OpenAI model selection is implemented.
*   Explicit proxy configuration with `no_proxy` handling is complete.
*   Structs and models have been successfully moved to a separate file.
