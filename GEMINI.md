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

### `gemini:generate-image`

**Action:** Generates a new OpenGraph image for a blog post.

*   **Workflow:**
    1.  Reads the blog post's title and description.
    2.  Uses the Google AI API to generate a descriptive prompt for a text-to-image model.
    3.  Calls a text-to-image API to generate the image.
    4.  Saves the generated image to the `public/generated` directory.
    5.  Updates the blog post's frontmatter to include the new image's URL.

*   **Example:** `gemini:generate-image "two-minds-in-the-machine-onboarding-into-a-project-with-an-existing-ai-agent"`

### `gemini:propose-titles "topic"`

**Action:** Generates a list of 5-10 alternative, SEO-friendly titles for a given blog post topic.

*   **Workflow:**
    1.  Takes a blog post topic as input.
    2.  Uses the Google AI API to generate 5-10 alternative titles.
    3.  The titles will be SEO-friendly and under 60 characters.
    4.  Outputs the titles for you to review and use.

*   **Example:** `gemini:propose-titles "The pros and cons of using WebAssembly in a React project"`

### `gemini:suggest-tags "post-slug"`

**Action:** Reads a published post and suggests relevant tags.

*   **Workflow:**
    1.  Reads the content of the specified blog post.
    2.  Uses the Google AI API to generate 5-10 relevant tags.
    3.  Outputs the tags for you to review and use.

*   **Example:** `gemini:suggest-tags "two-minds-in-the-machine-onboarding-into-a-project-with-an-existing-ai-agent"`

### `gemini:write-blog-post "topic"`

**Action:** Researches a given topic, creates a new, well-structured blog post draft, and then writes the blog post.

*   **Workflow:**
    1.  Uses the `gemini:new-draft` command to create a new blog post draft.
    2.  Reads the content of the newly created draft.
    3.  Uses the Google AI API to write the blog post based on the draft's outline.
    4.  Writes the generated content back to the file.
    5.  Creates a new branch, commits the changes, and creates a pull request.

*   **Example:** `gemini:write-blog-post "The Orchestration Dance: Lessons from Working with Multiple AI Agents"`

### Git Workflow

When creating pull requests, use the `gh` CLI. For example:

`gh pr create --title "feat: add new feature" --body "This PR adds a new feature that does x, y, and z."`
