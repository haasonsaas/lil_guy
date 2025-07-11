package chat

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	chatHistoryDir  = ".lil_guy_chats"
	filePermissions = 0644
)

// ChatMessage represents a message with timestamp and metadata.
type ChatMessage struct {
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
	Model     string    `json:"model,omitempty"`
}

// ChatHistory represents a saved conversation.
type ChatHistory struct {
	Messages  []ChatMessage `json:"messages"`
	BuddyName string        `json:"buddy_name"`
	Model     string        `json:"model"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

// GetChatHistoryDir returns the directory path for chat history files.
func GetChatHistoryDir() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home directory: %w", err)
	}
	historyDir := filepath.Join(homeDir, chatHistoryDir)

	// Create directory if it doesn't exist
	if err := os.MkdirAll(historyDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create chat history directory: %w", err)
	}

	return historyDir, nil
}

// SaveChat saves the current conversation to a file.
func SaveChat(history ChatHistory) (string, error) {
	if len(history.Messages) == 0 {
		return "", fmt.Errorf("no messages to save")
	}

	historyDir, err := GetChatHistoryDir()
	if err != nil {
		return "", err
	}

	now := time.Now()
	filename := fmt.Sprintf("chat_%s.json", now.Format("2006-01-02_15-04-05"))
	filePath := filepath.Join(historyDir, filename)

	history.CreatedAt = now
	history.UpdatedAt = now

	data, err := json.MarshalIndent(history, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal chat history: %w", err)
	}

	if err := os.WriteFile(filePath, data, filePermissions); err != nil {
		return "", fmt.Errorf("failed to write chat history file: %w", err)
	}

	return filename, nil
}

// LoadChat loads a specific chat history file.
func LoadChat(filename string) (*ChatHistory, error) {
	historyDir, err := GetChatHistoryDir()
	if err != nil {
		return nil, err
	}

	filePath := filepath.Join(historyDir, filename)
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read chat file: %w", err)
	}

	var history ChatHistory
	if err := json.Unmarshal(data, &history); err != nil {
		return nil, fmt.Errorf("failed to parse chat file: %w", err)
	}

	return &history, nil
}

// ListChats returns a list of saved chat files.
func ListChats() ([]string, error) {
	historyDir, err := GetChatHistoryDir()
	if err != nil {
		return nil, err
	}

	files, err := os.ReadDir(historyDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read chat history directory: %w", err)
	}

	var chatFiles []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".json") {
			chatFiles = append(chatFiles, file.Name())
		}
	}

	return chatFiles, nil
}

// ExportToMarkdown exports the current chat to a markdown file.
func ExportToMarkdown(history ChatHistory) (string, error) {
	if len(history.Messages) == 0 {
		return "", fmt.Errorf("no messages to export")
	}

	historyDir, err := GetChatHistoryDir()
	if err != nil {
		return "", err
	}

	now := time.Now()
	filename := fmt.Sprintf("chat_%s.md", now.Format("2006-01-02_15-04-05"))
	filePath := filepath.Join(historyDir, filename)

	var markdown strings.Builder
	markdown.WriteString(fmt.Sprintf("# Chat with %s\n\n", history.BuddyName))
	markdown.WriteString(fmt.Sprintf("**Date:** %s\n", now.Format("January 2, 2006 15:04:05")))
	markdown.WriteString(fmt.Sprintf("**Model:** %s\n\n", history.Model))
	markdown.WriteString("---\n\n")

	for _, msg := range history.Messages {
		if msg.Role == "user" {
			markdown.WriteString(fmt.Sprintf("**You** (%s):\n", msg.Timestamp.Format("15:04")))
		} else {
			markdown.WriteString(fmt.Sprintf("**%s** (%s):\n", history.BuddyName, msg.Timestamp.Format("15:04")))
		}
		markdown.WriteString(fmt.Sprintf("%s\n\n", msg.Content))
	}

	return filename, os.WriteFile(filePath, []byte(markdown.String()), filePermissions)
}
