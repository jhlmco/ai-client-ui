package models

// Server struct
type Server struct {
	// Add any server-related fields here
}

// ChatRequest represents the request body for the /chat endpoint.
type ChatRequest struct {
	Message        string `json:"message"`
	ApiKey         string `json:"apiKey"`
	ApiType        string `json:"apiType"`        // Add ApiType field
	Model          string `json:"model"`          // Add Model field
	OpenAIHostname string `json:"openaiHostname"` // Add OpenAIHostname field
	OpenAIPath     string `json:"openaiPath"`     // Add OpenAIPath field
}

// ChatResponse represents the response body for the /chat endpoint.
type ChatResponse struct {
	Response string `json:"response"`
}

// ModelsResponse represents the response body for the /models endpoint.
type ModelsResponse struct {
	Models []string `json:"models"`
}
