# Gemini Agent Workflow & Commands

This document outlines the capabilities and commands for the Gemini coding agent in this repository.

## Primary Goal

To assist in the creation, maintenance, and quality assurance of the blog content and platform, acting as a collaborative partner in the development process.

## Available Commands

You can invoke the agent's capabilities by using the following commands in your prompts:

### `gemini:new-draft "topic"`

**Action:** Researches a given topic and creates a new, well-structured blog post draft in `src/posts/`.

*   **Workflow:**
    1.  Performs a brief web search to gather key points and current information on the topic.
    2.  Analyzes the structure of recent, high-quality posts in the repository.
    3.  Generates a new post with a title, description, tags, and a detailed outline (including introduction, main sections, and conclusion).
    4.  Uses the existing `new-post.ts` script to create the file, ensuring it adheres to project conventions.

*   **Example:** `gemini:new-draft "The pros and cons of using WebAssembly in a React project"`

### `gemini:social "post-slug"`

**Action:** Reads a published post and generates social media snippets for promotion.

*   **Workflow:**
    1.  Reads the content of the specified blog post.
    2.  Generates a concise summary.
    3.  Creates 2-3 distinct promotional snippets suitable for platforms like Twitter/X and LinkedIn, including relevant hashtags.
    4.  Outputs the snippets for you to review and use.

*   **Example:** `gemini:social "two-minds-in-the-machine-onboarding-into-a-project-with-an-existing-ai-agent"`

### `gemini:audit`

**Action:** Performs a comprehensive quality audit on all staged markdown files.

*   **Workflow:**
    1.  Identifies all staged `.md` files.
    2.  Runs the project's existing quality checks against them (`lint:md`, `spell`, `validate:seo`).
    3.  Provides a consolidated report of any errors or warnings.
    4.  If possible, suggests and applies fixes for any issues found.

*   **Example:** `gemini:audit`

### `gemini:improve`

**Action:** Reads a staged markdown file and improves its content.

*   **Workflow:**
    1.  Identifies all staged `.md` files.
    2.  For each file, it reads the content and sends it to the Google AI API with a prompt to improve the writing.
    3.  The prompt will ask the AI to fix grammar and spelling, improve clarity and flow, and suggest better word choices.
    4.  The improved content will be written back to the file.

*   **Example:** `gemini:improve`
