package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/google/generative-ai-go/genai"
	"github.com/sashabaranov/go-openai"
	"google.golang.org/api/option"
)

// Server struct
type Server struct {
	// Add any server-related fields here
}

// NewServer creates a new server instance
func NewServer() *Server {
	return &Server{}
}

// HandleRoot handles requests to the root path
func (s *Server) HandleRoot(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Hello from the Go backend!")
}

// HandleChat handles requests to the /chat path
func (s *Server) HandleChat(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers to allow requests from the frontend
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		// Handle preflight requests
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var requestBody struct {
		Message string `json:"message"`
		ApiKey  string `json:"apiKey"`
		ApiType string `json:"apiType"` // Add ApiType field
	}

	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, "Error decoding request body", http.StatusBadRequest)
		return
	}

	if requestBody.ApiKey == "" {
		http.Error(w, "API key is missing", http.StatusBadRequest)
		return
	}

	var responseMessage string
	var client *genai.Client                // Declare client outside the switch
	var resp *genai.GenerateContentResponse // Declare resp outside the switch

	switch requestBody.ApiType {
	case "Gemini":
		ctx := context.Background()
		client, err = genai.NewClient(ctx, option.WithAPIKey(requestBody.ApiKey))
		if err != nil {
			log.Println("Error creating Gemini client:", err)
			http.Error(w, "Error creating Gemini client", http.StatusInternalServerError)
			return
		}
		defer client.Close()

		// For text-only input, use a suitable Gemini model
		model := client.GenerativeModel("gemini-1.5-flash-latest")

		// Send the message to the model
		resp, err = model.GenerateContent(ctx, genai.Text(requestBody.Message))
		if err != nil {
			log.Println("Error generating content:", err)
			http.Error(w, "Error generating content", http.StatusInternalServerError)
			return
		}

		// Extract the text from the response
		if len(resp.Candidates) > 0 && len(resp.Candidates[0].Content.Parts) > 0 {
			responseMessage = fmt.Sprint(resp.Candidates[0].Content.Parts[0])
		} else {
			responseMessage = "No response from Gemini API."
		}

	case "OpenAI":
		ctx := context.Background()
		client := openai.NewClient(requestBody.ApiKey)

		resp, err := client.CreateChatCompletion(
			ctx,
			openai.ChatCompletionRequest{
				Model: openai.GPT3Dot5Turbo, // Or another suitable OpenAI model
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    openai.ChatMessageRoleUser,
						Content: requestBody.Message,
					},
				},
			},
		)

		if err != nil {
			log.Println("Error creating OpenAI chat completion:", err)
			http.Error(w, "Error creating OpenAI chat completion", http.StatusInternalServerError)
			return
		}

		if len(resp.Choices) > 0 {
			responseMessage = resp.Choices[0].Message.Content
		} else {
			responseMessage = "No response from OpenAI API."
		}

	default:
		http.Error(w, "Invalid API type specified", http.StatusBadRequest)
		return
	}

	responseBody := struct {
		Response string `json:"response"`
	}{
		Response: responseMessage,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responseBody)
}
