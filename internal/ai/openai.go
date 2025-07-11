package ai

import (
	"context"
	"fmt"

	openai "github.com/sashabaranov/go-openai"
)

// TokenUsage tracks token consumption and costs.
type TokenUsage struct {
	TotalTokens       int     `json:"total_tokens"`
	PromptTokens      int     `json:"prompt_tokens"`
	CompletionTokens  int     `json:"completion_tokens"`
	EstimatedCost     float64 `json:"estimated_cost"`
	RequestCount      int     `json:"request_count"`
}

// ModelPricing defines the cost per 1K tokens for each model.
var ModelPricing = map[string]struct {
	Input  float64
	Output float64
}{
	"gpt-4o":        {Input: 0.0025, Output: 0.01},
	"gpt-4o-mini":   {Input: 0.00015, Output: 0.0006},
	"gpt-4":         {Input: 0.03, Output: 0.06},
	"gpt-3.5-turbo": {Input: 0.0015, Output: 0.002},
}

// GetModelForRequest returns the OpenAI model constant for the given model name.
func GetModelForRequest(modelName string) string {
	switch modelName {
	case "gpt-4o":
		return openai.GPT4o
	case "gpt-4o-mini":
		return openai.GPT4oMini
	case "gpt-4":
		return openai.GPT4
	case "gpt-3.5-turbo":
		return openai.GPT3Dot5Turbo
	default:
		return openai.GPT4o
	}
}

// SendToOpenAI sends a prompt to OpenAI and returns the response.
func SendToOpenAI(client *openai.Client, model string, messages []openai.ChatCompletionMessage) (openai.ChatCompletionResponse, error) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	response, err := client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model:    GetModelForRequest(model),
			Messages: messages,
		},
	)
	if err != nil {
		return openai.ChatCompletionResponse{}, fmt.Errorf("failed to create chat completion: %w", err)
	}

	return response, nil
}
