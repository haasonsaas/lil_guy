package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	openai "github.com/sashabaranov/go-openai"

	"lil_guy/internal/tui"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}

	key := os.Getenv("OPENAI_API_KEY")
	if key == "" {
		fmt.Println("OPENAI_API_KEY environment variable not set")
		os.Exit(1)
	}

	client := openai.NewClient(key)
	tui.Start(client)
}