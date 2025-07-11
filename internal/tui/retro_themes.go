package tui

import (
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/charmbracelet/lipgloss"
)

// RetroTheme represents a retro terminal theme with visual effects
type RetroTheme struct {
	ID             string
	Name           string
	Description    string
	BaseTheme      Theme
	Effects        []VisualEffect
	BorderStyle    lipgloss.Border
	TitleArt       string
	PromptPrefix   string
	CursorStyle    string
	BackgroundChar string // Character for background pattern
}

// VisualEffect represents a visual effect for retro themes
type VisualEffect interface {
	Apply(content string, width int) string
}

// ScanLinesEffect adds CRT-style scan lines
type ScanLinesEffect struct {
	Intensity float32
}

func (e ScanLinesEffect) Apply(content string, width int) string {
	lines := strings.Split(content, "\n")
	for i := range lines {
		if i%2 == 0 && rand.Float32() < e.Intensity {
			// Dim every other line slightly
			lines[i] = lipgloss.NewStyle().Faint(true).Render(lines[i])
		}
	}
	return strings.Join(lines, "\n")
}

// MatrixRainEffect adds falling characters in the background
type MatrixRainEffect struct {
	Density int
	Chars   []rune
}

func (e MatrixRainEffect) Apply(content string, width int) string {
	// This would be applied to empty areas or as background
	// For now, just return content as-is
	return content
}

// PhosphorGlowEffect simulates CRT phosphor glow
type PhosphorGlowEffect struct {
	Color string
}

func (e PhosphorGlowEffect) Apply(content string, width int) string {
	return lipgloss.NewStyle().Foreground(lipgloss.Color(e.Color)).Render(content)
}

// Available retro themes
var retroThemes = []RetroTheme{
	{
		ID:          "crt_green",
		Name:        "CRT Green Phosphor",
		Description: "Classic green monochrome monitor with scan lines",
		BaseTheme: Theme{
			Name:             "CRT Green",
			UserMessage:      "10",  // Bright green
			AssistantMessage: "2",   // Green
			Spinner:          "10",
			InputLabel:       "10",
			Status:           "2",
			Background:       "0",   // Black
			Highlight:        "10",
		},
		Effects: []VisualEffect{
			ScanLinesEffect{Intensity: 0.3},
			PhosphorGlowEffect{Color: "10"},
		},
		BorderStyle:    lipgloss.DoubleBorder(),
		TitleArt:       getCRTAsciiArt(),
		PromptPrefix:   "> ",
		CursorStyle:    "█",
		BackgroundChar: " ",
	},
	{
		ID:          "amber_terminal",
		Name:        "Amber Terminal",
		Description: "Warm amber monochrome display",
		BaseTheme: Theme{
			Name:             "Amber",
			UserMessage:      "214", // Amber
			AssistantMessage: "208", // Dark amber
			Spinner:          "214",
			InputLabel:       "214",
			Status:           "208",
			Background:       "0",   // Black
			Highlight:        "214",
		},
		Effects: []VisualEffect{
			PhosphorGlowEffect{Color: "214"},
		},
		BorderStyle:    lipgloss.RoundedBorder(),
		TitleArt:       getAmberAsciiArt(),
		PromptPrefix:   "$ ",
		CursorStyle:    "_",
		BackgroundChar: " ",
	},
	{
		ID:          "matrix",
		Name:        "Matrix Rain",
		Description: "Green text with digital rain effect",
		BaseTheme: Theme{
			Name:             "Matrix",
			UserMessage:      "46",  // Bright green
			AssistantMessage: "34",  // Green
			Spinner:          "46",
			InputLabel:       "46",
			Status:           "22",  // Dark green
			Background:       "0",   // Black
			Highlight:        "46",
		},
		Effects: []VisualEffect{
			MatrixRainEffect{Density: 5, Chars: []rune("ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ012345789Z")},
			PhosphorGlowEffect{Color: "46"},
		},
		BorderStyle:    lipgloss.HiddenBorder(),
		TitleArt:       getMatrixAsciiArt(),
		PromptPrefix:   "@ ",
		CursorStyle:    "▌",
		BackgroundChar: " ",
	},
	{
		ID:          "synthwave",
		Name:        "Synthwave",
		Description: "Neon purple and pink with grid",
		BaseTheme: Theme{
			Name:             "Synthwave",
			UserMessage:      "13",  // Bright magenta
			AssistantMessage: "201", // Hot pink
			Spinner:          "99",  // Purple
			InputLabel:       "13",
			Status:           "99",
			Background:       "17",  // Dark blue
			Highlight:        "201",
		},
		Effects: []VisualEffect{
			PhosphorGlowEffect{Color: "201"},
		},
		BorderStyle:    lipgloss.ThickBorder(),
		TitleArt:       getSynthwaveAsciiArt(),
		PromptPrefix:   "▸ ",
		CursorStyle:    "▌",
		BackgroundChar: "·",
	},
	{
		ID:          "dos",
		Name:        "DOS Mode",
		Description: "Classic DOS blue background with white text",
		BaseTheme: Theme{
			Name:             "DOS",
			UserMessage:      "15",  // White
			AssistantMessage: "11",  // Bright yellow
			Spinner:          "15",
			InputLabel:       "15",
			Status:           "7",   // Light gray
			Background:       "17",  // Blue
			Highlight:        "11",
		},
		Effects:        []VisualEffect{},
		BorderStyle:    lipgloss.NormalBorder(),
		TitleArt:       getDOSAsciiArt(),
		PromptPrefix:   "C:\\> ",
		CursorStyle:    "_",
		BackgroundChar: " ",
	},
	{
		ID:          "commodore64",
		Name:        "Commodore 64",
		Description: "Light blue on dark blue, 8-bit style",
		BaseTheme: Theme{
			Name:             "C64",
			UserMessage:      "75",  // Light blue
			AssistantMessage: "33",  // Blue
			Spinner:          "75",
			InputLabel:       "75",
			Status:           "69",  // Light blue
			Background:       "17",  // Dark blue
			Highlight:        "87",  // Light cyan
		},
		Effects:        []VisualEffect{},
		BorderStyle:    lipgloss.NormalBorder(),
		TitleArt:       getC64AsciiArt(),
		PromptPrefix:   "READY.\n",
		CursorStyle:    "█",
		BackgroundChar: " ",
	},
}

// ASCII art functions
func getCRTAsciiArt() string {
	return `
╔═══════════════════════════════════════╗
║  ▄▄·  ▄▄▄  ▄▄▄▄▄    ▄▄ • ▄▄▄  ▄▄▄ . ║
║ ▐█ ▌▪ ▀▄ █·•██      ▐█ ▀ ▪▀▄ █·▀▄.▀· ║
║ ██ ▄▄ ▐▀▀▄  ▐█.▪    ▄█ ▀█▄▐▀▀▄ ▐▀▀▪▄ ║
║ ▐███▌ ▐█•█▌ ▐█▌·    ▐█▄▪▐█▐█•█▌▐█▄▄▌ ║
║ ·▀▀▀  .▀  ▀ ▀▀▀     ·▀▀▀▀ .▀  ▀ ▀▀▀  ║
╚═══════════════════════════════════════╝`
}

func getAmberAsciiArt() string {
	return `
┌─────────────────────────────────┐
│ ╔═╗╔╦╗╔╗ ╔═╗╦═╗  ╔╦╗╔═╗╦═╗╔╦╗ │
│ ╠═╣║║║╠╩╗║╣ ╠╦╝   ║ ║╣ ╠╦╝║║║ │
│ ╩ ╩╩ ╩╚═╝╚═╝╩╚═   ╩ ╚═╝╩╚═╩ ╩ │
└─────────────────────────────────┘`
}

func getMatrixAsciiArt() string {
	return `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ╔╦╗╔═╗╔╦╗╦═╗╦═╗ ╦  ╦═╗╔═╗╦╔╗╔ ┃
┃ ║║║╠═╣ ║ ╠╦╝║╔╩╦╝  ╠╦╝╠═╣║║║║ ┃
┃ ╩ ╩╩ ╩ ╩ ╩╚═╩╩ ╚═  ╩╚═╩ ╩╩╝╚╝ ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
}

func getSynthwaveAsciiArt() string {
	return `
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
▓ ╔═╗╦ ╦╔╗╔╔╦╗╦ ╦╦ ╦╔═╗╦  ╦╔═╗ ▓
▓ ╚═╗╚╦╝║║║ ║ ╠═╣║║║╠═╣╚╗╔╝║╣  ▓
▓ ╚═╝ ╩ ╝╚╝ ╩ ╩ ╩╚╩╝╩ ╩ ╚╝ ╚═╝ ▓
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓`
}

func getDOSAsciiArt() string {
	return `
┌───────────────────────────────────┐
│ MS-DOS Version 6.22               │
│ Copyright (C) Microsoft Corp 1994 │
│ LIL_GUY AI SYSTEM v1.0           │
└───────────────────────────────────┘`
}

func getC64AsciiArt() string {
	return `
    **** COMMODORE 64 BASIC V2 ****
     64K RAM SYSTEM  38911 BASIC BYTES FREE
READY.`
}

// GetRetroTheme returns a retro theme by ID
func GetRetroTheme(id string) *RetroTheme {
	for i := range retroThemes {
		if retroThemes[i].ID == id {
			return &retroThemes[i]
		}
	}
	return nil
}

// ApplyRetroEffects applies visual effects to content
func ApplyRetroEffects(theme *RetroTheme, content string, width int) string {
	result := content
	for _, effect := range theme.Effects {
		result = effect.Apply(result, width)
	}
	return result
}

// GenerateRetroBackground generates a background pattern
func GenerateRetroBackground(theme *RetroTheme, width, height int) string {
	if theme.BackgroundChar == " " {
		return ""
	}
	
	var bg strings.Builder
	for i := 0; i < height; i++ {
		for j := 0; j < width; j++ {
			bg.WriteString(theme.BackgroundChar)
		}
		bg.WriteString("\n")
	}
	
	return lipgloss.NewStyle().
		Foreground(lipgloss.Color(theme.BaseTheme.Background)).
		Faint(true).
		Render(bg.String())
}

// AnimateRetroText simulates retro text animation
func AnimateRetroText(text string, charDelay time.Duration) <-chan string {
	ch := make(chan string)
	go func() {
		defer close(ch)
		for i := 1; i <= len(text); i++ {
			ch <- text[:i]
			time.Sleep(charDelay)
		}
	}()
	return ch
}

// RetroThemeSelector returns a formatted list of retro themes
func RetroThemeSelector() string {
	var sb strings.Builder
	sb.WriteString("Choose your retro terminal theme:\n\n")
	
	for i, theme := range retroThemes {
		sb.WriteString(fmt.Sprintf("%d. %s - %s\n", i+1, theme.Name, theme.Description))
	}
	
	return sb.String()
}