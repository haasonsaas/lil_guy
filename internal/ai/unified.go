package ai

import (
	"fmt"
	"os"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// Provider enum for different AI providers
type Provider int

const (
	ProviderOpenAI Provider = iota
	ProviderClaude
)

// UnifiedMessage represents a message that works with both APIs
type UnifiedMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// UnifiedResponse represents a response from either provider
type UnifiedResponse struct {
	Content          string
	PromptTokens     int
	CompletionTokens int
	Model            string
	Provider         Provider
}

// UnifiedClient wraps both OpenAI and Claude clients
type UnifiedClient struct {
	OpenAIClient *openai.Client
	ClaudeClient *ClaudeClient
}

// NewUnifiedClient creates a new unified AI client
func NewUnifiedClient() *UnifiedClient {
	client := &UnifiedClient{}
	
	// Initialize OpenAI if API key is available
	if openaiKey := os.Getenv("OPENAI_API_KEY"); openaiKey != "" {
		client.OpenAIClient = openai.NewClient(openaiKey)
	}
	
	// Initialize Claude if API key is available
	if claudeKey := os.Getenv("CLAUDE_API_KEY"); claudeKey != "" {
		client.ClaudeClient = NewClaudeClient(claudeKey)
	}
	
	return client
}

// IsModelSupported checks if a model is supported by any provider
func (c *UnifiedClient) IsModelSupported(model string) bool {
	return c.GetProviderForModel(model) != -1
}

// GetProviderForModel determines which provider supports a given model
func (c *UnifiedClient) GetProviderForModel(model string) Provider {
	// Check OpenAI models
	openaiModels := []string{"gpt-4o", "gpt-4o-mini", "gpt-4", "gpt-3.5-turbo"}
	for _, m := range openaiModels {
		if m == model {
			if c.OpenAIClient != nil {
				return ProviderOpenAI
			}
		}
	}
	
	// Check Claude models
	for _, m := range ClaudeModels {
		if m == model {
			if c.ClaudeClient != nil {
				return ProviderClaude
			}
		}
	}
	
	return -1 // Not supported
}

// GetAvailableModels returns all available models from configured providers
func (c *UnifiedClient) GetAvailableModels() []string {
	var models []string
	
	if c.OpenAIClient != nil {
		models = append(models, "gpt-4o", "gpt-4o-mini", "gpt-4", "gpt-3.5-turbo")
	}
	
	if c.ClaudeClient != nil {
		models = append(models, ClaudeModels...)
	}
	
	return models
}

// SendMessage sends a message using the appropriate provider
func (c *UnifiedClient) SendMessage(model string, messages []UnifiedMessage, systemPrompt string) (*UnifiedResponse, error) {
	provider := c.GetProviderForModel(model)
	
	switch provider {
	case ProviderOpenAI:
		return c.sendToOpenAI(model, messages, systemPrompt)
	case ProviderClaude:
		return c.sendToClaude(model, messages, systemPrompt)
	default:
		return nil, fmt.Errorf("model %s is not supported or provider not configured", model)
	}
}

// sendToOpenAI handles OpenAI API calls
func (c *UnifiedClient) sendToOpenAI(model string, messages []UnifiedMessage, systemPrompt string) (*UnifiedResponse, error) {
	if c.OpenAIClient == nil {
		return nil, fmt.Errorf("OpenAI client not configured")
	}
	
	// Convert to OpenAI format
	var openaiMessages []openai.ChatCompletionMessage
	
	// Add system message if provided
	if systemPrompt != "" {
		openaiMessages = append(openaiMessages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleSystem,
			Content: systemPrompt,
		})
	}
	
	// Convert unified messages to OpenAI format
	for _, msg := range messages {
		role := msg.Role
		if role == "assistant" {
			role = openai.ChatMessageRoleAssistant
		} else if role == "user" {
			role = openai.ChatMessageRoleUser
		}
		
		openaiMessages = append(openaiMessages, openai.ChatCompletionMessage{
			Role:    role,
			Content: msg.Content,
		})
	}
	
	response, err := SendToOpenAI(c.OpenAIClient, model, openaiMessages)
	if err != nil {
		return nil, err
	}
	
	if len(response.Choices) == 0 {
		return nil, fmt.Errorf("no response choices received")
	}
	
	return &UnifiedResponse{
		Content:          response.Choices[0].Message.Content,
		PromptTokens:     response.Usage.PromptTokens,
		CompletionTokens: response.Usage.CompletionTokens,
		Model:            model,
		Provider:         ProviderOpenAI,
	}, nil
}

// sendToClaude handles Claude API calls
func (c *UnifiedClient) sendToClaude(model string, messages []UnifiedMessage, systemPrompt string) (*UnifiedResponse, error) {
	if c.ClaudeClient == nil {
		return nil, fmt.Errorf("Claude client not configured")
	}
	
	// Convert to Claude format (exclude system messages from message array)
	var claudeMessages []ClaudeMessage
	for _, msg := range messages {
		if msg.Role != "system" {
			claudeMessages = append(claudeMessages, ClaudeMessage{
				Role:    msg.Role,
				Content: msg.Content,
			})
		}
	}
	
	response, err := c.ClaudeClient.SendMessage(model, claudeMessages, systemPrompt)
	if err != nil {
		return nil, err
	}
	
	// Extract text content from Claude's content blocks
	var content strings.Builder
	for _, block := range response.Content {
		if block.Type == "text" {
			content.WriteString(block.Text)
		}
	}
	
	return &UnifiedResponse{
		Content:          content.String(),
		PromptTokens:     response.Usage.InputTokens,
		CompletionTokens: response.Usage.OutputTokens,
		Model:            model,
		Provider:         ProviderClaude,
	}, nil
}

// CalculateCost calculates the cost for a given response
func (c *UnifiedClient) CalculateCost(response *UnifiedResponse) float64 {
	switch response.Provider {
	case ProviderOpenAI:
		if pricing, exists := ModelPricing[response.Model]; exists {
			return (float64(response.PromptTokens)/1000)*pricing.Input + 
				   (float64(response.CompletionTokens)/1000)*pricing.Output
		}
		return 0
	case ProviderClaude:
		return CalculateClaudeCost(response.Model, response.PromptTokens, response.CompletionTokens)
	default:
		return 0
	}
}

// GetProviderName returns a human-readable provider name
func GetProviderName(provider Provider) string {
	switch provider {
	case ProviderOpenAI:
		return "OpenAI"
	case ProviderClaude:
		return "Claude"
	default:
		return "Unknown"
	}
}