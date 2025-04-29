package main

import (
	"fmt"
	"log"
	"net/http"

	"test/ai-client-ui/backend/server"
)

func main() {
	fmt.Println("Starting the Go backend...")

	// Initialize the server
	s := server.NewServer()

	// Define the handler for the root path
	http.HandleFunc("/", s.HandleRoot)
	http.HandleFunc("/chat", s.HandleChat)
	http.HandleFunc("/models", s.HandleModels)

	// Start the server
	log.Fatal(http.ListenAndServe(":8080", nil))
}
