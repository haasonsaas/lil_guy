package chat

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// Checkpoint represents a saved conversation state
type Checkpoint struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Messages    []ChatMessage `json:"messages"`
	CreatedAt   time.Time     `json:"created_at"`
	BranchFrom  string        `json:"branch_from,omitempty"` // ID of parent checkpoint
}

// Branch represents a conversation branch
type Branch struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Checkpoints []Checkpoint `json:"checkpoints"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// ConversationTree manages branches and checkpoints
type ConversationTree struct {
	RootBranch   *Branch            `json:"root_branch"`
	Branches     map[string]*Branch `json:"branches"`
	CurrentBranch string            `json:"current_branch"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
}

const (
	branchesDir = ".lil_guy_branches"
)

// GetBranchesDir returns the directory path for branch files
func GetBranchesDir() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home directory: %w", err)
	}
	dir := filepath.Join(homeDir, branchesDir)

	// Create directory if it doesn't exist
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create branches directory: %w", err)
	}

	return dir, nil
}

// NewConversationTree creates a new conversation tree
func NewConversationTree() *ConversationTree {
	now := time.Now()
	rootBranch := &Branch{
		ID:          fmt.Sprintf("branch_%d", now.Unix()),
		Name:        "main",
		Description: "Main conversation branch",
		Checkpoints: []Checkpoint{},
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	return &ConversationTree{
		RootBranch:    rootBranch,
		Branches:      map[string]*Branch{rootBranch.ID: rootBranch},
		CurrentBranch: rootBranch.ID,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// CreateCheckpoint creates a new checkpoint in the current branch
func (ct *ConversationTree) CreateCheckpoint(name, description string, messages []ChatMessage) (*Checkpoint, error) {
	branch, exists := ct.Branches[ct.CurrentBranch]
	if !exists {
		return nil, fmt.Errorf("current branch not found")
	}

	now := time.Now()
	checkpoint := Checkpoint{
		ID:          fmt.Sprintf("checkpoint_%d", now.UnixNano()),
		Name:        name,
		Description: description,
		Messages:    messages,
		CreatedAt:   now,
	}

	branch.Checkpoints = append(branch.Checkpoints, checkpoint)
	branch.UpdatedAt = now
	ct.UpdatedAt = now

	return &checkpoint, nil
}

// CreateBranch creates a new branch from a checkpoint
func (ct *ConversationTree) CreateBranch(fromCheckpoint string, name, description string) (*Branch, error) {
	// Find the checkpoint
	var sourceCheckpoint *Checkpoint
	for _, branch := range ct.Branches {
		for _, cp := range branch.Checkpoints {
			if cp.ID == fromCheckpoint {
				sourceCheckpoint = &cp
				break
			}
		}
		if sourceCheckpoint != nil {
			break
		}
	}

	if sourceCheckpoint == nil {
		return nil, fmt.Errorf("checkpoint not found: %s", fromCheckpoint)
	}

	now := time.Now()
	newBranch := &Branch{
		ID:          fmt.Sprintf("branch_%d", now.UnixNano()),
		Name:        name,
		Description: description,
		Checkpoints: []Checkpoint{
			{
				ID:          fmt.Sprintf("checkpoint_%d", now.UnixNano()),
				Name:        "Branch start",
				Description: fmt.Sprintf("Branched from checkpoint '%s'", sourceCheckpoint.Name),
				Messages:    sourceCheckpoint.Messages,
				CreatedAt:   now,
				BranchFrom:  fromCheckpoint,
			},
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	ct.Branches[newBranch.ID] = newBranch
	ct.UpdatedAt = now

	return newBranch, nil
}

// SwitchBranch switches to a different branch
func (ct *ConversationTree) SwitchBranch(branchID string) error {
	if _, exists := ct.Branches[branchID]; !exists {
		return fmt.Errorf("branch not found: %s", branchID)
	}
	ct.CurrentBranch = branchID
	ct.UpdatedAt = time.Now()
	return nil
}

// GetCurrentBranch returns the current branch
func (ct *ConversationTree) GetCurrentBranch() *Branch {
	return ct.Branches[ct.CurrentBranch]
}

// LoadFromCheckpoint loads messages from a specific checkpoint
func (ct *ConversationTree) LoadFromCheckpoint(checkpointID string) ([]ChatMessage, error) {
	for _, branch := range ct.Branches {
		for _, cp := range branch.Checkpoints {
			if cp.ID == checkpointID {
				return cp.Messages, nil
			}
		}
	}
	return nil, fmt.Errorf("checkpoint not found: %s", checkpointID)
}

// ListCheckpoints returns all checkpoints across all branches
func (ct *ConversationTree) ListCheckpoints() []Checkpoint {
	var checkpoints []Checkpoint
	for _, branch := range ct.Branches {
		checkpoints = append(checkpoints, branch.Checkpoints...)
	}
	// Sort by creation time, newest first
	sort.Slice(checkpoints, func(i, j int) bool {
		return checkpoints[i].CreatedAt.After(checkpoints[j].CreatedAt)
	})
	return checkpoints
}

// SaveTree saves the conversation tree to a file
func SaveTree(tree *ConversationTree, filename string) error {
	branchDir, err := GetBranchesDir()
	if err != nil {
		return err
	}

	// Use provided filename or generate one
	if filename == "" {
		filename = fmt.Sprintf("tree_%s.json", time.Now().Format("2006-01-02_15-04-05"))
	}
	
	filePath := filepath.Join(branchDir, filename)

	data, err := json.MarshalIndent(tree, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal conversation tree: %w", err)
	}

	if err := os.WriteFile(filePath, data, filePermissions); err != nil {
		return fmt.Errorf("failed to write tree file: %w", err)
	}

	return nil
}

// LoadTree loads a conversation tree from a file
func LoadTree(filename string) (*ConversationTree, error) {
	branchDir, err := GetBranchesDir()
	if err != nil {
		return nil, err
	}

	filePath := filepath.Join(branchDir, filename)
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read tree file: %w", err)
	}

	var tree ConversationTree
	if err := json.Unmarshal(data, &tree); err != nil {
		return nil, fmt.Errorf("failed to parse tree file: %w", err)
	}

	return &tree, nil
}

// ListTrees returns a list of saved conversation trees
func ListTrees() ([]string, error) {
	branchDir, err := GetBranchesDir()
	if err != nil {
		return nil, err
	}

	files, err := os.ReadDir(branchDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read branches directory: %w", err)
	}

	var treeFiles []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".json") && strings.HasPrefix(file.Name(), "tree_") {
			treeFiles = append(treeFiles, file.Name())
		}
	}

	return treeFiles, nil
}

// GenerateCheckpointName creates a descriptive checkpoint name from the last few messages
func GenerateCheckpointName(messages []ChatMessage) string {
	if len(messages) == 0 {
		return "Empty checkpoint"
	}

	// Get the last user message
	var lastUserMsg string
	for i := len(messages) - 1; i >= 0; i-- {
		if messages[i].Role == "user" {
			lastUserMsg = messages[i].Content
			break
		}
	}

	if lastUserMsg == "" {
		return fmt.Sprintf("Checkpoint at %s", time.Now().Format("15:04"))
	}

	// Truncate to reasonable length
	if len(lastUserMsg) > 50 {
		lastUserMsg = lastUserMsg[:47] + "..."
	}

	return lastUserMsg
}