package tui

import (
	"fmt"
	"os"
	"os/exec"
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

	"lil_guy/internal/ai"
	"lil_guy/internal/chat"
	"lil_guy/internal/config"
)

// Constants for UI layout and configuration
const (
	defaultBuddyName     = "AI"
	defaultSystemMessage = "You are a helpful AI assistant."
	defaultModel         = "gpt-4o"
	textInputCharLimit   = 2000 // Increased for longer messages
	textInputWidth       = 80
	textInputPrompt      = "> "
	viewportHeightOffset = 6 // Height offset for input and status lines
	textInputWidthOffset = 4 // Width offset for prompt and padding
	maxOnboardingSteps   = 2
)

// Theme represents a color scheme
type Theme struct {
	Name             string
	UserMessage      string
	AssistantMessage string
	Spinner          string
	InputLabel       string
	Status           string
	Background       string
	Highlight        string
}

// Available themes
var themes = map[string]Theme{
	"default": {
		Name:             "Default",
		UserMessage:      "9",
		AssistantMessage: "6",
		Spinner:          "205",
		InputLabel:       "10",
		Status:           "8",
		Background:       "240",
		Highlight:        "15",
	},
	"dark": {
		Name:             "Dark",
		UserMessage:      "11",
		AssistantMessage: "14",
		Spinner:          "13",
		InputLabel:       "12",
		Status:           "7",
		Background:       "235",
		Highlight:        "15",
	},
	"ocean": {
		Name:             "Ocean",
		UserMessage:      "4",
		AssistantMessage: "6",
		Spinner:          "12",
		InputLabel:       "14",
		Status:           "8",
		Background:       "17",
		Highlight:        "15",
	},
	"sunset": {
		Name:             "Sunset",
		UserMessage:      "9",
		AssistantMessage: "11",
		Spinner:          "13",
		InputLabel:       "10",
		Status:           "8",
		Background:       "52",
		Highlight:        "15",
	},
	"forest": {
		Name:             "Forest",
		UserMessage:      "2",
		AssistantMessage: "10",
		Spinner:          "3",
		InputLabel:       "14",
		Status:           "8",
		Background:       "22",
		Highlight:        "15",
	},
}

// getAvailableModels returns models based on what's configured
func getAvailableModels(client *ai.UnifiedClient) []string {
	if client != nil {
		return client.GetAvailableModels()
	}
	// Fallback list
	return []string{
		"gpt-4o",
		"gpt-4o-mini", 
		"gpt-4",
		"gpt-3.5-turbo",
		"claude-3-5-sonnet-20241022",
		"claude-3-5-haiku-20241022",
		"claude-3-opus-20240229",
	}
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
}

// appState defines the different states of the application.
type appState int

const (
	stateChatting appState = iota
	stateOnboarding
	stateChatBrowser
	stateTemplateSelector
	stateSearch
	stateEditMessage
	stateBranchManager
	stateCreateCheckpoint
	statePersonalitySelector
)

// model represents the application's state.
type model struct {
	client         *ai.UnifiedClient
	messages       []ai.UnifiedMessage
	chatMessages   []chat.ChatMessage // Our enhanced message format
	textInput      textinput.Model
	error          error
	spinner        spinner.Model
	isThinking     bool
	preferences    *config.Preferences
	buddyName      string
	appState       appState
	onboardingStep int
	viewport       viewport.Model
	currentModel   string
	statusMessage  string
	tokenUsage     ai.TokenUsage

	// Chat browser fields
	savedChats     []string // List of saved chat files
	selectedChat   int      // Currently selected chat in browser

	// Template selector fields
	selectedTemplate int // Currently selected template

	// Search fields
	searchQuery      string             // Current search query
	searchResults    []chat.ChatMessage // Found messages
	selectedResult   int                // Currently selected search result

	// Theme
	currentTheme Theme // Current color theme

	// Loading state
	loadingMessage string // Current loading message
	
	// Message history for input
	messageHistory      []string // Previous user messages
	historyIndex        int      // Current position in message history
	tempInput          string   // Temporary storage when navigating history
	
	// Last user message for regeneration
	lastUserMessage    string // Store last user message for Ctrl+R
	
	// Auto-save tracking
	messagesSinceLastSave int  // Counter for auto-save feature
	
	// Typing animation
	typingContent      string // Full content being typed
	typingIndex        int    // Current position in typing animation
	isTyping           bool   // Whether we're animating a response
	
	// Message editing
	editingMessageIndex int      // Index of message being edited
	editingMessage      string   // Temporary content while editing
	selectedMessage     int      // Currently selected message for navigation
	
	// Branching
	conversationTree    *chat.ConversationTree // Conversation tree for branching
	checkpoints         []chat.Checkpoint      // Available checkpoints
	selectedCheckpoint  int                    // Currently selected checkpoint
	branches            []*chat.Branch         // Available branches
	selectedBranch      int                    // Currently selected branch
	checkpointName      string                 // Name for new checkpoint
	treeFilename        string                 // Current tree filename
	
	// Personality
	currentPersonality  *Personality // Current buddy personality
	selectedPersonality int          // Selected personality in selector
}

// formatChatMessage formats a single chat message with proper styling.
func (m model) formatChatMessage(msg ai.UnifiedMessage, width int) string {
	var label, content string

	if msg.Role == "user" {
		label = lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.UserMessage)).Bold(true).Render("You: ")
		content = msg.Content
	} else if msg.Role == "assistant" {
		label = lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.AssistantMessage)).Bold(true).Render(m.buddyName + ": ")
		content = highlightCode(msg.Content, m.isDarkTheme())
	}

	// Use lipgloss to handle proper wrapping
	messageStyle := lipgloss.NewStyle().
		Width(width).
		PaddingLeft(0).
		PaddingRight(2)

	return messageStyle.Render(label+content) + "\n\n"
}

// formatChatMessageWithTimestamp formats a chat message with timestamp.
func (m model) formatChatMessageWithTimestamp(msg chat.ChatMessage, width int) string {
	var label, content string
	timeStr := msg.Timestamp.Format("15:04")

	if msg.Role == "user" {
		label = lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.UserMessage)).Bold(true).Render("You: ")
		content = msg.Content
	} else if msg.Role == "assistant" {
		label = lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.AssistantMessage)).Bold(true).Render(m.buddyName + ": ")
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

	return messageStyle.Render(label+content+" "+timestamp) + "\n\n"
}

// buildChatContent generates the formatted chat history string for the viewport.
func (m model) buildChatContent() string {
	width, _, _ := term.GetSize(os.Stdout.Fd())
	var chatContent string

	// Use chatMessages if we have them (with timestamps), otherwise fall back to OpenAI messages
	if len(m.chatMessages) > 0 {
		for _, msg := range m.chatMessages {
			if msg.Role != "system" {
				chatContent += m.formatChatMessageWithTimestamp(msg, width-4) // Account for padding
			}
		}
	} else {
		for _, msg := range m.messages {
			if msg.Role != "system" {
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
func determineInitialState(prefs *config.Preferences) (appState, int) {
	if prefs == nil || prefs.BuddyName == "" {
		return stateOnboarding, 1
	}
	if prefs.SystemMessage == "" {
		return stateOnboarding, 2
	}
	return stateChatting, 0
}

// clearConversation clears all messages except the system message.
func (m *model) clearConversation() {
	systemMsg := m.messages[0] // Keep the system message
	m.messages = []ai.UnifiedMessage{systemMsg}
	m.chatMessages = []chat.ChatMessage{} // Clear chat history
	m.updateViewportContent()
	m.statusMessage = "Conversation cleared"
}

// truncateAndRegenerate truncates the conversation at the given index and regenerates from there
func (m *model) truncateAndRegenerate(index int, newContent string) {
	// Keep messages up to the edited message
	// Find where to truncate in the unified messages
	truncateAt := 1 // Start after system message
	for i := 0; i < index && i < len(m.chatMessages); i++ {
		if m.chatMessages[i].Role != "system" {
			truncateAt++
		}
	}
	
	// Truncate messages
	if truncateAt < len(m.messages) {
		m.messages = m.messages[:truncateAt]
	}
	
	// Truncate chat messages
	m.chatMessages = m.chatMessages[:index]
	
	// Add the edited message
	m.addChatMessage("user", newContent)
	m.lastUserMessage = newContent
	
	// Start regeneration
	m.isThinking = true
	m.loadingMessage = loadingMessages[time.Now().UnixNano()%int64(len(loadingMessages))]
	m.statusMessage = "Regenerating from edited message..."
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
		if m.chatMessages[i].Role == "assistant" {
			return m.chatMessages[i].Content
		}
	}
	return ""
}

// loadChatHistory loads a specific chat history file.
func (m *model) loadChatHistory(filename string) error {
	history, err := chat.LoadChat(filename)
	if err != nil {
		return err
	}

	// Load the chat into current session
	m.chatMessages = history.Messages
	m.buddyName = history.BuddyName
	m.currentModel = history.Model

	// Convert to unified messages format
	m.messages = []ai.UnifiedMessage{
		{Role: "system", Content: createSystemMessage(m.preferences, m.buddyName, m.currentPersonality)},
	}

	for _, msg := range history.Messages {
		if msg.Role != "system" {
			m.messages = append(m.messages, ai.UnifiedMessage{
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
	chats, err := chat.ListChats()
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
	config.SavePreferences(m.preferences)

	// Clear current conversation and apply new system message
	systemMessage := fmt.Sprintf("%s named %s.", template.Prompt, template.BuddyName)
	m.messages = []ai.UnifiedMessage{
		{Role: "system", Content: systemMessage},
	}
	m.chatMessages = []chat.ChatMessage{}

	m.updateViewportContent()
	m.statusMessage = fmt.Sprintf("Applied template: %s", template.Name)
}

// searchChats searches through all saved chats for the given query.
func searchChats(query string) ([]chat.ChatMessage, error) {
	if query == "" {
		return []chat.ChatMessage{}, nil
	}

	chats, err := chat.ListChats()
	if err != nil {
		return nil, err
	}

	var results []chat.ChatMessage
	queryLower := strings.ToLower(query)

	for _, filename := range chats {
		history, err := chat.LoadChat(filename)
		if err != nil {
			continue // Skip files we can't read
		}

		// Search through messages in this chat
		for _, msg := range history.Messages {
			if msg.Role != "system" {
				if strings.Contains(strings.ToLower(msg.Content), queryLower) {
					results = append(results, msg)
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
		config.SavePreferences(m.preferences)
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
	codeBlockRegex := regexp.MustCompile("```([a-zA-Z0-9_+-]*)\\n([\\s\\S]*?)\\n```")

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
			labelStyle.Render(languageLabel) + "\n" + strings.TrimSpace(highlightedCode),
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
	pricing, exists := ai.ModelPricing[model]
	if !exists {
		return 0.0
	}

	promptCost := float64(promptTokens) / 1000.0 * pricing.Input
	completionCost := float64(completionTokens) / 1000.0 * pricing.Output

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

// refreshBranchList refreshes the list of checkpoints from the conversation tree
func (m *model) refreshBranchList() {
	if m.conversationTree != nil {
		m.checkpoints = m.conversationTree.ListCheckpoints()
		m.selectedCheckpoint = 0
	}
}

// initializeConversationTree creates a new conversation tree if none exists
func (m *model) initializeConversationTree() {
	if m.conversationTree == nil {
		m.conversationTree = chat.NewConversationTree()
		m.treeFilename = fmt.Sprintf("tree_%s.json", time.Now().Format("2006-01-02_15-04-05"))
	}
}

// createCheckpoint creates a new checkpoint with the current conversation state
func (m *model) createCheckpoint(name, description string) error {
	m.initializeConversationTree()
	
	_, err := m.conversationTree.CreateCheckpoint(name, description, m.chatMessages)
	if err != nil {
		return err
	}
	
	// Save the tree
	return chat.SaveTree(m.conversationTree, m.treeFilename)
}

// loadCheckpoint loads a conversation from a checkpoint
func (m *model) loadCheckpoint(checkpointID string) error {
	if m.conversationTree == nil {
		return fmt.Errorf("no conversation tree loaded")
	}
	
	messages, err := m.conversationTree.LoadFromCheckpoint(checkpointID)
	if err != nil {
		return err
	}
	
	// Convert chat messages to unified messages
	m.messages = []ai.UnifiedMessage{
		{Role: "system", Content: m.messages[0].Content}, // Keep system message
	}
	m.chatMessages = []chat.ChatMessage{}
	
	for _, msg := range messages {
		if msg.Role != "system" {
			m.messages = append(m.messages, ai.UnifiedMessage{
				Role:    msg.Role,
				Content: msg.Content,
			})
			m.chatMessages = append(m.chatMessages, msg)
		}
	}
	
	m.updateViewportContent()
	return nil
}

// typingTick returns a command for the typing animation.
func typingTick() tea.Cmd {
	return tea.Tick(30*time.Millisecond, func(t time.Time) tea.Msg {
		return typingTickMsg{}
	})
}

// saveCurrentChat saves the current conversation to a file.
func (m *model) saveCurrentChat() error {
	history := chat.ChatHistory{
		Messages:  m.chatMessages,
		BuddyName: m.buddyName,
		Model:     m.currentModel,
	}

	_, err := chat.SaveChat(history)
	return err
}

// addChatMessage adds a message to both the unified messages and our chat history.
func (m *model) addChatMessage(role, content string) {
	// Add to unified messages
	m.messages = append(m.messages, ai.UnifiedMessage{
		Role:    role,
		Content: content,
	})

	// Add to our chat history with timestamp
	m.chatMessages = append(m.chatMessages, chat.ChatMessage{
		Role:      role,
		Content:   content,
		Timestamp: time.Now(),
		Model:     m.currentModel,
	})
}

// exportToMarkdown exports the current chat to a markdown file.
func (m *model) exportToMarkdown() error {
	history := chat.ChatHistory{
		Messages:  m.chatMessages,
		BuddyName: m.buddyName,
		Model:     m.currentModel,
	}

	_, err := chat.ExportToMarkdown(history)
	return err
}

// createSystemMessage creates the system message based on preferences.
func createSystemMessage(prefs *config.Preferences, buddyName string, personality *Personality) string {
	systemMessage := defaultSystemMessage
	if prefs != nil && prefs.SystemMessage != "" {
		systemMessage = prefs.SystemMessage
	}
	basePrompt := fmt.Sprintf("%s named %s.", systemMessage, buddyName)
	return ApplyPersonalityToSystemPrompt(personality, basePrompt)
}

// initialModel returns an initialized model.
func initialModel(client *ai.UnifiedClient) model {
	prefs, err := config.LoadPreferences()
	if err != nil {
		fmt.Printf("Error loading preferences: %v\n", err)
		prefs = &config.Preferences{} // Use empty preferences if error occurs
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
	
	// Set personality
	currentPersonality := GetPersonality("default")
	if prefs.Personality != "" {
		currentPersonality = GetPersonality(prefs.Personality)
	}
	// Apply personality to buddy name
	if currentPersonality != nil {
		buddyName = ApplyPersonalityToBuddyName(currentPersonality, buddyName)
	}

	initialState, onboardingStep := determineInitialState(prefs)
	systemMessage := createSystemMessage(prefs, buddyName, currentPersonality)

	return model{
		client: client,
		messages: []ai.UnifiedMessage{
			{Role: "system", Content: systemMessage},
		},
		chatMessages:   []chat.ChatMessage{}, // Initialize empty chat history
		textInput:      createTextInput(),
		spinner:        createSpinner(currentTheme),
		isThinking:     false,
		preferences:    prefs,
		buddyName:      buddyName,
		appState:       initialState,
		onboardingStep: onboardingStep,
		viewport:       createViewport(),
		currentModel:   currentModel,
		statusMessage:  fmt.Sprintf("Using %s", currentModel),
		savedChats:     []string{},
		selectedChat:   0,
		selectedTemplate: 0,
		searchQuery:    "",
		searchResults:  []chat.ChatMessage{},
		selectedResult: 0,
		currentTheme:   currentTheme,
		loadingMessage: "Thinking...", // Default loading message
		messageHistory: []string{},
		historyIndex:   0,
		tempInput:      "",
		editingMessageIndex: -1, // -1 means not editing
		currentPersonality: currentPersonality,
		selectedPersonality: 0,
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

	if err := config.SavePreferences(m.preferences); err != nil {
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

	case stateEditMessage:
		switch msg := msg.(type) {
		case tea.KeyMsg:
			switch msg.String() {
			case "ctrl+c", "q", "esc":
				m.appState = stateChatting
				m.statusMessage = "Edit cancelled"
				cmds = append(cmds, clearStatusAfterDelay())
			case "up", "k":
				// Navigate up through messages (skip system messages)
				for m.selectedMessage > 0 {
					m.selectedMessage--
					if m.chatMessages[m.selectedMessage].Role != "system" {
						break
					}
				}
			case "down", "j":
				// Navigate down through messages (skip system messages)
				for m.selectedMessage < len(m.chatMessages)-1 {
					m.selectedMessage++
					if m.chatMessages[m.selectedMessage].Role != "system" {
						break
					}
				}
			case "enter":
				// Start editing the selected message
				if m.selectedMessage < len(m.chatMessages) {
					msg := m.chatMessages[m.selectedMessage]
					if msg.Role == "user" {
						// Edit user message
						m.textInput.SetValue(msg.Content)
						m.editingMessageIndex = m.selectedMessage
						m.appState = stateChatting
						m.statusMessage = "Edit message and press Enter to regenerate from this point"
					} else {
						m.statusMessage = "Can only edit user messages"
						cmds = append(cmds, clearStatusAfterDelay())
					}
				}
			}
		}

	case stateBranchManager:
		switch msg := msg.(type) {
		case tea.KeyMsg:
			switch msg.String() {
			case "ctrl+c", "q", "esc":
				m.appState = stateChatting
				m.statusMessage = "Back to chat"
				cmds = append(cmds, clearStatusAfterDelay())
			case "up", "k":
				if m.selectedCheckpoint > 0 {
					m.selectedCheckpoint--
				}
			case "down", "j":
				if m.selectedCheckpoint < len(m.checkpoints)-1 {
					m.selectedCheckpoint++
				}
			case "enter":
				// Load from checkpoint
				if len(m.checkpoints) > 0 && m.selectedCheckpoint < len(m.checkpoints) {
					if err := m.loadCheckpoint(m.checkpoints[m.selectedCheckpoint].ID); err != nil {
						m.statusMessage = fmt.Sprintf("Failed to load checkpoint: %v", err)
					} else {
						m.appState = stateChatting
						m.statusMessage = fmt.Sprintf("Loaded checkpoint: %s", m.checkpoints[m.selectedCheckpoint].Name)
					}
					cmds = append(cmds, clearStatusAfterDelay())
				}
			case "b":
				// Create branch from checkpoint
				if len(m.checkpoints) > 0 && m.selectedCheckpoint < len(m.checkpoints) {
					checkpoint := m.checkpoints[m.selectedCheckpoint]
					newBranch, err := m.conversationTree.CreateBranch(
						checkpoint.ID,
						fmt.Sprintf("branch_%d", time.Now().Unix()),
						fmt.Sprintf("Branched from: %s", checkpoint.Name),
					)
					if err != nil {
						m.statusMessage = fmt.Sprintf("Failed to create branch: %v", err)
					} else {
						m.conversationTree.SwitchBranch(newBranch.ID)
						m.loadCheckpoint(checkpoint.ID)
						m.appState = stateChatting
						m.statusMessage = fmt.Sprintf("Created new branch from checkpoint: %s", checkpoint.Name)
						chat.SaveTree(m.conversationTree, m.treeFilename)
					}
					cmds = append(cmds, clearStatusAfterDelay())
				}
			case "s":
				// Save conversation tree
				if m.conversationTree != nil {
					if err := chat.SaveTree(m.conversationTree, m.treeFilename); err != nil {
						m.statusMessage = fmt.Sprintf("Failed to save tree: %v", err)
					} else {
						m.statusMessage = "Conversation tree saved"
					}
					cmds = append(cmds, clearStatusAfterDelay())
				}
			}
		}
		
	case stateCreateCheckpoint:
		m.textInput, cmd = m.textInput.Update(msg)
		cmds = append(cmds, cmd)
		
		if keyMsg, ok := msg.(tea.KeyMsg); ok {
			switch keyMsg.String() {
			case "ctrl+c", "esc":
				m.appState = stateChatting
				m.statusMessage = "Checkpoint creation cancelled"
				cmds = append(cmds, clearStatusAfterDelay())
			case "enter":
				name := m.textInput.Value()
				if name != "" {
					if err := m.createCheckpoint(name, ""); err != nil {
						m.statusMessage = fmt.Sprintf("Failed to create checkpoint: %v", err)
					} else {
						m.statusMessage = fmt.Sprintf("Checkpoint created: %s", name)
					}
					m.appState = stateChatting
					m.textInput.Reset()
					cmds = append(cmds, clearStatusAfterDelay())
				}
			}
		}

	case statePersonalitySelector:
		switch msg := msg.(type) {
		case tea.KeyMsg:
			switch msg.String() {
			case "ctrl+c", "q", "esc":
				m.appState = stateChatting
				m.statusMessage = "Back to chat"
				cmds = append(cmds, clearStatusAfterDelay())
			case "up", "k":
				if m.selectedPersonality > 0 {
					m.selectedPersonality--
				}
			case "down", "j":
				if m.selectedPersonality < len(personalities)-1 {
					m.selectedPersonality++
				}
			case "enter":
				if m.selectedPersonality < len(personalities) {
					// Apply the selected personality
					selectedPersonality := &personalities[m.selectedPersonality]
					m.currentPersonality = selectedPersonality
					
					// Update buddy name with personality
					baseName := m.preferences.BuddyName
					if baseName == "" {
						baseName = defaultBuddyName
					}
					m.buddyName = ApplyPersonalityToBuddyName(selectedPersonality, baseName)
					
					// Update system message with personality
					systemMessage := createSystemMessage(m.preferences, baseName, selectedPersonality)
					if len(m.messages) > 0 {
						m.messages[0].Content = systemMessage
					}
					
					// Save preference
					if m.preferences != nil {
						m.preferences.Personality = selectedPersonality.ID
						config.SavePreferences(m.preferences)
					}
					
					m.appState = stateChatting
					m.statusMessage = fmt.Sprintf("Personality changed to: %s %s", selectedPersonality.Emoji, selectedPersonality.Name)
					cmds = append(cmds, clearStatusAfterDelay())
				}
			}
		}

	case stateChatting:
		switch msg := msg.(type) {
		case tea.KeyMsg:
			switch msg.String() {
			case "ctrl+c":
				return m, tea.Quit
			case "q":
				// Only quit if input is empty
				if m.textInput.Value() == "" {
					return m, tea.Quit
				} else {
					// Pass through to text input
					m.textInput, cmd = m.textInput.Update(msg)
					cmds = append(cmds, cmd)
				}
			case "pgup":
				m.viewport.LineUp(10)
			case "pgdown":
				m.viewport.LineDown(10)
			case "up":
				// If input is empty, navigate message history
				if m.textInput.Value() == "" && len(m.messageHistory) > 0 {
					// Save current input if we're just starting to navigate
					if m.historyIndex == len(m.messageHistory) {
						m.tempInput = m.textInput.Value()
					}
					
					// Move up in history
					if m.historyIndex > 0 {
						m.historyIndex--
						m.textInput.SetValue(m.messageHistory[m.historyIndex])
						m.textInput.CursorEnd()
					}
				} else {
					// Normal viewport scrolling
					m.viewport.LineUp(1)
				}
			case "k":
				// Only use for scrolling if input is empty
				if m.textInput.Value() == "" {
					m.viewport.LineUp(1)
				} else {
					// Pass through to text input
					m.textInput, cmd = m.textInput.Update(msg)
					cmds = append(cmds, cmd)
				}
			case "down":
				// If we're navigating history, move down
				if m.historyIndex < len(m.messageHistory) {
					m.historyIndex++
					if m.historyIndex == len(m.messageHistory) {
						// Restore the temporary input
						m.textInput.SetValue(m.tempInput)
					} else {
						m.textInput.SetValue(m.messageHistory[m.historyIndex])
					}
					m.textInput.CursorEnd()
				} else {
					// Normal viewport scrolling
					m.viewport.LineDown(1)
				}
			case "j":
				// Only use for scrolling if input is empty
				if m.textInput.Value() == "" {
					m.viewport.LineDown(1)
				} else {
					// Pass through to text input
					m.textInput, cmd = m.textInput.Update(msg)
					cmds = append(cmds, cmd)
				}
			case "home":
				m.viewport.GotoTop()
			case "end":
				m.viewport.GotoBottom()
			case "ctrl+l":
				m.clearConversation()
				m.statusMessage = "Conversation cleared"
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+m":
				// Cycle through available models
				availableModels := getAvailableModels(m.client)
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
				config.SavePreferences(m.preferences)
				m.statusMessage = fmt.Sprintf("Switched to %s", m.currentModel)
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+s":
				// Save chat history
				if err := m.saveCurrentChat(); err != nil {
					m.statusMessage = fmt.Sprintf("Failed to save: %v", err)
				} else {
					m.statusMessage = "Chat history saved"
					m.messagesSinceLastSave = 0 // Reset auto-save counter
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
			case "ctrl+k":
				// Create checkpoint
				if len(m.chatMessages) > 0 {
					m.appState = stateCreateCheckpoint
					m.checkpointName = chat.GenerateCheckpointName(m.chatMessages)
					m.textInput.SetValue(m.checkpointName)
					m.textInput.Focus()
					m.statusMessage = "Create checkpoint - Enter name and press Enter"
				}
			case "ctrl+h":
				// Open branch manager
				m.appState = stateBranchManager
				m.refreshBranchList()
				m.statusMessage = "Branch manager - Use arrows to navigate, Enter to load checkpoint, B to branch, Esc to return"
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+a":
				// Toggle auto-save
				if m.preferences != nil {
					m.preferences.AutoSave = !m.preferences.AutoSave
					config.SavePreferences(m.preferences)
					status := "disabled"
					if m.preferences.AutoSave {
						status = "enabled"
					}
					m.statusMessage = fmt.Sprintf("Auto-save %s", status)
					cmds = append(cmds, clearStatusAfterDelay())
				}
			case "e":
				// Edit mode - only if input is empty and we have messages
				if m.textInput.Value() == "" && len(m.chatMessages) > 0 {
					m.appState = stateEditMessage
					m.selectedMessage = len(m.chatMessages) - 1 // Start at last message
					m.statusMessage = "Edit mode: ↑/↓ to select, Enter to edit, Esc to cancel"
				}
			case "ctrl+p":
				// Open template selector
				m.appState = stateTemplateSelector
				m.selectedTemplate = 0
				m.statusMessage = "Template selector - Use arrows to navigate, Enter to apply, Esc to return"
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+o":
				// Open personality selector
				m.appState = statePersonalitySelector
				m.selectedPersonality = 0
				m.statusMessage = "Personality selector - Use arrows to navigate, Enter to apply, Esc to return"
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+f":
				// Open search interface
				m.appState = stateSearch
				m.searchQuery = ""
				m.searchResults = []chat.ChatMessage{}
				m.selectedResult = 0
				m.statusMessage = "Search chat history - Type to search, Enter to perform search, Esc to return"
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+d":
				// Cycle theme
				m.cycleTheme()
				cmds = append(cmds, clearStatusAfterDelay())
			case "ctrl+r":
				// Regenerate last response
				if m.lastUserMessage != "" && !m.isThinking {
					// Remove the last assistant message if there is one
					if len(m.messages) > 0 && m.messages[len(m.messages)-1].Role == "assistant" {
						m.messages = m.messages[:len(m.messages)-1]
						if len(m.chatMessages) > 0 && m.chatMessages[len(m.chatMessages)-1].Role == "assistant" {
							m.chatMessages = m.chatMessages[:len(m.chatMessages)-1]
						}
					}
					
					// Resend the last user message
					m.isThinking = true
					if m.currentPersonality != nil {
						m.loadingMessage = GetPersonalityThinkingMessage(m.currentPersonality)
					} else {
						m.loadingMessage = loadingMessages[time.Now().UnixNano()%int64(len(loadingMessages))]
					}
					m.statusMessage = "Regenerating response..."
					cmds = append(cmds, sendToAI(m, m.lastUserMessage), m.spinner.Tick)
					cmds = append(cmds, clearStatusAfterDelay())
				}
			case "enter", "shift+enter":
				value := m.textInput.Value()
				if value != "" {
					// Check if we're editing a message
					if m.editingMessageIndex >= 0 {
						// Truncate conversation at edit point and regenerate
						m.truncateAndRegenerate(m.editingMessageIndex, value)
						m.editingMessageIndex = -1 // Reset editing
						m.textInput.Reset()
						cmds = append(cmds, sendToAI(m, value), m.spinner.Tick)
						return m, tea.Batch(cmds...)
					}
					
					// Check for commands
					switch strings.ToLower(strings.TrimSpace(value)) {
					case "/clear":
						m.clearConversation()
						m.statusMessage = "Conversation cleared"
						m.textInput.Reset()
						cmds = append(cmds, clearStatusAfterDelay())
						return m, tea.Batch(cmds...)
					case "/help":
						// Show help as a system message
						helpText := `Available commands:
/clear - Clear the conversation
/help - Show this help message

Keyboard shortcuts:
↑/↓ - Scroll chat or navigate message history
PgUp/PgDn - Scroll by page
Home/End - Jump to top/bottom
e - Edit mode (edit any user message)
Ctrl+R - Regenerate last response
Ctrl+L - Clear conversation
Ctrl+M - Switch AI model
Ctrl+S - Save chat
Ctrl+E - Export to markdown
Ctrl+T - Show token usage
Ctrl+Y - Copy last response
Ctrl+B - Browse saved chats
Ctrl+P - Select AI templates
Ctrl+F - Search chat history
Ctrl+D - Change theme
Ctrl+A - Toggle auto-save
Ctrl+C/Q - Quit`
						m.addChatMessage("system", helpText)
						m.textInput.Reset()
						m.updateViewportContent()
						return m, tea.Batch(cmds...)
					default:
						// Normal message processing
						// Add to message history
						m.messageHistory = append(m.messageHistory, value)
						m.historyIndex = len(m.messageHistory) // Reset history navigation
						m.lastUserMessage = value // Save for potential regeneration
						
						m.addChatMessage("user", value)
						m.isThinking = true
						// Select a random loading message based on personality
						if m.currentPersonality != nil {
							m.loadingMessage = GetPersonalityThinkingMessage(m.currentPersonality)
						} else {
							m.loadingMessage = loadingMessages[time.Now().UnixNano()%int64(len(loadingMessages))]
						}
						cmds = append(cmds, sendToAI(m, value), m.spinner.Tick)
						m.textInput.Reset()
					}
				}
			default:
				// Filter out unhandled escape sequences
				keyStr := msg.String()
				if strings.Contains(keyStr, "[27;") || strings.Contains(keyStr, "~") {
					// Skip these escape sequences - show a helpful message
					m.statusMessage = fmt.Sprintf("Ignored escape sequence: %s", keyStr)
					cmds = append(cmds, clearStatusAfterDelay())
					break
				}
				
				m.textInput, cmd = m.textInput.Update(msg)
				cmds = append(cmds, cmd)
			}
		case errMsg:
			m.error = msg
			m.isThinking = false
		case tokenizedResponseMsg:
			// Start typing animation
			m.isThinking = false
			m.isTyping = true
			m.typingContent = msg.Content
			m.typingIndex = 0
			
			// Add empty message that will be filled by typing
			m.addChatMessage("assistant", "")
			
			// Track tokens
			m.updateTokenUsage(msg.PromptTokens, msg.CompletionTokens)
			
			// Start typing animation
			cmds = append(cmds, typingTick())
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
		case typingTickMsg:
			if m.isTyping && m.typingIndex < len(m.typingContent) {
				// Calculate how many characters to add (variable speed for realism)
				charsToAdd := 1 + (m.typingIndex % 3) // 1-3 chars at a time
				endIndex := m.typingIndex + charsToAdd
				if endIndex > len(m.typingContent) {
					endIndex = len(m.typingContent)
				}
				
				// Update the last message with more content
				if len(m.chatMessages) > 0 {
					m.chatMessages[len(m.chatMessages)-1].Content = m.typingContent[:endIndex]
					if len(m.messages) > 0 && m.messages[len(m.messages)-1].Role == "assistant" {
						m.messages[len(m.messages)-1].Content = m.typingContent[:endIndex]
					}
				}
				
				m.typingIndex = endIndex
				m.updateViewportContent()
				
				if m.typingIndex < len(m.typingContent) {
					// Continue typing
					cmds = append(cmds, typingTick())
				} else {
					// Typing complete
					m.isTyping = false
					
					// Auto-save check
					m.messagesSinceLastSave++
					if m.preferences != nil && m.preferences.AutoSave && m.messagesSinceLastSave >= 5 {
						if err := m.saveCurrentChat(); err != nil {
							m.statusMessage = fmt.Sprintf("Auto-save failed: %v", err)
						} else {
							m.statusMessage = "Auto-saved conversation (every 5 messages)"
							m.messagesSinceLastSave = 0
						}
						cmds = append(cmds, clearStatusAfterDelay())
					}
				}
			}
		default:
			// Update viewport for scrolling
			m.viewport, cmd = m.viewport.Update(msg)
			cmds = append(cmds, cmd)
			
			// Update text input
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
		helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("8")).Italic(true)
		s += helpStyle.Render("↑↓: Navigate | Enter: Load | R: Refresh | Esc: Back") + "\n"

		if m.statusMessage != "" {
			statusStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("8"))
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

		helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("8")).Italic(true)
		s += helpStyle.Render("↑↓: Navigate | Enter: Apply Template | Esc: Back") + "\n"

		if m.statusMessage != "" {
			statusStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("8"))
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
				if result.Role == "user" {
					role = "You"
				} else {
					role = "AI"
				}

				timeStr := result.Timestamp.Format("2006-01-02 15:04")

				s += style.Render(fmt.Sprintf("  [%s] %s: %s", timeStr, roleStyle.Render(role), preview)) + "\n"
			}
			s += "\n"
		}

		helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("8")).Italic(true)
		s += helpStyle.Render("Type to search | Enter: Search | ↑↓: Navigate results | Esc: Back") + "\n"

		if m.statusMessage != "" {
			statusStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("8"))
			s += "\n" + statusStyle.Render(fmt.Sprintf("Status: %s", m.statusMessage))
		}

		return s

	case stateEditMessage:
		s := lipgloss.NewStyle().Bold(true).Render("📝 Edit Message Mode") + "\n\n"
		
		// Show messages with selection highlight
		for i, msg := range m.chatMessages {
			if msg.Role == "system" {
				continue // Skip system messages
			}
			
			style := lipgloss.NewStyle()
			if i == m.selectedMessage {
				style = style.Background(lipgloss.Color(m.currentTheme.Background)).Foreground(lipgloss.Color(m.currentTheme.Highlight))
			}
			
			// Format message preview
			preview := msg.Content
			if len(preview) > 60 {
				preview = preview[:57] + "..."
			}
			
			roleStyle := lipgloss.NewStyle().Bold(true)
			if msg.Role == "user" {
				roleStyle = roleStyle.Foreground(lipgloss.Color(m.currentTheme.UserMessage))
				s += style.Render(fmt.Sprintf("  [%d] %s: %s", i, roleStyle.Render("You"), preview)) + "\n"
			} else {
				roleStyle = roleStyle.Foreground(lipgloss.Color(m.currentTheme.AssistantMessage))
				s += style.Render(fmt.Sprintf("  [%d] %s: %s", i, roleStyle.Render(m.buddyName), preview)) + "\n"
			}
		}
		
		s += "\n"
		helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("8")).Italic(true)
		s += helpStyle.Render("↑/↓: Navigate | Enter: Edit selected message | Esc: Cancel") + "\n"
		
		if m.statusMessage != "" {
			statusStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("8"))
			s += "\n" + statusStyle.Render(fmt.Sprintf("Status: %s", m.statusMessage))
		}
		
		return s

	case stateBranchManager:
		s := lipgloss.NewStyle().Bold(true).Render("🌿 Branch Manager") + "\n\n"
		
		if m.conversationTree == nil {
			s += "No conversation tree loaded. Create a checkpoint first (Ctrl+K)\n"
		} else {
			s += fmt.Sprintf("Current branch: %s\n\n", m.conversationTree.GetCurrentBranch().Name)
			
			// Show checkpoints
			s += lipgloss.NewStyle().Bold(true).Render("Checkpoints:") + "\n"
			for i, checkpoint := range m.checkpoints {
				style := lipgloss.NewStyle()
				if i == m.selectedCheckpoint {
					style = style.Background(lipgloss.Color(m.currentTheme.Background)).Foreground(lipgloss.Color(m.currentTheme.Highlight))
				}
				
				timeStr := checkpoint.CreatedAt.Format("15:04")
				s += style.Render(fmt.Sprintf("  [%s] %s", timeStr, checkpoint.Name)) + "\n"
				if checkpoint.Description != "" {
					s += style.Render(fmt.Sprintf("    %s", checkpoint.Description)) + "\n"
				}
			}
			
			s += "\n"
		}
		
		helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("8")).Italic(true)
		s += helpStyle.Render("↑↓: Navigate | Enter: Load checkpoint | B: Create branch | S: Save tree | Esc: Back") + "\n"
		
		if m.statusMessage != "" {
			statusStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("8"))
			s += "\n" + statusStyle.Render(fmt.Sprintf("Status: %s", m.statusMessage))
		}
		
		return s
		
	case stateCreateCheckpoint:
		s := lipgloss.NewStyle().Bold(true).Render("💾 Create Checkpoint") + "\n\n"
		
		s += "Enter a name for this checkpoint:\n\n"
		s += m.textInput.View() + "\n\n"
		
		helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("8")).Italic(true)
		s += helpStyle.Render("Enter: Create checkpoint | Esc: Cancel") + "\n"
		
		return s

	case statePersonalitySelector:
		s := lipgloss.NewStyle().Bold(true).Render("🎭 Buddy Personality Selector") + "\n\n"
		
		for i, personality := range personalities {
			style := lipgloss.NewStyle()
			if i == m.selectedPersonality {
				style = style.Background(lipgloss.Color(m.currentTheme.Background)).Foreground(lipgloss.Color(m.currentTheme.Highlight))
			}
			
			name := lipgloss.NewStyle().Bold(true).Render(fmt.Sprintf("%s %s", personality.Emoji, personality.Name))
			description := lipgloss.NewStyle().Faint(true).Render(personality.Description)
			
			// Show current selection
			currentMarker := "  "
			if m.currentPersonality != nil && m.currentPersonality.ID == personality.ID {
				currentMarker = "→ "
			}
			
			s += style.Render(fmt.Sprintf("%s%s", currentMarker, name)) + "\n"
			s += style.Render(fmt.Sprintf("    %s", description)) + "\n\n"
		}
		
		helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("8")).Italic(true)
		s += helpStyle.Render("↑↓: Navigate | Enter: Apply Personality | Esc: Back") + "\n"
		
		if m.statusMessage != "" {
			statusStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("8"))
			s += "\n" + statusStyle.Render(fmt.Sprintf("Status: %s", m.statusMessage))
		}
		
		return s

	case stateChatting:
		m.updateViewportContent()
		s := m.viewport.View() + "\n"

		if m.isThinking {
			// Show loading message and typing indicator
			s += m.spinner.View() + " " + m.loadingMessage + "\n"
			
			// Add typing indicator for the assistant
			typingStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.AssistantMessage)).Italic(true)
			typingIndicator := fmt.Sprintf("%s is typing...", m.buddyName)
			if m.currentPersonality != nil {
				typingIndicator = fmt.Sprintf("%s %s", m.buddyName, m.currentPersonality.TypingIndicator)
			}
			s += typingStyle.Render(typingIndicator) + "\n"
		} else if m.isTyping {
			// Show a subtle indicator during typing animation
			typingStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.AssistantMessage)).Faint(true)
			s += typingStyle.Render("▌") + "\n" // Blinking cursor effect
		}

		// Add status line
		statusStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.Status))
		if m.statusMessage != "" {
			s += statusStyle.Render(fmt.Sprintf("Status: %s", m.statusMessage)) + "\n"
		}

		// Add keyboard shortcuts help (split into four lines for readability)
		helpStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.Status)).Italic(true)
		s += helpStyle.Render("↑/↓/PgUp/PgDn: Scroll | Home/End: Top/Bottom | Ctrl+R: Regenerate | E: Edit") + "\n"
		s += helpStyle.Render("Ctrl+L: Clear | Ctrl+M: Model | Ctrl+S: Save | Ctrl+E: Export | Ctrl+T: Tokens | Ctrl+Y: Copy") + "\n"
		s += helpStyle.Render("Ctrl+B: Browse | Ctrl+P: Templates | Ctrl+O: Personality | Ctrl+F: Search | Ctrl+D: Theme") + "\n"
		s += helpStyle.Render("Ctrl+K: Checkpoint | Ctrl+H: Branches | Ctrl+A: Auto-save | Ctrl+C: Quit") + "\n"

		// Add input line with token counter
		inputLabel := "Your message: "
		currentText := m.textInput.Value()
		tokenCount := estimateTokens(currentText)
		
		// Show token count if there's text
		if len(currentText) > 0 {
			tokenStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.Status)).Faint(true)
			inputLabel += tokenStyle.Render(fmt.Sprintf("[~%d tokens] ", tokenCount))
		}
		
		// Create wrapped version of input for display
		labelStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(m.currentTheme.InputLabel))
		s += "\n" + labelStyle.Render(inputLabel)
		
		// For now, just show the standard input (wrapping will be handled by terminal)
		s += m.textInput.View()

		if m.error != nil {
			s += fmt.Sprintf("\nError: %v", m.error)
		}

		return s
	}
	return ""
}

// Fun loading messages
var loadingMessages = []string{
	"Asking the AI nicely...",
	"Consulting the oracle...",
	"Pondering your question...",
	"Thinking really hard...",
	"Summoning digital wisdom...",
	"Processing neurons...",
	"Warming up the servers...",
	"Channeling the AI spirits...",
	"Computing the answer to life...",
	"Brewing some thoughts...",
}

// Message types for OpenAI communication
type (
	tokenizedResponseMsg struct {
		Content          string
		PromptTokens     int
		CompletionTokens int
	}
	errMsg         error
	clearStatusMsg struct{}
	typingTickMsg  struct{} // For typing animation
)

// estimateTokens provides a rough estimate of token count for a string
// This is a simple approximation - actual token count may vary
func estimateTokens(text string) int {
	// Rough estimation: ~4 characters per token on average
	// This is simplified but works reasonably well for English text
	return len(text) / 4
}

// wrapText wraps text to fit within the specified width
func wrapText(text string, width int) string {
	if len(text) <= width {
		return text
	}
	
	var lines []string
	for len(text) > 0 {
		if len(text) <= width {
			lines = append(lines, text)
			break
		}
		
		// Find a good break point (space)
		breakPoint := width
		for i := width; i > width*2/3; i-- {
			if text[i-1] == ' ' {
				breakPoint = i
				break
			}
		}
		
		lines = append(lines, text[:breakPoint])
		text = text[breakPoint:]
		
		// Skip leading space on next line
		if len(text) > 0 && text[0] == ' ' {
			text = text[1:]
		}
	}
	
	return strings.Join(lines, "\n")
}

// sendToOpenAI sends a prompt to OpenAI and tracks token usage.
func sendToAI(m model, prompt string) tea.Cmd {
	return func() tea.Msg {
		// Extract system prompt from messages
		systemPrompt := ""
		var conversationMessages []ai.UnifiedMessage
		for _, msg := range m.messages {
			if msg.Role == "system" {
				systemPrompt = msg.Content
			} else {
				conversationMessages = append(conversationMessages, msg)
			}
		}
		
		response, err := m.client.SendMessage(m.currentModel, conversationMessages, systemPrompt)
		if err != nil {
			return errMsg(fmt.Errorf("failed to create chat completion: %w", err))
		}

		// Create tokenized response with usage data
		tokenResponse := tokenizedResponseMsg{
			Content:          response.Content,
			PromptTokens:     response.PromptTokens,
			CompletionTokens: response.CompletionTokens,
		}

		return tokenResponse
	}
}

// Start begins the TUI application.
func Start(client *ai.UnifiedClient) {
	p := tea.NewProgram(initialModel(client))
	if _, err := p.Run(); err != nil {
		fmt.Printf("Alas, there's been an error: %v\n", err)
		os.Exit(1)
	}
}
