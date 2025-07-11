package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

const (
	preferencesFileName = ".lil_guy_preferences.json"
	filePermissions      = 0644
)

// Preferences struct to store user preferences.
type Preferences struct {
	BuddyName     string `json:"buddy_name"`
	SystemMessage string `json:"system_message"`
	Model         string `json:"model"`
	Theme         string `json:"theme"`
	AutoSave      bool   `json:"auto_save"`
	Personality   string `json:"personality"`
	RetroTheme    string `json:"retro_theme"`
}

// GetPreferencesFilePath returns the absolute path to the preferences file.
func GetPreferencesFilePath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home directory: %w", err)
	}
	return filepath.Join(homeDir, preferencesFileName), nil
}

// LoadPreferences loads preferences from the preferences file.
func LoadPreferences() (*Preferences, error) {
	filePath, err := GetPreferencesFilePath()
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

// SavePreferences saves preferences to the preferences file.
func SavePreferences(prefs *Preferences) error {
	filePath, err := GetPreferencesFilePath()
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
