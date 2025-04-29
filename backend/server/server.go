package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"

	"ai-client-ui/backend/models" // Import the new models package

	"github.com/google/generative-ai-go/genai"
	"github.com/sashabaranov/go-openai"
	"google.golang.org/api/option"
)

// getProxyFromEnv checks for HTTPS_PROXY, HTTP_PROXY, and NO_PROXY environment variables
// and returns a proxy function for http.Transport.
func getProxyFromEnv() func(*http.Request) (*url.URL, error) {
	proxyURL := os.Getenv("HTTPS_PROXY")
	if proxyURL == "" {
		proxyURL = os.Getenv("HTTP_PROXY")
	}

	noProxy := os.Getenv("NO_PROXY")
	noProxyList := []string{}
	if noProxy != "" {
		noProxyList = strings.Split(noProxy, ",")
	}

	if proxyURL == "" {
		return http.ProxyFromEnvironment // Fallback to default behavior if no proxy is set
	}

	fixedURL, err := url.Parse(proxyURL)
	if err != nil {
		log.Printf("Error parsing proxy URL %s: %v", proxyURL, err)
		return http.ProxyFromEnvironment // Fallback on error
	}

	return func(req *http.Request) (*url.URL, error) {
		host := req.URL.Hostname()
		for _, bypass := range noProxyList {
			if bypass == "*" || host == bypass {
				return nil, nil // Bypass proxy for this host
			}
			// Basic wildcard matching for subdomains
			if strings.HasPrefix(bypass, "*.") && strings.HasSuffix(host, bypass[1:]) {
				return nil, nil // Bypass proxy for subdomains
			}
		}
		return fixedURL, nil // Use the proxy
	}
}

// NewServer creates a new server instance
func NewServer() *models.Server {
	return &models.Server{}
}

// HandleRoot handles requests to the root path
func (s *models.Server) HandleRoot(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Hello from the Go backend!")
}

// HandleChat handles requests to the /chat path
func (s *models.Server) HandleChat(w http.ResponseWriter, r *http.Request) {
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

	var requestBody models.ChatRequest

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
		httpClient := &http.Client{
			Transport: &http.Transport{
				Proxy: getProxyFromEnv(),
			},
		}
		client, err = genai.NewClient(ctx, option.WithAPIKey(requestBody.ApiKey), option.WithHTTPClient(httpClient))
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
		config := openai.DefaultConfig(requestBody.ApiKey)
		config.HTTPClient = &http.Client{
			Transport: &http.Transport{
				Proxy: getProxyFromEnv(),
			},
		}
		client := openai.NewClientWithConfig(config)

		resp, err := client.CreateChatCompletion(
			ctx,
			openai.ChatCompletionRequest{
				Model: requestBody.Model, // Or another suitable OpenAI model
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

	responseBody := models.ChatResponse{
		Response: responseMessage,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responseBody)
}

// HandleModels handles requests to the /models path
func (s *models.Server) HandleModels(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers to allow requests from the frontend
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		// Handle preflight requests
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	apiKey := r.URL.Query().Get("apiKey")
	if apiKey == "" {
		http.Error(w, "API key is missing", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	config := openai.DefaultConfig(apiKey)
	config.HTTPClient = &http.Client{
		Transport: &http.Transport{
			Proxy: getProxyFromEnv(),
		},
	}
	client := openai.NewClientWithConfig(config)

	models, err := client.ListModels(ctx)
	if err != nil {
		log.Println("Error listing OpenAI models:", err)
		http.Error(w, "Error listing OpenAI models", http.StatusInternalServerError)
		return
	}

	var modelNames []string
	for _, model := range models.Models {
		modelNames = append(modelNames, model.ID)
	}

	responseBody := models.ModelsResponse{
		Models: modelNames,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responseBody)
}
