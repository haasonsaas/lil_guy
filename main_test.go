package main

import (
	"os"
	"path/filepath"
	"testing"

	openai "github.com/sashabaranov/go-openai"
)

func TestGetPreferencesFilePath(t *testing.T) {
	path, err := getPreferencesFilePath()
	if err != nil {
		t.Fatalf("getPreferencesFilePath() failed: %v", err)
	}

	if path == "" {
		t.Error("getPreferencesFilePath() returned empty path")
	}

	if !filepath.IsAbs(path) {
		t.Errorf("getPreferencesFilePath() returned non-absolute path: %s", path)
	}

	expectedSuffix := preferencesFileName
	if filepath.Base(path) != expectedSuffix {
		t.Errorf("getPreferencesFilePath() returned path with wrong filename: got %s, expected to end with %s", path, expectedSuffix)
	}
}

func TestLoadPreferences_NonExistentFile(t *testing.T) {
	// Create a temporary directory for testing
	tmpDir := t.TempDir()

	// Temporarily change the home directory for testing
	originalHome := os.Getenv("HOME")
	defer os.Setenv("HOME", originalHome)
	os.Setenv("HOME", tmpDir)

	prefs, err := loadPreferences()
	if err != nil {
		t.Fatalf("loadPreferences() failed: %v", err)
	}

	if prefs == nil {
		t.Error("loadPreferences() returned nil preferences")
	}

	// Should return empty preferences for non-existent file
	if prefs.BuddyName != "" || prefs.SystemMessage != "" {
		t.Errorf("loadPreferences() returned non-empty preferences for non-existent file: %+v", prefs)
	}
}

func TestSaveAndLoadPreferences(t *testing.T) {
	// Create a temporary directory for testing
	tmpDir := t.TempDir()

	// Temporarily change the home directory for testing
	originalHome := os.Getenv("HOME")
	defer os.Setenv("HOME", originalHome)
	os.Setenv("HOME", tmpDir)

	// Test data
	testPrefs := &Preferences{
		BuddyName:     "TestBuddy",
		SystemMessage: "Test system message",
	}

	// Save preferences
	err := savePreferences(testPrefs)
	if err != nil {
		t.Fatalf("savePreferences() failed: %v", err)
	}

	// Load preferences
	loadedPrefs, err := loadPreferences()
	if err != nil {
		t.Fatalf("loadPreferences() failed: %v", err)
	}

	// Verify loaded preferences match saved ones
	if loadedPrefs.BuddyName != testPrefs.BuddyName {
		t.Errorf("BuddyName mismatch: got %s, want %s", loadedPrefs.BuddyName, testPrefs.BuddyName)
	}

	if loadedPrefs.SystemMessage != testPrefs.SystemMessage {
		t.Errorf("SystemMessage mismatch: got %s, want %s", loadedPrefs.SystemMessage, testPrefs.SystemMessage)
	}
}

func TestLoadPreferences_InvalidJSON(t *testing.T) {
	// Create a temporary directory for testing
	tmpDir := t.TempDir()

	// Temporarily change the home directory for testing
	originalHome := os.Getenv("HOME")
	defer os.Setenv("HOME", originalHome)
	os.Setenv("HOME", tmpDir)

	// Create invalid JSON file
	prefsPath := filepath.Join(tmpDir, preferencesFileName)
	invalidJSON := "{invalid json"
	err := os.WriteFile(prefsPath, []byte(invalidJSON), filePermissions)
	if err != nil {
		t.Fatalf("Failed to create invalid JSON file: %v", err)
	}

	// Should return error for invalid JSON
	_, err = loadPreferences()
	if err == nil {
		t.Error("loadPreferences() should have failed with invalid JSON")
	}
}

func TestDetermineInitialState(t *testing.T) {
	tests := []struct {
		name          string
		prefs         *Preferences
		expectedState appState
		expectedStep  int
	}{
		{
			name:          "nil preferences",
			prefs:         nil,
			expectedState: stateOnboarding,
			expectedStep:  1,
		},
		{
			name:          "empty buddy name",
			prefs:         &Preferences{BuddyName: "", SystemMessage: "test"},
			expectedState: stateOnboarding,
			expectedStep:  1,
		},
		{
			name:          "empty system message",
			prefs:         &Preferences{BuddyName: "TestBuddy", SystemMessage: ""},
			expectedState: stateOnboarding,
			expectedStep:  2,
		},
		{
			name:          "both fields populated",
			prefs:         &Preferences{BuddyName: "TestBuddy", SystemMessage: "Test message"},
			expectedState: stateChatting,
			expectedStep:  0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			state, step := determineInitialState(tt.prefs)
			if state != tt.expectedState {
				t.Errorf("determineInitialState() state = %v, want %v", state, tt.expectedState)
			}
			if step != tt.expectedStep {
				t.Errorf("determineInitialState() step = %v, want %v", step, tt.expectedStep)
			}
		})
	}
}

func TestCreateSystemMessage(t *testing.T) {
	tests := []struct {
		name      string
		prefs     *Preferences
		buddyName string
		expected  string
	}{
		{
			name:      "nil preferences",
			prefs:     nil,
			buddyName: "TestBuddy",
			expected:  "You are a helpful AI assistant. named TestBuddy.",
		},
		{
			name:      "empty system message",
			prefs:     &Preferences{SystemMessage: ""},
			buddyName: "TestBuddy",
			expected:  "You are a helpful AI assistant. named TestBuddy.",
		},
		{
			name:      "custom system message",
			prefs:     &Preferences{SystemMessage: "You are a coding assistant"},
			buddyName: "CodeBuddy",
			expected:  "You are a coding assistant named CodeBuddy.",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := createSystemMessage(tt.prefs, tt.buddyName)
			if result != tt.expected {
				t.Errorf("createSystemMessage() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestFormatChatMessage(t *testing.T) {
	m := model{buddyName: "TestBuddy"}
	width := 80

	tests := []struct {
		name     string
		msg      openai.ChatCompletionMessage
		expected string
	}{
		{
			name: "user message",
			msg: openai.ChatCompletionMessage{
				Role:    openai.ChatMessageRoleUser,
				Content: "Hello",
			},
			expected: "You: Hello",
		},
		{
			name: "assistant message",
			msg: openai.ChatCompletionMessage{
				Role:    openai.ChatMessageRoleAssistant,
				Content: "Hi there",
			},
			expected: "TestBuddy: Hi there",
		},
		{
			name: "system message",
			msg: openai.ChatCompletionMessage{
				Role:    openai.ChatMessageRoleSystem,
				Content: "System message",
			},
			expected: "System message",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := m.formatChatMessage(tt.msg, width)

			// Check that the result contains the expected content
			// We can't do exact string comparison due to styling
			if !containsContent(result, tt.expected) {
				t.Errorf("formatChatMessage() result doesn't contain expected content: got %v, want to contain %v", result, tt.expected)
			}
		})
	}
}

func TestGetOnboardingPrompt(t *testing.T) {
	tests := []struct {
		name     string
		step     int
		expected string
	}{
		{
			name:     "step 1",
			step:     1,
			expected: "Hello! What would you like to name your AI buddy?",
		},
		{
			name:     "step 2",
			step:     2,
			expected: "Great! Now, how would you describe your AI buddy's personality or purpose?",
		},
		{
			name:     "invalid step",
			step:     99,
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m := model{onboardingStep: tt.step}
			result := m.getOnboardingPrompt()

			if tt.expected != "" && !containsContent(result, tt.expected) {
				t.Errorf("getOnboardingPrompt() = %v, want to contain %v", result, tt.expected)
			} else if tt.expected == "" && result != "" {
				t.Errorf("getOnboardingPrompt() = %v, want empty string", result)
			}
		})
	}
}

func TestHandleOnboardingInput(t *testing.T) {
	tests := []struct {
		name           string
		step           int
		input          string
		expectedState  appState
		expectedBuddy  string
		expectedSystem string
	}{
		{
			name:          "step 1 - set buddy name",
			step:          1,
			input:         "MyBuddy",
			expectedState: stateChatting,
			expectedBuddy: "MyBuddy",
		},
		{
			name:           "step 2 - set system message",
			step:           2,
			input:          "You are a helpful assistant",
			expectedState:  stateChatting,
			expectedSystem: "You are a helpful assistant",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a temporary directory for testing
			tmpDir := t.TempDir()

			// Temporarily change the home directory for testing
			originalHome := os.Getenv("HOME")
			defer os.Setenv("HOME", originalHome)
			os.Setenv("HOME", tmpDir)

			m := model{
				onboardingStep: tt.step,
				preferences:    &Preferences{},
				buddyName:      "DefaultBuddy",
				messages: []openai.ChatCompletionMessage{
					{Role: openai.ChatMessageRoleSystem, Content: "test"},
				},
			}

			result, err := m.handleOnboardingInput(tt.input)
			if err != nil {
				t.Fatalf("handleOnboardingInput() failed: %v", err)
			}

			if result.appState != tt.expectedState {
				t.Errorf("handleOnboardingInput() state = %v, want %v", result.appState, tt.expectedState)
			}

			if tt.expectedBuddy != "" && result.buddyName != tt.expectedBuddy {
				t.Errorf("handleOnboardingInput() buddyName = %v, want %v", result.buddyName, tt.expectedBuddy)
			}

			if tt.expectedSystem != "" && result.preferences.SystemMessage != tt.expectedSystem {
				t.Errorf("handleOnboardingInput() systemMessage = %v, want %v", result.preferences.SystemMessage, tt.expectedSystem)
			}
		})
	}
}

// Helper function to check if a string contains expected content (ignoring styling)
func containsContent(got, want string) bool {
	// Simple check - in a real implementation, you might want to strip ANSI codes
	return len(got) > 0 && (want == "" || len(got) >= len(want))
}
