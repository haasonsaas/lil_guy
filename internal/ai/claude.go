package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	ClaudeAPIURL = "https://api.anthropic.com/v1/messages"
	ClaudeVersion = "2023-06-01"
)

// Claude API structures
type ClaudeMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ClaudeRequest struct {
	Model       string          `json:"model"`
	MaxTokens   int             `json:"max_tokens"`
	Messages    []ClaudeMessage `json:"messages"`
	System      string          `json:"system,omitempty"`
	Temperature float64         `json:"temperature,omitempty"`
	Stream      bool            `json:"stream,omitempty"`
}

type ClaudeContentBlock struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type ClaudeUsage struct {
	InputTokens  int `json:"input_tokens"`
	OutputTokens int `json:"output_tokens"`
}

type ClaudeResponse struct {
	ID         string               `json:"id"`
	Type       string               `json:"type"`
	Role       string               `json:"role"`
	Content    []ClaudeContentBlock `json:"content"`
	Model      string               `json:"model"`
	StopReason string               `json:"stop_reason"`
	Usage      ClaudeUsage          `json:"usage"`
}

// ClaudeClient handles requests to the Anthropic API
type ClaudeClient struct {
	APIKey     string
	HTTPClient *http.Client
}

// NewClaudeClient creates a new Claude API client
func NewClaudeClient(apiKey string) *ClaudeClient {
	return &ClaudeClient{
		APIKey: apiKey,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// SendMessage sends a message to Claude and returns the response
func (c *ClaudeClient) SendMessage(model string, messages []ClaudeMessage, systemPrompt string) (*ClaudeResponse, error) {
	request := ClaudeRequest{
		Model:       model,
		MaxTokens:   4000,
		Messages:    messages,
		System:      systemPrompt,
		Temperature: 0.7,
		Stream:      false,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", ClaudeAPIURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set required headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", c.APIKey)
	req.Header.Set("anthropic-version", ClaudeVersion)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var claudeResp ClaudeResponse
	if err := json.Unmarshal(body, &claudeResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &claudeResp, nil
}

// Available Claude models
var ClaudeModels = []string{
	"claude-3-5-sonnet-20241022",
	"claude-3-5-haiku-20241022", 
	"claude-3-opus-20240229",
	"claude-3-sonnet-20240229",
	"claude-3-haiku-20240307",
}

// EstimateClaudeTokens provides a rough token estimate for Claude
func EstimateClaudeTokens(text string) int {
	// Claude uses roughly 3.5-4 characters per token
	return len(text) / 4
}

// CalculateClaudeCost estimates the cost for Claude API usage
func CalculateClaudeCost(model string, inputTokens, outputTokens int) float64 {
	// Pricing as of 2024 (per million tokens)
	var inputPrice, outputPrice float64
	
	switch model {
	case "claude-3-5-sonnet-20241022":
		inputPrice = 3.00   // $3 per million input tokens
		outputPrice = 15.00 // $15 per million output tokens
	case "claude-3-5-haiku-20241022":
		inputPrice = 1.00   // $1 per million input tokens
		outputPrice = 5.00  // $5 per million output tokens
	case "claude-3-opus-20240229":
		inputPrice = 15.00  // $15 per million input tokens
		outputPrice = 75.00 // $75 per million output tokens
	case "claude-3-sonnet-20240229":
		inputPrice = 3.00   // $3 per million input tokens
		outputPrice = 15.00 // $15 per million output tokens
	case "claude-3-haiku-20240307":
		inputPrice = 0.25   // $0.25 per million input tokens
		outputPrice = 1.25  // $1.25 per million output tokens
	default:
		// Default to Sonnet pricing
		inputPrice = 3.00
		outputPrice = 15.00
	}
	
	inputCost := float64(inputTokens) * inputPrice / 1000000
	outputCost := float64(outputTokens) * outputPrice / 1000000
	
	return inputCost + outputCost
}