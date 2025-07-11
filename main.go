package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"time"

	"github.com/alecthomas/chroma/v2"
	"github.com/alecthomas/chroma/v2/formatters"
	"github.com/alecthomas/chroma/v2/lexers"
	"github.com/alecthomas/chroma/v2/styles"
	"github.com/charmbracelet/bubbles/spinner"
	"github.com/charmbracelet/bubbles/textinput"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/x/term"
	"github.com/joho/godotenv"
	openai "github.com/sashabaranov/go-openai"
)

// Constants for UI layout and configuration
const (
	defaultBuddyName     = "AI"
	defaultSystemMessage = "You are a helpful AI assistant."
	defaultModel         = "gpt-4o"
	preferencesFileName  = ".lil_guy_preferences.json"
	chatHistoryDir       = ".lil_guy_chats"
	textInputCharLimit   = 256
	textInputWidth       = 80
	textInputPrompt      = "> "
	viewportHeightOffset = 6 // Height offset for input and status lines
	textInputWidthOffset = 4 // Width offset for prompt and padding
	filePermissions      = 0644
	maxOnboardingSteps   = 2
)

// Theme represents a color scheme
type Theme struct {
	Name              string
	UserMessage       string
	AssistantMessage  string
	Spinner           string
	InputLabel        string
	Status            string
	Background        string
	Highlight         string
}

// Available themes
var themes = map[string]Theme{
	"default": {
		Name:              "Default",
		UserMessage:       "9",
		AssistantMessage:  "6",
		Spinner:           "205",
		InputLabel:        "10",
		Status:            "8",
		Background:        "240",
		Highlight:         "15",
	},
	"dark": {
		Name:              "Dark",
		UserMessage:       "11",
		AssistantMessage:  "14",
		Spinner:           "13",
		InputLabel:        "12",
		Status:            "7",
		Background:        "235",
		Highlight:         "15",
	},
	"ocean": {
		Name:              "Ocean",
		UserMessage:       "4",
		AssistantMessage:  "6",
		Spinner:           "12",
		InputLabel:        "14",
		Status:            "8",
		Background:        "17",
		Highlight:         "15",
	},
	"sunset": {
		Name:              "Sunset",
		UserMessage:       "9",
		AssistantMessage:  "11",
		Spinner:           "13",
		InputLabel:        "10",
		Status:            "8",
		Background:        "52",
		Highlight:         "15",
	},
	"forest": {
		Name:              "Forest",
		UserMessage:       "2",
		AssistantMessage:  "10",
		Spinner:           "3",
		InputLabel:        "14",
		Status:            "8",
		Background:        "22",
		Highlight:         "15",
	},
}

// Color constants (using default theme)
const (
	colorUserMessage      = "9"
	colorAssistantMessage = "6"
	colorSpinner          = "205"
	colorInputLabel       = "10"
	colorStatus           = "8"
)

// Available models
var availableModels = []string{
	"gpt-4o",
	"gpt-4o-mini",
	"gpt-4",
	"gpt-3.5-turbo",
}

// SystemPromptTemplate represents a pre-built system prompt.
type SystemPromptTemplate struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Prompt      string `json:"prompt"`
	BuddyName   string `json:"buddy_name"`
}

// Built-in system prompt templates
var builtinTemplates = []SystemPromptTemplate{
	{
		Name:        "General Assistant",
		Description: "Helpful, friendly AI assistant for general tasks",
		Prompt:      "You are a helpful AI assistant. You're knowledgeable, friendly, and always try to provide accurate and useful information.",
		BuddyName:   "Assistant",
	},
	{
		Name:        "Coding Expert",
		Description: "Senior software engineer specializing in code help",
		Prompt:      "You are a senior software engineer and coding expert. You provide clear, well-documented code examples, explain best practices, help debug issues, and offer architectural guidance. You're familiar with multiple programming languages and frameworks.",
		BuddyName:   "CodeMaster",
	},
	{
		Name:        "Creative Writer",
		Description: "Imaginative writer for stories, poems, and creative content",
		Prompt:      "You are a creative writing assistant with a flair for storytelling, poetry, and imaginative content. You help with character development, plot ideas, dialogue, and various creative writing techniques. You're encouraging and help overcome writer's block.",
		BuddyName:   "Wordsmith",
	},
	{
		Name:        "Business Advisor",
		Description: "Strategic business consultant and advisor",
		Prompt:      "You are a strategic business consultant with expertise in entrepreneurship, market analysis, financial planning, and business operations. You provide practical, actionable advice for startups and established businesses.",
		BuddyName:   "Advisor",
	},
	{
		Name:        "Research Assistant",
		Description: "Academic researcher skilled in analysis and fact-finding",
		Prompt:      "You are a research assistant skilled in academic research, data analysis, and fact-checking. You help gather information, cite sources, analyze data trends, and present findings in a clear, structured manner.",
		BuddyName:   "Scholar",
	},
	{
		Name:        "Math Tutor",
		Description: "Patient mathematics teacher and problem solver",
		Prompt:      "You are a patient and encouraging mathematics tutor. You break down complex problems into manageable steps, explain concepts clearly, and provide practice problems. You're supportive and help build confidence in math skills.",
		BuddyName:   "MathBot",
	},
	{
		Name:        "Therapist",
		Description: "Supportive listener and mental health companion",
		Prompt:      "You are a supportive, empathetic listener who provides a safe space for conversation. You offer gentle guidance, coping strategies, and emotional support. You're not a replacement for professional therapy but aim to be a caring companion.",
		BuddyName:   "Companion",
	},
	{
		Name:        "Chef",
		Description: "Culinary expert for recipes and cooking advice",
		Prompt:      "You are a professional chef and culinary expert. You provide recipes, cooking techniques, ingredient substitutions, meal planning advice, and food safety tips. You're passionate about food and love sharing culinary knowledge.",
		BuddyName:   "Chef",
	},
}

// Model pricing (per 1K tokens) - approximate prices as of 2024
var modelPricing = map[string]struct {
	input  float64
	output float64
}{
	"gpt-4o":        {input: 0.0025, output: 0.01},
	"gpt-4o-mini":   {input: 0.00015, output: 0.0006},
	"gpt-4":         {input: 0.03, output: 0.06},
	"gpt-3.5-turbo": {input: 0.0015, output: 0.002},
}

// appState defines the different states of the application.
type appState int

const (
	stateChatting appState = iota
	stateOnboarding
	stateChatBrowser
	stateTemplateSelector
	stateSearch
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

// Preferences struct to store user preferences.
type Preferences struct {
	BuddyName     string `json:"buddy_name"`
	SystemMessage string `json:"system_message"`
	Model         string `json:"model"`
	Theme         string `json:"theme"`
	AutoSave      bool   `json:"auto_save"`
}

// getPreferencesFilePath returns the absolute path to the preferences file.
func getPreferencesFilePath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home directory: %w", err)
	}
	return filepath.Join(homeDir, preferencesFileName), nil
}

// loadPreferences loads preferences from the preferences file.
func loadPreferences() (*Preferences, error) {
	filePath, err := getPreferencesFilePath()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return &Preferences{}, nil // Return empty preferences if file doesn't exist
		}
		return nil, fmt.Errorf("failed to read preferences file: %w", err)
	}

	var prefs Preferences
	if err := json.Unmarshal(data, &prefs); err != nil {
		return nil, fmt.Errorf("failed to parse preferences file: %w", err)
	}

	return &prefs, nil
}

// savePreferences saves preferences to the preferences file.
func savePreferences(prefs *Preferences) error {
	filePath, err := getPreferencesFilePath()
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(prefs, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal preferences: %w", err)
	}

	if err := os.WriteFile(filePath, data, filePermissions); err != nil {
		return fmt.Errorf("failed to write preferences file: %w", err)
	}

	return nil
}

// TokenUsage tracks token consumption and costs.
type TokenUsage struct {
	TotalTokens       int     `json:"total_tokens"`
	PromptTokens      int     `json:"prompt_tokens"`
	CompletionTokens  int     `json:"completion_tokens"`
	EstimatedCost     float64 `json:"estimated_cost"`
	RequestCount      int     `json:"request_count"`
}

// model represents the application's state.
type model struct {
	client         *openai.Client
	messages       []openai.ChatCompletionMessage
	chatMessages   []ChatMessage // Our enhanced message format
	textInput      textinput.Model
	error          error
	spinner        spinner.Model
	isThinking     bool
	preferences    *Preferences
	buddyName      string
	appState       appState
	onboardingStep int
	viewport       viewport.Model
	currentModel   string
	statusMessage  string
	tokenUsage     TokenUsage
	
	// Chat browser fields
	savedChats     []string // List of saved chat files
	selectedChat   int      // Currently selected chat in browser
	
	// Template selector fields
	selectedTemplate int // Currently selected template
	
	// Search fields
	searchQuery      string       // Current search query
	searchResults    []ChatMessage // Found messages
	selectedResult   int          // Currently selected search result
	
	// Theme
	currentTheme     Theme        // Current color theme
}

// formatChatMessage formats a single chat message with proper styling.
func (m model) formatChatMessage(msg openai.ChatCompletionMessage, width int) string {
	var label, content string
	
	if msg.Role == openai.ChatMessageRoleUser {
		label = lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.UserMessage)).Bold(true).Render("You: ")
		content = msg.Content
	} else if msg.Role == openai.ChatMessageRoleAssistant {
		label = lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.AssistantMessage)).Bold(true).Render(m.buddyName+": ")
		content = highlightCode(msg.Content, m.isDarkTheme())
	}
	
	// Use lipgloss to handle proper wrapping
	messageStyle := lipgloss.NewStyle().
		Width(width).
		PaddingLeft(0).
		PaddingRight(2)
	
	return messageStyle.Render(label + content) + "\n\n"
}

// formatChatMessageWithTimestamp formats a chat message with timestamp.
func (m model) formatChatMessageWithTimestamp(msg ChatMessage, width int) string {
	var label, content string
	timeStr := msg.Timestamp.Format("15:04")
	
	if msg.Role == openai.ChatMessageRoleUser {
		label = lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.UserMessage)).Bold(true).Render("You: ")
		content = msg.Content
	} else if msg.Role == openai.ChatMessageRoleAssistant {
		label = lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.AssistantMessage)).Bold(true).Render(m.buddyName+": ")
		content = highlightCode(msg.Content, m.isDarkTheme())
	}
	
	// Add timestamp
	timestampStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.Status)).Faint(true)
	timestamp := timestampStyle.Render(fmt.Sprintf("[%s]", timeStr))
	
	// Use lipgloss to handle proper wrapping
	messageStyle := lipgloss.NewStyle().
		Width(width).
		PaddingLeft(0).
		PaddingRight(2)
	
	return messageStyle.Render(label + content + " " + timestamp) + "\n\n"
}

// buildChatContent generates the formatted chat history string for the viewport.
func (m model) buildChatContent() string {
	width, _, _ := term.GetSize(os.Stdout.Fd())
	var chatContent string
	
	// Use chatMessages if we have them (with timestamps), otherwise fall back to OpenAI messages
	if len(m.chatMessages) > 0 {
		for _, msg := range m.chatMessages {
			if msg.Role != openai.ChatMessageRoleSystem {
				chatContent += m.formatChatMessageWithTimestamp(msg, width-4) // Account for padding
			}
		}
	} else {
		for _, msg := range m.messages {
			if msg.Role != openai.ChatMessageRoleSystem {
				chatContent += m.formatChatMessage(msg, width-4) // Account for padding
			}
		}
	}
	
	// Add some spacing at the end to separate from input
	return chatContent + "\n"
}

// updateViewportContent updates the viewport content and scrolls to bottom.
func (m *model) updateViewportContent() {
	m.viewport.SetContent(m.buildChatContent())
	m.viewport.GotoBottom()
}

// createTextInput creates and configures the text input component.
func createTextInput() textinput.Model {
	ti := textinput.New()
	ti.Placeholder = "Type your message..."
	ti.Focus()
	ti.CharLimit = textInputCharLimit
	ti.Width = textInputWidth
	ti.Prompt = textInputPrompt
	return ti
}

// createSpinner creates and configures the spinner component.
func createSpinner(theme Theme) spinner.Model {
	s := spinner.New()
	s.Spinner = spinner.Dot
	s.Style = lipgloss.NewStyle().Foreground(lipgloss.Color(theme.Spinner))
	return s
}

// createViewport creates and configures the viewport component.
func createViewport() viewport.Model {
	termWidth, termHeight, _ := term.GetSize(os.Stdout.Fd())
	vp := viewport.New(termWidth, termHeight-viewportHeightOffset)
	vp.SetContent("")
	return vp
}

// determineInitialState determines the initial application state based on preferences.
func determineInitialState(prefs *Preferences) (appState, int) {
	if prefs == nil || prefs.BuddyName == "" {
		return stateOnboarding, 1
	}
	if prefs.SystemMessage == "" {
		return stateOnboarding, 2
	}
	return stateChatting, 0
}

// getModelForRequest returns the OpenAI model constant for the given model name.
func getModelForRequest(modelName string) string {
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

// clearConversation clears all messages except the system message.
func (m *model) clearConversation() {
	systemMsg := m.messages[0] // Keep the system message
	m.messages = []openai.ChatCompletionMessage{systemMsg}
	m.chatMessages = []ChatMessage{} // Clear chat history
	m.updateViewportContent()
	m.statusMessage = "Conversation cleared"
}

// copyToClipboard copies text to clipboard using platform-specific commands.
func copyToClipboard(text string) error {
	var cmd *exec.Cmd
	
	switch runtime.GOOS {
	case "darwin": // macOS
		cmd = exec.Command("pbcopy")
	case "linux":
		// Try xclip first, then xsel
		if _, err := exec.LookPath("xclip"); err == nil {
			cmd = exec.Command("xclip", "-selection", "clipboard")
		} else if _, err := exec.LookPath("xsel"); err == nil {
			cmd = exec.Command("xsel", "--clipboard", "--input")
		} else {
			return fmt.Errorf("no clipboard utility found (install xclip or xsel)")
		}
	case "windows":
		cmd = exec.Command("clip")
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}
	
	cmd.Stdin = strings.NewReader(text)
	return cmd.Run()
}

// getLastAssistantMessage returns the last message from the assistant.
func (m *model) getLastAssistantMessage() string {
	for i := len(m.chatMessages) - 1; i >= 0; i-- {
		if m.chatMessages[i].Role == openai.ChatMessageRoleAssistant {
			return m.chatMessages[i].Content
		}
	}
	return ""
}

// listSavedChats returns a list of saved chat files.
func listSavedChats() ([]string, error) {
	historyDir, err := getChatHistoryDir()
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

// loadChatHistory loads a specific chat history file.
func (m *model) loadChatHistory(filename string) error {
	historyDir, err := getChatHistoryDir()
	if err != nil {
		return err
	}
	
	filePath := filepath.Join(historyDir, filename)
	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read chat file: %w", err)
	}
	
	var history ChatHistory
	if err := json.Unmarshal(data, &history); err != nil {
		return fmt.Errorf("failed to parse chat file: %w", err)
	}
	
	// Load the chat into current session
	m.chatMessages = history.Messages
	m.buddyName = history.BuddyName
	m.currentModel = history.Model
	
	// Convert to OpenAI messages format
	m.messages = []openai.ChatCompletionMessage{
		{Role: openai.ChatMessageRoleSystem, Content: createSystemMessage(m.preferences, m.buddyName)},
	}
	
	for _, msg := range history.Messages {
		if msg.Role != openai.ChatMessageRoleSystem {
			m.messages = append(m.messages, openai.ChatCompletionMessage{
				Role:    msg.Role,
				Content: msg.Content,
			})
		}
	}
	
	m.updateViewportContent()
	return nil
}

// refreshChatList refreshes the list of saved chats.
func (m *model) refreshChatList() {
	chats, err := listSavedChats()
	if err != nil {
		m.statusMessage = fmt.Sprintf("Failed to load chats: %v", err)
		return
	}
	
	m.savedChats = chats
	if len(m.savedChats) > 0 && m.selectedChat >= len(m.savedChats) {
		m.selectedChat = len(m.savedChats) - 1
	}
}

// applyTemplate applies a system prompt template to the current session.
func (m *model) applyTemplate(template SystemPromptTemplate) {
	// Update buddy name and system prompt
	m.buddyName = template.BuddyName
	m.preferences.BuddyName = template.BuddyName
	m.preferences.SystemMessage = template.Prompt
	
	// Save preferences
	savePreferences(m.preferences)
	
	// Clear current conversation and apply new system message
	systemMessage := fmt.Sprintf("%s named %s.", template.Prompt, template.BuddyName)
	m.messages = []openai.ChatCompletionMessage{
		{Role: openai.ChatMessageRoleSystem, Content: systemMessage},
	}
	m.chatMessages = []ChatMessage{}
	
	m.updateViewportContent()
	m.statusMessage = fmt.Sprintf("Applied template: %s", template.Name)
}

// searchChats searches through all saved chats for the given query.
func searchChats(query string) ([]ChatMessage, error) {
	if query == "" {
		return []ChatMessage{}, nil
	}
	
	historyDir, err := getChatHistoryDir()
	if err != nil {
		return nil, err
	}
	
	files, err := os.ReadDir(historyDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read chat history directory: %w", err)
	}
	
	var results []ChatMessage
	queryLower := strings.ToLower(query)
	
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".json") {
			filePath := filepath.Join(historyDir, file.Name())
			data, err := os.ReadFile(filePath)
			if err != nil {
				continue // Skip files we can't read
			}
			
			var history ChatHistory
			if err := json.Unmarshal(data, &history); err != nil {
				continue // Skip files we can't parse
			}
			
			// Search through messages in this chat
			for _, msg := range history.Messages {
				if msg.Role != openai.ChatMessageRoleSystem {
					if strings.Contains(strings.ToLower(msg.Content), queryLower) {
						results = append(results, msg)
					}
				}
			}
		}
	}
	
	return results, nil
}

// performSearch performs a search and updates the search results.
func (m *model) performSearch() {
	results, err := searchChats(m.searchQuery)
	if err != nil {
		m.statusMessage = fmt.Sprintf("Search failed: %v", err)
		return
	}
	
	m.searchResults = results
	m.selectedResult = 0
	if len(results) == 0 {
		m.statusMessage = "No results found"
	} else {
		m.statusMessage = fmt.Sprintf("Found %d result(s)", len(results))
	}
}

// cycleTheme cycles to the next available theme.
func (m *model) cycleTheme() {
	themeNames := []string{"default", "dark", "ocean", "sunset", "forest"}
	currentIndex := 0
	
	// Find current theme index
	for i, name := range themeNames {
		if themes[name].Name == m.currentTheme.Name {
			currentIndex = i
			break
		}
	}
	
	// Move to next theme
	nextIndex := (currentIndex + 1) % len(themeNames)
	m.currentTheme = themes[themeNames[nextIndex]]
	
	// Save theme preference
	if m.preferences != nil {
		m.preferences.Theme = themeNames[nextIndex]
		savePreferences(m.preferences)
	}
	
	m.statusMessage = fmt.Sprintf("Theme changed to: %s", m.currentTheme.Name)
}

// highlightCode applies syntax highlighting to code blocks in the content.
func highlightCode(content string, isDarkTheme bool) string {
	// First, handle inline code with single backticks
	inlineCodeRegex := regexp.MustCompile("`([^`]+)`")
	content = inlineCodeRegex.ReplaceAllStringFunc(content, func(match string) string {
		code := strings.Trim(match, "`")
		codeStyle := lipgloss.NewStyle().
			Background(lipgloss.Color("236")).
			Foreground(lipgloss.Color("15")).
			Padding(0, 1)
		return codeStyle.Render(code)
	})
	
	// Then handle code blocks: ```language\ncode\n```
	codeBlockRegex := regexp.MustCompile("```([a-zA-Z0-9_+-]*)\n([\\s\\S]*?)\n```")
	
	// Choose appropriate style based on theme
	styleName := "github"
	if isDarkTheme {
		styleName = "github-dark"
	}
	
	style := styles.Get(styleName)
	if style == nil {
		style = styles.Fallback
	}
	
	formatter := formatters.Get("terminal256")
	if formatter == nil {
		formatter = formatters.Fallback
	}
	
	return codeBlockRegex.ReplaceAllStringFunc(content, func(match string) string {
		// Extract language and code
		parts := codeBlockRegex.FindStringSubmatch(match)
		if len(parts) != 3 {
			return match // Return original if regex fails
		}
		
		language := parts[1]
		code := parts[2]
		
		// Get lexer for the language
		var lexer chroma.Lexer
		if language != "" {
			lexer = lexers.Get(language)
		}
		if lexer == nil {
			lexer = lexers.Analyse(code)
		}
		if lexer == nil {
			lexer = lexers.Fallback
		}
		
		// Apply syntax highlighting
		tokens, err := lexer.Tokenise(nil, code)
		if err != nil {
			return match // Return original if highlighting fails
		}
		
		var buf strings.Builder
		err = formatter.Format(&buf, style, tokens)
		if err != nil {
			return match // Return original if formatting fails
		}
		
		// Create a styled code block
		highlightedCode := buf.String()
		
		// Add language label and border
		languageLabel := language
		if languageLabel == "" {
			languageLabel = "code"
		}
		
		codeStyle := lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("240")).
			Padding(0, 1).
			Margin(1, 0)
		
		labelStyle := lipgloss.NewStyle().
			Foreground(lipgloss.Color("12")).
			Bold(true)
		
		return codeStyle.Render(
			labelStyle.Render(languageLabel) + "\n" + 
			strings.TrimSpace(highlightedCode),
		)
	})
}

// isDarkTheme returns true if the current theme is considered dark.
func (m model) isDarkTheme() bool {
	darkThemes := map[string]bool{
		"dark":   true,
		"ocean":  true,
		"forest": true,
	}
	
	// Extract theme name from current theme
	themeName := "default"
	for name, theme := range themes {
		if theme.Name == m.currentTheme.Name {
			themeName = name
			break
		}
	}
	
	return darkThemes[themeName]
}

// calculateTokenCost calculates the estimated cost for the given token usage.
func calculateTokenCost(model string, promptTokens, completionTokens int) float64 {
	pricing, exists := modelPricing[model]
	if !exists {
		return 0.0
	}
	
	promptCost := float64(promptTokens) / 1000.0 * pricing.input
	completionCost := float64(completionTokens) / 1000.0 * pricing.output
	
	return promptCost + completionCost
}

// updateTokenUsage updates the token usage statistics.
func (m *model) updateTokenUsage(promptTokens, completionTokens int) {
	cost := calculateTokenCost(m.currentModel, promptTokens, completionTokens)
	
	m.tokenUsage.PromptTokens += promptTokens
	m.tokenUsage.CompletionTokens += completionTokens
	m.tokenUsage.TotalTokens += promptTokens + completionTokens
	m.tokenUsage.EstimatedCost += cost
	m.tokenUsage.RequestCount++
}

// clearStatusAfterDelay returns a command that will clear the status message after a delay.
func clearStatusAfterDelay() tea.Cmd {
	return tea.Tick(3*time.Second, func(t time.Time) tea.Msg {
		return clearStatusMsg{}
	})
}

// getChatHistoryDir returns the directory path for chat history files.
func getChatHistoryDir() (string, error) {
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

// saveCurrentChat saves the current conversation to a file.
func (m *model) saveCurrentChat() error {
	if len(m.chatMessages) == 0 {
		return fmt.Errorf("no messages to save")
	}
	
	historyDir, err := getChatHistoryDir()
	if err != nil {
		return err
	}
	
	now := time.Now()
	filename := fmt.Sprintf("chat_%s.json", now.Format("2006-01-02_15-04-05"))
	filePath := filepath.Join(historyDir, filename)
	
	history := ChatHistory{
		Messages:  m.chatMessages,
		BuddyName: m.buddyName,
		Model:     m.currentModel,
		CreatedAt: now,
		UpdatedAt: now,
	}
	
	data, err := json.MarshalIndent(history, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal chat history: %w", err)
	}
	
	if err := os.WriteFile(filePath, data, filePermissions); err != nil {
		return fmt.Errorf("failed to write chat history file: %w", err)
	}
	
	return nil
}

// addChatMessage adds a message to both the OpenAI messages and our chat history.
func (m *model) addChatMessage(role, content string) {
	// Add to OpenAI messages
	m.messages = append(m.messages, openai.ChatCompletionMessage{
		Role:    role,
		Content: content,
	})
	
	// Add to our chat history with timestamp
	m.chatMessages = append(m.chatMessages, ChatMessage{
		Role:      role,
		Content:   content,
		Timestamp: time.Now(),
		Model:     m.currentModel,
	})
}

// exportToMarkdown exports the current chat to a markdown file.
func (m *model) exportToMarkdown() error {
	if len(m.chatMessages) == 0 {
		return fmt.Errorf("no messages to export")
	}
	
	historyDir, err := getChatHistoryDir()
	if err != nil {
		return err
	}
	
	now := time.Now()
	filename := fmt.Sprintf("chat_%s.md", now.Format("2006-01-02_15-04-05"))
	filePath := filepath.Join(historyDir, filename)
	
	var markdown strings.Builder
	markdown.WriteString(fmt.Sprintf("# Chat with %s\n\n", m.buddyName))
	markdown.WriteString(fmt.Sprintf("**Date:** %s\n", now.Format("January 2, 2006 15:04:05")))
	markdown.WriteString(fmt.Sprintf("**Model:** %s\n\n", m.currentModel))
	markdown.WriteString("---\n\n")
	
	for _, msg := range m.chatMessages {
		if msg.Role == openai.ChatMessageRoleUser {
			markdown.WriteString(fmt.Sprintf("**You** (%s):\n", msg.Timestamp.Format("15:04")))
		} else {
			markdown.WriteString(fmt.Sprintf("**%s** (%s):\n", m.buddyName, msg.Timestamp.Format("15:04")))
		}
		markdown.WriteString(fmt.Sprintf("%s\n\n", msg.Content))
	}
	
	return os.WriteFile(filePath, []byte(markdown.String()), filePermissions)
}

// createSystemMessage creates the system message based on preferences.
func createSystemMessage(prefs *Preferences, buddyName string) string {
	systemMessage := defaultSystemMessage
	if prefs != nil && prefs.SystemMessage != "" {
		systemMessage = prefs.SystemMessage
	}
	return fmt.Sprintf("%s named %s.", systemMessage, buddyName)
}

// initialModel returns an initialized model.
func initialModel() model {
	key := os.Getenv("OPENAI_API_KEY")
	if key == "" {
		log.Fatal("OPENAI_API_KEY environment variable not set")
	}

	client := openai.NewClient(key)

	prefs, err := loadPreferences()
	if err != nil {
		log.Printf("Error loading preferences: %v", err)
		prefs = &Preferences{} // Use empty preferences if error occurs
	}

	buddyName := defaultBuddyName
	if prefs.BuddyName != "" {
		buddyName = prefs.BuddyName
	}

	currentModel := defaultModel
	if prefs.Model != "" {
		currentModel = prefs.Model
	}

	// Set theme
	currentTheme := themes["default"]
	if prefs.Theme != "" {
		if theme, exists := themes[prefs.Theme]; exists {
			currentTheme = theme
		}
	}

	initialState, onboardingStep := determineInitialState(prefs)
	systemMessage := createSystemMessage(prefs, buddyName)

	return model{
		client: client,
		messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: systemMessage},
		},
		chatMessages:   []ChatMessage{}, // Initialize empty chat history
		textInput:      createTextInput(),
		spinner:        createSpinner(currentTheme),
		isThinking:     false,
		preferences:    prefs,
		buddyName:      buddyName,
		appState:       initialState,
		onboardingStep: onboardingStep,
		viewport:       createViewport(),
		currentModel:   currentModel,
		statusMessage:    fmt.Sprintf("Using %s", currentModel),
		savedChats:       []string{},
		selectedChat:     0,
		selectedTemplate: 0,
		searchQuery:      "",
		searchResults:    []ChatMessage{},
		selectedResult:   0,
		currentTheme:     currentTheme,
	}
}

// Init is called once to initialize the program.
func (m model) Init() tea.Cmd {
	return textinput.Blink
}

// handleOnboardingInput handles user input during onboarding.
func (m model) handleOnboardingInput(input string) (model, error) {
	if m.onboardingStep == 1 {
		m.preferences.BuddyName = input
		m.buddyName = input
		m.appState = stateChatting
		// Reset system message with new buddy name
		m.messages[0].Content = fmt.Sprintf("You are a helpful AI assistant named %s.", m.buddyName)
	} else if m.onboardingStep == 2 {
		m.preferences.SystemMessage = input
		// Update system message with new persona
		m.messages[0].Content = fmt.Sprintf("%s named %s.", m.preferences.SystemMessage, m.buddyName)
		m.appState = stateChatting
	}

	if err := savePreferences(m.preferences); err != nil {
		return m, fmt.Errorf("failed to save preferences: %w", err)
	}

	return m, nil
}

// Update handles messages and updates the model.
func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd
	var cmds []tea.Cmd

	switch m.appState {
	case stateOnboarding:
		m.textInput, cmd = m.textInput.Update(msg)
		cmds = append(cmds, cmd)

		if keyMsg, ok := msg.(tea.KeyMsg); ok {
			switch keyMsg.String() {
			case "ctrl+c", "q":
				return m, tea.Quit
			case "enter":
				input := m.textInput.Value()
				if input != "" {
					var err error
					m, err = m.handleOnboardingInput(input)
					if err != nil {
						m.error = err
					}
					m.textInput.Reset()
				}
			}
		}

	case stateChatBrowser:
		switch msg := msg.(type) {
		case tea.KeyMsg:
			switch msg.String() {
			case "ctrl+c", "q", "esc":
				m.appState = stateChatting
				m.statusMessage = "Back to chat"
				cmds = append(cmds, clearStatusAfterDelay())
			case "up", "k":
				if m.selectedChat > 0 {
					m.selectedChat--
				}
			case "down", "j":
				if m.selectedChat < len(m.savedChats)-1 {
					m.selectedChat++
				}
			case "enter":
				if len(m.savedChats) > 0 && m.selectedChat < len(m.savedChats) {
					if err := m.loadChatHistory(m.savedChats[m.selectedChat]); err != nil {
						m.statusMessage = fmt.Sprintf("Failed to load chat: %v", err)
					} else {
						m.appState = stateChatting
						m.statusMessage = fmt.Sprintf("Loaded chat: %s", m.savedChats[m.selectedChat])
					}
					cmds = append(cmds, clearStatusAfterDelay())
				}
			case "r":
				// Refresh chat list
				m.refreshChatList()
				m.statusMessage = "Chat list refreshed"
				cmds = append(cmds, clearStatusAfterDelay())
			}
		}

	case stateTemplateSelector:
		switch msg := msg.(type) {
		case tea.KeyMsg:
			switch msg.String() {
			case "ctrl+c", "q", "esc":
				m.appState = stateChatting
				m.statusMessage = "Back to chat"
				cmds = append(cmds, clearStatusAfterDelay())
			case "up", "k":
				if m.selectedTemplate > 0 {
					m.selectedTemplate--
				}
			case "down", "j":
				if m.selectedTemplate < len(builtinTemplates)-1 {
					m.selectedTemplate++
				}
			case "enter":
				if m.selectedTemplate < len(builtinTemplates) {
					m.applyTemplate(builtinTemplates[m.selectedTemplate])
					m.appState = stateChatting
					cmds = append(cmds, clearStatusAfterDelay())
				}
			}
		}

	case stateSearch:
		switch msg := msg.(type) {
		case tea.KeyMsg:
			switch msg.String() {
			case "ctrl+c", "q", "esc":
				m.appState = stateChatting
				m.statusMessage = "Back to chat"
				cmds = append(cmds, clearStatusAfterDelay())
			case "enter":
				if m.searchQuery != "" {
					m.performSearch()
				}
			case "up", "k":
				if len(m.searchResults) > 0 && m.selectedResult > 0 {
					m.selectedResult--
				}
			case "down", "j":
				if len(m.searchResults) > 0 && m.selectedResult < len(m.searchResults)-1 {
					m.selectedResult++
				}
			case "backspace":
				if len(m.searchQuery) > 0 {
					m.searchQuery = m.searchQuery[:len(m.searchQuery)-1]
				}
			default:
				// Add character to search query
				if len(msg.String()) == 1 {
					m.searchQuery += msg.String()
				}
			}
		}

	case stateChatting:
		switch msg := msg.(type) {
		case tea.KeyMsg:
			switch msg.String() {
			case "ctrl+c", "q":
				return m, tea.Quit
			case "ctrl+l":
				m.clearConversation()
				m.statusMessage = "Conversation cleared"
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+m":
				// Cycle through available models
				currentIndex := 0
				for i, model := range availableModels {
					if model == m.currentModel {
						currentIndex = i
						break
					}
				}
				nextIndex := (currentIndex + 1) % len(availableModels)
				m.currentModel = availableModels[nextIndex]
				m.preferences.Model = m.currentModel
				savePreferences(m.preferences)
				m.statusMessage = fmt.Sprintf("Switched to %s", m.currentModel)
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+s":
				// Save chat history
				if err := m.saveCurrentChat(); err != nil {
					m.statusMessage = fmt.Sprintf("Failed to save: %v", err)
				} else {
					m.statusMessage = "Chat history saved"
				}
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+e":
				// Export to markdown
				if err := m.exportToMarkdown(); err != nil {
					m.statusMessage = fmt.Sprintf("Failed to export: %v", err)
				} else {
					m.statusMessage = "Chat exported to markdown"
				}
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+t":
				// Show token usage stats
				m.statusMessage = fmt.Sprintf("Tokens: %d | Requests: %d | Cost: $%.4f", 
					m.tokenUsage.TotalTokens, m.tokenUsage.RequestCount, m.tokenUsage.EstimatedCost)
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+y":
				// Copy last assistant message to clipboard
				lastMsg := m.getLastAssistantMessage()
				if lastMsg != "" {
					if err := copyToClipboard(lastMsg); err != nil {
						m.statusMessage = fmt.Sprintf("Failed to copy: %v", err)
					} else {
						m.statusMessage = "Last response copied to clipboard"
					}
				} else {
					m.statusMessage = "No assistant message to copy"
				}
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+b":
				// Open chat browser
				m.appState = stateChatBrowser
				m.refreshChatList()
				m.statusMessage = "Chat browser - Use arrows to navigate, Enter to load, Esc to return"
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+a":
				// Toggle auto-save
				if m.preferences != nil {
					m.preferences.AutoSave = !m.preferences.AutoSave
					savePreferences(m.preferences)
					status := "disabled"
					if m.preferences.AutoSave {
						status = "enabled"
					}
					m.statusMessage = fmt.Sprintf("Auto-save %s", status)
					cmds = append(cmds, clearStatusAfterDelay())
				}
			case "ctrl+p":
				// Open template selector
				m.appState = stateTemplateSelector
				m.selectedTemplate = 0
				m.statusMessage = "Template selector - Use arrows to navigate, Enter to apply, Esc to return"
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+f":
				// Open search interface
				m.appState = stateSearch
				m.searchQuery = ""
				m.searchResults = []ChatMessage{}
				m.selectedResult = 0
				m.statusMessage = "Search chat history - Type to search, Enter to perform search, Esc to return"
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+d":
				// Cycle theme
				m.cycleTheme()
				cmds = append(cmds, clearStatusAfterDelay())
			case "enter":
				value := m.textInput.Value()
				if value != "" {
					m.addChatMessage(openai.ChatMessageRoleUser, value)
					m.isThinking = true
					cmds = append(cmds, sendToOpenAI(m, value), m.spinner.Tick)
					m.textInput.Reset()
				}
			default:
				m.textInput, cmd = m.textInput.Update(msg)
				cmds = append(cmds, cmd)
			}
		case errMsg:
			m.error = msg
			m.isThinking = false
		case openaiResponseMsg:
			// Add the assistant's response as a new message
			m.addChatMessage(openai.ChatMessageRoleAssistant, string(msg))
			m.isThinking = false
			m.updateViewportContent()
		case tokenizedResponseMsg:
			// Add the assistant's response with token tracking
			m.addChatMessage(openai.ChatMessageRoleAssistant, msg.Content)
			m.updateTokenUsage(msg.PromptTokens, msg.CompletionTokens)
			m.isThinking = false
			m.updateViewportContent()
			
			// Auto-save if enabled and we have multiple messages
			if m.preferences != nil && m.preferences.AutoSave && len(m.chatMessages) > 1 {
				if err := m.saveCurrentChat(); err == nil {
					// Don't show status message for auto-save to avoid noise
				}
			}
		case streamResponseMsg:
			if len(m.messages) > 0 && m.messages[len(m.messages)-1].Role == openai.ChatMessageRoleAssistant {
				m.messages[len(m.messages)-1].Content += string(msg)
			} else {
				m.messages = append(m.messages, openai.ChatCompletionMessage{
					Role:    openai.ChatMessageRoleAssistant,
					Content: string(msg),
				})
			}
			cmds = append(cmds, m.spinner.Tick)
			m.updateViewportContent()
		case spinner.TickMsg:
			m.spinner, cmd = m.spinner.Update(msg)
			cmds = append(cmds, cmd)
		case tea.WindowSizeMsg:
			m.viewport.Width = msg.Width
			m.viewport.Height = msg.Height - viewportHeightOffset
			m.updateViewportContent()
			m.textInput.Width = msg.Width - textInputWidthOffset
		case clearStatusMsg:
			m.statusMessage = ""
		default:
			m.textInput, cmd = m.textInput.Update(msg)
			cmds = append(cmds, cmd)
		}
	}

	return m, tea.Batch(cmds...)
}

// getOnboardingPrompt returns the appropriate prompt for the current onboarding step.
func (m model) getOnboardingPrompt() string {
	switch m.onboardingStep {
	case 1:
		return "Hello! What would you like to name your AI buddy?\n\n"
	case 2:
		return "Great! Now, how would you describe your AI buddy's personality or purpose?\n(e.g., 'a helpful coding assistant', 'a sarcastic chatbot')\n\n"
	default:
		return ""
	}
}

// View renders the UI.
func (m model) View() string {
	switch m.appState {
	case stateOnboarding:
		return fmt.Sprintf("%s%s", m.getOnboardingPrompt(), m.textInput.View())

	case stateChatBrowser:
		s := lipgloss.NewStyle().Bold(true).Render("📁 Chat Browser") + "\n\n"
		
		if len(m.savedChats) == 0 {
			s += "No saved chats found.\n\n"
		} else {
			for i, chat := range m.savedChats {
				style := lipgloss.NewStyle()
				if i == m.selectedChat {
					style = style.Background(lipgloss.Color(m.currentTheme.Background)).Foreground(lipgloss.Color(m.currentTheme.Highlight))
				}
				
				// Format filename for display
				displayName := strings.TrimSuffix(chat, ".json")
				displayName = strings.Replace(displayName, "chat_", "", 1)
				displayName = strings.Replace(displayName, "_", " ", -1)
				
				s += style.Render(fmt.Sprintf("  %s", displayName)) + "\n"
			}
		}
		
		s += "\n"
		helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorStatus)).Italic(true)
		s += helpStyle.Render("↑↓: Navigate | Enter: Load | R: Refresh | Esc: Back") + "\n"
		
		if m.statusMessage != "" {
			statusStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorStatus))
			s += "\n" + statusStyle.Render(fmt.Sprintf("Status: %s", m.statusMessage))
		}
		
		return s

	case stateTemplateSelector:
		s := lipgloss.NewStyle().Bold(true).Render("🎭 System Prompt Templates") + "\n\n"
		
		for i, template := range builtinTemplates {
			style := lipgloss.NewStyle()
			if i == m.selectedTemplate {
				style = style.Background(lipgloss.Color(m.currentTheme.Background)).Foreground(lipgloss.Color(m.currentTheme.Highlight))
			}
			
			name := lipgloss.NewStyle().Bold(true).Render(template.Name)
			description := lipgloss.NewStyle().Faint(true).Render(template.Description)
			
			s += style.Render(fmt.Sprintf("  %s", name)) + "\n"
			s += style.Render(fmt.Sprintf("    %s", description)) + "\n\n"
		}
		
		helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorStatus)).Italic(true)
		s += helpStyle.Render("↑↓: Navigate | Enter: Apply Template | Esc: Back") + "\n"
		
		if m.statusMessage != "" {
			statusStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorStatus))
			s += "\n" + statusStyle.Render(fmt.Sprintf("Status: %s", m.statusMessage))
		}
		
		return s

	case stateSearch:
		s := lipgloss.NewStyle().Bold(true).Render("🔍 Search Chat History") + "\n\n"
		
		// Search input
		s += fmt.Sprintf("Search query: %s_\n\n", m.searchQuery)
		
		if len(m.searchResults) == 0 && m.searchQuery != "" {
			s += "No results found.\n\n"
		} else if len(m.searchResults) > 0 {
			s += fmt.Sprintf("Found %d result(s):\n\n", len(m.searchResults))
			
			for i, result := range m.searchResults {
				style := lipgloss.NewStyle()
				if i == m.selectedResult {
					style = style.Background(lipgloss.Color(m.currentTheme.Background)).Foreground(lipgloss.Color(m.currentTheme.Highlight))
				}
				
				// Format the message preview
				preview := result.Content
				if len(preview) > 80 {
					preview = preview[:77] + "..."
				}
				
				roleStyle := lipgloss.NewStyle().Bold(true)
				var role string
				if result.Role == openai.ChatMessageRoleUser {
					role = "You"
				} else {
					role = "AI"
				}
				
				timeStr := result.Timestamp.Format("2006-01-02 15:04")
				
				s += style.Render(fmt.Sprintf("  [%s] %s: %s", timeStr, roleStyle.Render(role), preview)) + "\n"
			}
			s += "\n"
		}
		
		helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorStatus)).Italic(true)
		s += helpStyle.Render("Type to search | Enter: Search | ↑↓: Navigate results | Esc: Back") + "\n"
		
		if m.statusMessage != "" {
			statusStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(colorStatus))
			s += "\n" + statusStyle.Render(fmt.Sprintf("Status: %s", m.statusMessage))
		}
		
		return s

	case stateChatting:
		m.updateViewportContent()
		s := m.viewport.View() + "\n"

		if m.isThinking {
			s += m.spinner.View() + " Thinking...\n"
		}

		// Add status line
		statusStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.Status))
		if m.statusMessage != "" {
			s += statusStyle.Render(fmt.Sprintf("Status: %s", m.statusMessage)) + "\n"
		}

		// Add keyboard shortcuts help (split into two lines for readability)
		helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.Status)).Italic(true)
		s += helpStyle.Render("Ctrl+L: Clear | Ctrl+M: Model | Ctrl+S: Save | Ctrl+E: Export | Ctrl+T: Tokens | Ctrl+Y: Copy") + "\n"
		s += helpStyle.Render("Ctrl+B: Browse | Ctrl+P: Templates | Ctrl+F: Search | Ctrl+D: Theme | Ctrl+A: Auto-save | Ctrl+C: Quit") + "\n"

		s += "\n" + lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.InputLabel)).Render("Your message: ") + m.textInput.View()

		if m.error != nil {
			s += fmt.Sprintf("\nError: %v", m.error)
		}

		return s
	}
	return ""
}

// Message types for OpenAI communication
type (
	openaiResponseMsg     string
	errMsg                error
	streamResponseMsg     string
	clearStatusMsg        struct{}
	tokenizedResponseMsg  TokenizedResponse
)

// TokenizedResponse contains the response and token usage information.
type TokenizedResponse struct {
	Content    string
	PromptTokens int
	CompletionTokens int
}

// sendToOpenAI sends a prompt to OpenAI and tracks token usage.
func sendToOpenAI(m model, prompt string) tea.Cmd {
	return func() tea.Msg {
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		response, err := m.client.CreateChatCompletion(
			ctx,
			openai.ChatCompletionRequest{
				Model:    getModelForRequest(m.currentModel),
				Messages: m.messages,
			},
		)
		if err != nil {
			return errMsg(fmt.Errorf("failed to create chat completion: %w", err))
		}

		if len(response.Choices) == 0 {
			return errMsg(fmt.Errorf("no response choices received"))
		}

		content := response.Choices[0].Message.Content
		
		// Create tokenized response with usage data
		tokenResponse := TokenizedResponse{
			Content:          content,
			PromptTokens:     response.Usage.PromptTokens,
			CompletionTokens: response.Usage.CompletionTokens,
		}
		
		return tokenizedResponseMsg(tokenResponse)
	}
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}

	p := tea.NewProgram(initialModel())
	if _, err := p.Run(); err != nil {
		fmt.Printf("Alas, there's been an error: %v\n", err)
		os.Exit(1)
	}
}
