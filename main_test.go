package main

import (
	"os"
	"path/filepath"
	"testing"

	"lil_guy/internal/config"
)

func TestGetPreferencesFilePath(t *testing.T) {
	path, err := config.GetPreferencesFilePath()
	if err != nil {
		t.Fatalf("GetPreferencesFilePath() failed: %v", err)
	}

	if path == "" {
		t.Error("GetPreferencesFilePath() returned empty path")
	}

	if !filepath.IsAbs(path) {
		t.Errorf("GetPreferencesFilePath() returned non-absolute path: %s", path)
	}
}

func TestLoadPreferences_NonExistentFile(t *testing.T) {
	// Create a temporary directory for testing
	tmpDir := t.TempDir()

	// Temporarily change the home directory for testing
	originalHome := os.Getenv("HOME")
	defer os.Setenv("HOME", originalHome)
	os.Setenv("HOME", tmpDir)

	prefs, err := config.LoadPreferences()
	if err != nil {
		t.Fatalf("LoadPreferences() failed: %v", err)
	}

	if prefs == nil {
		t.Error("LoadPreferences() returned nil preferences")
	}

	// Should return empty preferences for non-existent file
	if prefs.BuddyName != "" || prefs.SystemMessage != "" {
		t.Errorf("LoadPreferences() returned non-empty preferences for non-existent file: %+v", prefs)
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
	testPrefs := &config.Preferences{
		BuddyName:     "TestBuddy",
		SystemMessage: "Test system message",
	}

	// Save preferences
	err := config.SavePreferences(testPrefs)
	if err != nil {
		t.Fatalf("SavePreferences() failed: %v", err)
	}

	// Load preferences
	loadedPrefs, err := config.LoadPreferences()
	if err != nil {
		t.Fatalf("LoadPreferences() failed: %v", err)
	}

	// Verify loaded preferences match saved ones
	if loadedPrefs.BuddyName != testPrefs.BuddyName {
		t.Errorf("BuddyName mismatch: got %s, want %s", loadedPrefs.BuddyName, testPrefs.BuddyName)
	}

	if loadedPrefs.SystemMessage != testPrefs.SystemMessage {
		t.Errorf("SystemMessage mismatch: got %s, want %s", loadedPrefs.SystemMessage, testPrefs.SystemMessage)
	}
}