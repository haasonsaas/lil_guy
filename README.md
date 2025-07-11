# 🤖 lil_guy

A delightful terminal-based AI chat application built with Go and Bubble Tea, featuring multiple AI models, conversation management, and token usage tracking.

## ✨ Features

- 🤖 **Multiple AI Models**: Switch between GPT-4o, GPT-4o-mini, GPT-4, and GPT-3.5-turbo
- 💬 **Rich Chat Interface**: Beautiful terminal UI with timestamps and color coding
- 🎨 **Syntax Highlighting**: Code blocks with full language support and themes
- 📝 **Conversation Management**: Save, load, and export chat history
- 🔍 **Search & Browse**: Find messages across all conversations
- 🎭 **AI Templates**: Pre-built personas (coding expert, writer, tutor, etc.)
- 💰 **Token Usage Tracking**: Monitor token consumption and estimated costs
- ⌨️ **Keyboard Shortcuts**: Powerful shortcuts for efficient interaction
- 🌈 **Custom Themes**: Multiple color schemes (default, dark, ocean, sunset, forest)
- 📋 **Clipboard Support**: Copy responses with cross-platform compatibility
- 📁 **Export Options**: Save conversations as JSON or Markdown
- 🔄 **Auto-save**: Optional automatic conversation saving

## 🚀 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/lil_guy.git
   cd lil_guy
   ```

2. **Install dependencies:**
   ```bash
   go mod tidy
   ```

3. **Set up your OpenAI API key:**
   ```bash
   echo "OPENAI_API_KEY=your_api_key_here" > .env
   ```

4. **Build and run:**
   ```bash
   go build
   ./lil_guy
   ```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|---------|
| `Ctrl+L` | Clear conversation |
| `Ctrl+M` | Switch AI model |
| `Ctrl+S` | Save chat history |
| `Ctrl+E` | Export to markdown |
| `Ctrl+T` | Show token usage stats |
| `Ctrl+Y` | Copy last response to clipboard |
| `Ctrl+B` | Browse saved conversations |
| `Ctrl+P` | Select AI templates/personas |
| `Ctrl+F` | Search chat history |
| `Ctrl+D` | Cycle color themes |
| `Ctrl+A` | Toggle auto-save |
| `Ctrl+C` | Quit application |

## 🎯 Usage

1. **First Run**: Configure your AI buddy's name and personality
2. **Chat**: Type messages and press Enter
3. **Switch Models**: Use `Ctrl+M` to cycle through available models
4. **Save Conversations**: Use `Ctrl+S` to save chat history
5. **Export**: Use `Ctrl+E` to export as markdown
6. **Monitor Usage**: Use `Ctrl+T` to see token usage and costs

## 📁 File Structure

- **Preferences**: `~/.lil_guy_preferences.json`
- **Chat History**: `~/.lil_guy_chats/`
- **Environment**: `.env` (for API keys)

## 🛠️ Development

### Running Tests
```bash
go test -v ./...
```

### Building
```bash
go build -o lil_guy
```

### Code Structure
- `main.go`: Core application logic
- `main_test.go`: Unit tests
- `AGENT.md`: Development configuration

## 🎨 Customization

The app supports:
- Custom AI buddy names
- Personalized system prompts
- Different AI models with automatic pricing
- Conversation export formats

## 💰 Pricing

Token usage is tracked automatically with estimated costs based on current OpenAI pricing:
- **GPT-4o**: $0.0025/$0.01 per 1K input/output tokens
- **GPT-4o-mini**: $0.00015/$0.0006 per 1K input/output tokens
- **GPT-4**: $0.03/$0.06 per 1K input/output tokens
- **GPT-3.5-turbo**: $0.0015/$0.002 per 1K input/output tokens

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Bubble Tea](https://github.com/charmbracelet/bubbletea) TUI framework
- Powered by [OpenAI API](https://openai.com/api/)
- Uses [Lipgloss](https://github.com/charmbracelet/lipgloss) for styling
