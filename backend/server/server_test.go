package server

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"ai-client-ui/backend/models" // Import the models package
)

func TestGetProxyFromEnv(t *testing.T) {
	tests := []struct {
		name        string
		httpsProxy  string
		httpProxy   string
		noProxy     string
		requestURL  string
		expectedURL string
		expectError bool
	}{
		{
			name:        "HTTPS_PROXY set",
			httpsProxy:  "http://localhost:8080",
			requestURL:  "http://example.com",
			expectedURL: "http://localhost:8080",
			expectError: false,
		},
		{
			name:        "HTTP_PROXY set",
			httpProxy:   "http://localhost:8081",
			requestURL:  "http://example.com",
			expectedURL: "http://localhost:8081",
			expectError: false,
		},
		{
			name:        "HTTPS_PROXY takes precedence",
			httpsProxy:  "http://localhost:8080",
			httpProxy:   "http://localhost:8081",
			requestURL:  "http://example.com",
			expectedURL: "http://localhost:8080",
			expectError: false,
		},
		{
			name:        "NO_PROXY bypass",
			httpsProxy:  "http://localhost:8080",
			noProxy:     "example.com",
			requestURL:  "http://example.com",
			expectedURL: "", // nil URL indicates bypass
			expectError: false,
		},
		{
			name:        "NO_PROXY wildcard bypass",
			httpsProxy:  "http://localhost:8080",
			noProxy:     "*.example.com",
			requestURL:  "http://sub.example.com",
			expectedURL: "", // nil URL indicates bypass
			expectError: false,
		},
		{
			name:        "NO_PROXY list bypass",
			httpsProxy:  "http://localhost:8080",
			noProxy:     "example.com,google.com",
			requestURL:  "http://google.com",
			expectedURL: "", // nil URL indicates bypass
			expectError: false,
		},
		{
			name:        "Invalid proxy URL",
			httpsProxy:  "://invalid-url",
			requestURL:  "http://example.com",
			expectedURL: "",    // Fallback to default, which might return nil or an error depending on environment
			expectError: false, // We don't expect an error from the function itself, but the proxy func might return one
		},
		{
			name:        "No proxy set",
			requestURL:  "http://example.com",
			expectedURL: "", // Fallback to default, which might return nil or an error depending on environment
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Setenv("HTTPS_PROXY", tt.httpsProxy)
			os.Setenv("HTTP_PROXY", tt.httpProxy)
			os.Setenv("NO_PROXY", tt.noProxy)
			defer os.Unsetenv("HTTPS_PROXY")
			defer os.Unsetenv("HTTP_PROXY")
			defer os.Unsetenv("NO_PROXY")

			proxyFunc := getProxyFromEnv()
			req, _ := http.NewRequest("GET", tt.requestURL, nil)
			proxyURL, err := proxyFunc(req)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected an error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("Did not expect an error but got: %v", err)
				}
				if tt.expectedURL == "" {
					if proxyURL != nil {
						t.Errorf("Expected no proxy URL but got: %v", proxyURL)
					}
				} else {
					if proxyURL == nil || proxyURL.String() != tt.expectedURL {
						t.Errorf("Expected proxy URL %s but got %v", tt.expectedURL, proxyURL)
					}
				}
			}
		})
	}
}

func TestHandleRoot(t *testing.T) {
	server := NewServer()
	req, err := http.NewRequest("GET", "/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(server.HandleRoot)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	expected := "Hello from the Go backend!"
	if rr.Body.String() != expected {
		t.Errorf("handler returned unexpected body: got %v want %v",
			rr.Body.String(), expected)
	}
}

func TestHandleChat_InvalidMethod(t *testing.T) {
	server := NewServer()
	req, err := http.NewRequest("GET", "/chat", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(server.HandleChat)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusMethodNotAllowed {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusMethodNotAllowed)
	}
}

func TestHandleChat_MissingApiKey(t *testing.T) {
	server := NewServer()
	requestBody := models.ChatRequest{
		ApiType: "Gemini",
		Message: "Hello",
		Model:   "gemini-1.5-flash-latest",
	}
	jsonBody, _ := json.Marshal(requestBody)
	req, err := http.NewRequest("POST", "/chat", bytes.NewBuffer(jsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(server.HandleChat)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusBadRequest)
	}

	expected := "API key is missing\n"
	if rr.Body.String() != expected {
		t.Errorf("handler returned unexpected body: got %v want %v",
			rr.Body.String(), expected)
	}
}

func TestHandleChat_InvalidApiType(t *testing.T) {
	server := NewServer()
	requestBody := models.ChatRequest{
		ApiKey:  "fake-api-key",
		ApiType: "Invalid",
		Message: "Hello",
		Model:   "gemini-1.5-flash-latest",
	}
	jsonBody, _ := json.Marshal(requestBody)
	req, err := http.NewRequest("POST", "/chat", bytes.NewBuffer(jsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(server.HandleChat)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusBadRequest)
	}

	expected := "Invalid API type specified\n"
	if rr.Body.String() != expected {
		t.Errorf("handler returned unexpected body: got %v want %v",
			rr.Body.String(), expected)
	}
}

func TestHandleModels_InvalidMethod(t *testing.T) {
	server := NewServer()
	req, err := http.NewRequest("POST", "/models", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(server.HandleModels)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusMethodNotAllowed {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusMethodNotAllowed)
	}
}

func TestHandleModels_MissingApiKey(t *testing.T) {
	server := NewServer()
	req, err := http.NewRequest("GET", "/models", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(server.HandleModels)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusBadRequest)
	}

	expected := "API key is missing\n"
	if rr.Body.String() != expected {
		t.Errorf("handler returned unexpected body: got %v want %v",
			rr.Body.String(), expected)
	}
}

// Note: Testing the actual API calls to Gemini and OpenAI requires mocking
// the external API calls. This is beyond the scope of basic unit tests
// and would typically be done with integration tests or more advanced mocking libraries.
// The tests above focus on the server's logic for handling requests,
// validating input, and routing based on API type.
