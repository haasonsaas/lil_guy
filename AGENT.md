# Agent Configuration for lil_guy

## Build/Test/Run Commands
- `go run main.go` - Run the application
- `go build` - Build the binary
- `go test ./...` - Run all tests 
- `go test -run TestName` - Run specific test

## Architecture
- Simple Go CLI chat application using Bubble Tea TUI framework
- OpenAI API integration for AI chat functionality
- Preferences stored in `~/.lil_guy_preferences.json`
- Environment variables loaded from `.env` file (requires `OPENAI_API_KEY`)

## Code Style
- Standard Go formatting with `go fmt`
- Use structured imports: stdlib, 3rd party, local
- Error handling with explicit checks and wrapping
- Camel case for struct fields, snake case for JSON tags
- Type aliases for enums (e.g., `type appState int`)
- Descriptive variable names (e.g., `buddyName`, `systemMessage`)
- Use `ioutil` for file operations (legacy style in this codebase)
- Struct methods for model operations in Bubble Tea pattern
