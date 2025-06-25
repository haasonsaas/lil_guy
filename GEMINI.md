# Gemini Agent Workflow & Commands

This document outlines the capabilities and commands for the Gemini coding agent in this repository.

## Production Application Guidelines

### CRITICAL: No Mock Data Policy

**THIS IS A REAL PRODUCTION APPLICATION - MOCK DATA IS NEVER ALLOWED**

- **NEVER return mock data, fake responses, or placeholder content**
- All AI scripts must make real API calls to actual AI services
- All analysis functions must return real data from actual processing
- Mock data violates production application requirements
- If an API call fails, handle the error properly rather than returning fake data
- All outputs must be genuine results from the AI models

### Implementation Requirements

- Use real API endpoints (Google Gemini AI API)
- Parse actual AI responses, not simulated outputs
- Handle API errors gracefully with proper error messages
- Cache real responses, never fake data
- All scoring and analysis must be based on actual AI evaluation

## Primary Goal

To assist in the creation, maintenance, and quality assurance of the blog content and platform, acting as a collaborative partner in the development process.

## Available Commands

You can invoke the agent's capabilities by using the following commands in your prompts:

### `gemini:new-draft "topic"`

**Action:** Researches a given topic and creates a new, well-structured blog post draft in `src/posts/`.

- **Workflow:**
  1.  Performs a brief web search to gather key points and current information on the topic.
  2.  Analyzes the structure of recent, high-quality posts in the repository.
  3.  Generates a new post with a title, description, tags, and a detailed outline (including introduction, main sections, and conclusion).
  4.  Uses the existing `new-post.ts` script to create the file, ensuring it adheres to project conventions.

- **Example:** `gemini:new-draft "The pros and cons of using WebAssembly in a React project"`

### `gemini:social "post-slug"`

**Action:** Reads a published post and generates social media snippets for promotion.

- **Workflow:**
  1.  Reads the content of the specified blog post.
  2.  Generates a concise summary.
  3.  Creates 2-3 distinct promotional snippets suitable for platforms like Twitter/X and LinkedIn, including relevant hashtags.
  4.  Outputs the snippets for you to review and use.

- **Example:** `gemini:social "two-minds-in-the-machine-onboarding-into-a-project-with-an-existing-ai-agent"`

### `gemini:audit`

**Action:** Performs a comprehensive quality audit on all staged markdown files.

- **Workflow:**
  1.  Identifies all staged `.md` files.
  2.  Runs the project's existing quality checks against them (`lint:md`, `spell`, `validate:seo`).
  3.  Provides a consolidated report of any errors or warnings.
  4.  If possible, suggests and applies fixes for any issues found.

- **Example:** `gemini:audit`

### `gemini:improve`

**Action:** Reads a staged markdown file and improves its content.

- **Workflow:**
  1.  Identifies all staged `.md` files.
  2.  For each file, it reads the content and sends it to the Google AI API with a prompt to improve the writing.
  3.  The prompt will ask the AI to fix grammar and spelling, improve clarity and flow, and suggest better word choices.
  4.  The improved content will be written back to the file.

- **Example:** `gemini:improve`

### `gemini:generate-image`

**Action:** Generates a new OpenGraph image for a blog post.

- **Workflow:**
  1.  Reads the blog post's title and description.
  2.  Uses the Google AI API to generate a descriptive prompt for a text-to-image model.
  3.  Calls a text-to-image API to generate the image.
  4.  Saves the generated image to the `public/generated` directory.
  5.  Updates the blog post's frontmatter to include the new image's URL.

- **Example:** `gemini:generate-image "two-minds-in-the-machine-onboarding-into-a-project-with-an-existing-ai-agent"`

### `gemini:propose-titles "topic"`

**Action:** Generates a list of 5-10 alternative, SEO-friendly titles for a given blog post topic.

- **Workflow:**
  1.  Takes a blog post topic as input.
  2.  Uses the Google AI API to generate 5-10 alternative titles.
  3.  The titles will be SEO-friendly and under 60 characters.
  4.  Outputs the titles for you to review and use.

- **Example:** `gemini:propose-titles "The pros and cons of using WebAssembly in a React project"`

### `gemini:suggest-tags "post-slug"`

**Action:** Reads a published post and suggests relevant tags.

- **Workflow:**
  1.  Reads the content of the specified blog post.
  2.  Uses the Google AI API to generate 5-10 relevant tags.
  3.  Outputs the tags for you to review and use.

- **Example:** `gemini:suggest-tags "two-minds-in-the-machine-onboarding-into-a-project-with-an-existing-ai-agent"`

### `gemini:write-blog-post "topic"`

**Action:** Researches a given topic, creates a new, well-structured blog post draft, and then writes the blog post.

- **Workflow:**
  1.  Uses the `gemini:new-draft` command to create a new blog post draft.
  2.  Reads the content of the newly created draft.
  3.  Uses the Google AI API to write the blog post based on the draft's outline.
  4.  Writes the generated content back to the file.
  5.  Creates a new branch, commits the changes, and creates a pull request.

- **Example:** `gemini:write-blog-post "The Orchestration Dance: Lessons from Working with Multiple AI Agents"`

### Git Workflow

When creating pull requests, use the `gh` CLI. For example:

`gh pr create --title "feat: add new feature" --body "This PR adds a new feature that does x, y, and z."`

### Pull Request Workflow

When merging a pull request, the agent should follow these steps:

1.  **Checkout the PR:** Use `gh pr checkout <pr-number>` to switch to the PR's branch.
2.  **Resolve Conflicts (if any):** If there are merge conflicts, resolve them and push the changes.
3.  **Merge the PR:** Use `gh pr merge <pr-number> --merge` to merge the pull request.
4.  **Switch to Main:** Use `git checkout main` to switch back to the main branch.
5.  **Pull Latest Changes:** Use `git pull` to update the local main branch.
6.  **Delete Local Branch:** Use `git branch -d <branch-name>` to delete the local feature branch.

### Autonomous Workflow

This workflow outlines the process Gemini should follow to autonomously propose and implement new features or improvements.

**Phase 1: Autonomous Goal Identification & Planning**

- **Step 1: Propose High-Level Goal.** Based on its analysis of the project, Gemini should identify and propose a high-level strategic goal (e.g., "Improve Site Performance," "Enhance Content Discovery").
- **Step 2: Analyze Current State.** Upon user approval of the goal, Gemini should conduct a thorough analysis of the relevant codebase to understand the current implementation and identify specific areas for improvement.
- **Step 3: Formulate Detailed Plan.** Gemini should create a detailed, step-by-step plan outlining the specific changes, new components, and the expected outcome.
- **Step 4: Present Plan for Approval.** Gemini should present this detailed plan to the user for feedback and final approval before writing any code.

**Phase 2: Autonomous Implementation & Verification**

- **Step 5: Implement Changes.** Once the plan is approved, Gemini should execute the plan by writing and modifying the necessary code and files.
- **Step 6: Run Local Verification Suite.** After implementation, Gemini should run all relevant local checks, including linting, spell-checking, SEO validation, and any applicable tests. Gemini must autonomously fix any issues that arise until all checks pass.
- **Step 7: Commit Changes.** Once all local checks pass, Gemini should commit the changes to the local `main` branch with a clear, conventional commit message.

**Phase 3: Manual Review & Deployment**

- **Step 8: Request Manual Review (CRITICAL STOP).** After committing the changes locally, Gemini must stop all further action. Gemini will notify the user that the work is complete and ready for their review. **Gemini will not proceed without explicit user approval.**
- **Step 9: Await User Approval.** Gemini will wait for the user to manually review the local commit and provide their explicit approval to proceed.
- **Step 10: Push to Main.** Once Gemini receives user approval, it will push the committed changes to the remote `main` branch.

### Blog Post Creation Workflow

### Autonomous Workflow

This workflow outlines the process for the agent to autonomously propose and implement new features or improvements.

**Phase 1: Autonomous Goal Identification & Planning**

- **Step 1: Propose High-Level Goal.** Based on my analysis of the project, I will identify and propose a high-level strategic goal (e.g., "Improve Site Performance," "Enhance Content Discovery").
- **Step 2: Analyze Current State.** Upon your approval of the goal, I will conduct a thorough analysis of the relevant codebase to understand the current implementation and identify specific areas for improvement.
- **Step 3: Formulate Detailed Plan.** I will create a detailed, step-by-step plan outlining the specific changes, new components, and the expected outcome.
- **Step 4: Present Plan for Approval.** I will present this detailed plan to you for feedback and final approval before any code is written.

**Phase 2: Autonomous Implementation & Verification**

- **Step 5: Implement Changes.** Once the plan is approved, I will execute the plan by writing and modifying the necessary code and files.
- **Step 6: Run Local Verification Suite.** After implementation, I will run all relevant local checks, including linting, spell-checking, SEO validation, and any applicable tests. I will autonomously fix any issues that arise until all checks pass.
- **Step 7: Commit Changes.** Once all local checks pass, I will commit the changes to the local `main` branch with a clear, conventional commit message.

**Phase 3: Manual Review & Deployment**

- **Step 8: Request Manual Review (CRITICAL STOP).** After committing the changes locally, I will stop all further action. I will notify you that the work is complete and ready for your review. **I will not proceed without your explicit approval.**
- **Step 9: Await User Approval.** I will wait for you to manually review the local commit and provide your explicit approval to proceed.
- **Step 10: Push to Main.** Once I receive your approval, I will push the committed changes to the remote `main` branch.

When asked to write a new blog post on a given topic, the agent should follow these steps:

1.  **Create the Draft:** Use the `gemini:new-draft "topic"` command to generate a structured outline, title, and tags.
2.  **Read the Draft:** Use the `read_file` tool to read the content of the newly created draft file.
3.  **Write the Full Post:** Based on the outline and topic, write a complete blog post, adhering to the style guidelines.
4.  **Save the Post:** Use the `write_file` tool to save the full content back to the markdown file.
5.  **Create a Branch:** Use `git checkout -b feat/blog-post-<slug>` to create a new branch for the post.
6.  **Commit the Changes:** Use `git add` and `git commit` to commit the new post with a conventional commit message (e.g., `feat: add blog post on 'topic'`).
7.  **Push to Remote:** Use `git push` to push the new branch to the remote repository.
8.  **Open a Pull Request:** Use the `gh pr create` command to open a new pull request for review.
