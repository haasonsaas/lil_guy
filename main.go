package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"

	"lil_guy/internal/ai"
	"lil_guy/internal/tui"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}

	// Check for at least one API key
	openaiKey := os.Getenv("OPENAI_API_KEY")
	claudeKey := os.Getenv("CLAUDE_API_KEY")
	
	if openaiKey == "" && claudeKey == "" {
		fmt.Println("At least one API key must be set:")
		fmt.Println("  OPENAI_API_KEY for OpenAI models")
		fmt.Println("  CLAUDE_API_KEY for Claude models")
		os.Exit(1)
	}

	client := ai.NewUnifiedClient()
	tui.Start(client)
}