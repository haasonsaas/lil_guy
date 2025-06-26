# Automated Blog Generation Pipeline

This system provides fully automated blog post generation using GitHub Actions, AI content generation, and quality validation.

## 🚀 Overview

The automated blogging pipeline:

- **Generates topics** using content analysis and strategic frameworks
- **Creates full blog posts** using your refined AI prompts
- **Validates quality** with word count, structure, and content checks
- **Publishes automatically** 70% of the time (30% go to draft for review)
- **Runs 3 times daily** (9 AM, 1 PM, and 6 PM PST)
- **Fails gracefully** with issue creation and notifications

## 📋 Setup Instructions

### 1. Environment Variables

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

```bash
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

### 2. Enable the Workflow

The workflow is located at `.github/workflows/auto-blog-generation.yml` and runs:

- **Scheduled**: 3 times daily at 9 AM, 1 PM, and 6 PM PST
- **Manual**: Via GitHub Actions UI with optional topic override

### 3. Test Locally

Before enabling automation, test the pipeline locally:

```bash
# Test with dry run (no files created)
bun scripts/test-auto-blog.ts -d

# Test with auto-generated topic
bun scripts/test-auto-blog.ts

# Test with specific topic
bun scripts/test-auto-blog.ts -t "Your Custom Topic"
```

## 🔧 Configuration

### Content Generation Settings

The system uses several intelligent strategies:

**Topic Categories:**

- AI and automation challenges
- Startup funding and growth
- Engineering leadership
- Product management insights
- Security and developer tools
- Technical architecture decisions
- Remote work and team culture
- Contrarian takes on popular advice

**Quality Thresholds:**

- **Word Count**: 800-2000 words
- **Structure**: Must include `##` and `###` headings
- **Content**: No placeholder text or TODOs
- **Freshness**: Avoids topics from last 10 posts

**Publishing Logic:**

- **70% auto-publish**: Posts go live immediately
- **30% draft**: Held for manual review
- **Force publish**: Available via manual trigger

### Scheduling

```yaml
# Current schedule (3 times daily)
- cron: '0 17 * * *' # 9 AM PST
- cron: '0 21 * * *' # 1 PM PST
- cron: '0 2 * * *' # 6 PM PST

# Alternative schedules:
# Daily once: '0 17 * * *'
# Weekly: '0 17 * * 1'
# Twice weekly: '0 17 * * 2,5'
```

## 🎯 Quality Assurance

The pipeline includes multiple quality gates:

### 1. Pre-Generation Validation

- ✅ API keys and environment
- ✅ Required scripts exist
- ✅ Recent posts analysis for freshness

### 2. Content Generation

- ✅ Topic generation with variety
- ✅ Full post creation using refined prompts
- ✅ Proper frontmatter and metadata

### 3. Post-Generation Validation

- ✅ Word count within range (800-2000)
- ✅ Proper heading structure
- ✅ No placeholder content
- ✅ Linting and type checking
- ✅ Image generation

### 4. Publishing Decision

- ✅ Quality score calculation
- ✅ Automated publish vs. draft logic
- ✅ Git commit with proper formatting

## 📊 Monitoring & Alerts

### Success Monitoring

- **Commit messages**: Include generation timestamp and metadata
- **Blog deployment**: Triggers automatic Cloudflare deployment
- **Analytics**: Track automated vs. manual post performance

### Failure Handling

- **Automatic issue creation** on workflow failure
- **Detailed error logs** in GitHub Actions
- **Email notifications** (if configured)
- **Retry logic** for transient failures

### Example Success Commit:

```
feat: auto-generate blog post

🤖 Generated with automated blog pipeline
📅 Scheduled: 2024-01-15 17:00 UTC

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 🛠️ Maintenance

### Weekly Tasks

- Review draft posts that weren't auto-published
- Check generated post performance vs. manual posts
- Monitor API usage and costs

### Monthly Tasks

- Analyze topic variety and freshness
- Update content categories based on performance
- Review and tune quality thresholds

### Quarterly Tasks

- Evaluate automation success rate
- Refine prompts based on content quality
- Update scheduling based on audience engagement

## 🚨 Troubleshooting

### Common Issues

**"No valid JSON in response"**

```bash
# Check API key and test manually
bun scripts/gemini.ts new-draft "Test Topic"
```

**"Quality validation failed"**

```bash
# Run quality checks on recent posts
bun scripts/test-auto-blog.ts -d
```

**"Git push failed"**

- Check GitHub token permissions
- Verify main branch protection rules allow Actions

### Manual Intervention

If automation creates low-quality content:

```bash
# Disable workflow temporarily
gh workflow disable auto-blog-generation.yml

# Test improvements locally
bun scripts/test-auto-blog.ts

# Re-enable when ready
gh workflow enable auto-blog-generation.yml
```

## 📈 Performance Metrics

Track these KPIs to measure automation success:

- **Generation Success Rate**: Target 95%+
- **Quality Score**: Target 80%+ average
- **Publishing Rate**: Currently 70% auto-publish
- **Content Variety**: Track topic category distribution
- **Engagement**: Compare automated vs. manual post performance

## 🔮 Future Enhancements

Potential improvements to consider:

1. **Dynamic Scheduling**: Adjust frequency based on engagement
2. **A/B Testing**: Test different publishing times
3. **Audience Feedback**: Incorporate reader preferences
4. **Multi-Format**: Generate social media content alongside posts
5. **SEO Optimization**: Automatic keyword research and optimization
6. **Performance Learning**: Adapt topics based on analytics

## 🎪 Manual Override

You can always intervene in the process:

### Generate Specific Topic

```bash
# Via GitHub Actions UI
# Go to Actions > Automated Blog Generation > Run workflow
# Enter custom topic

# Via local testing
bun scripts/test-auto-blog.ts -t "Your Specific Topic"
```

### Force Publish

```bash
# Via GitHub Actions UI with force_publish: true

# Or manually publish a draft
bun run publish "post-slug" -c -p
```

### Emergency Stop

```bash
# Disable the workflow
gh workflow disable auto-blog-generation.yml
```

---

**Ready to go fully automated?** Run the test script first, then enable the workflow and watch your blog generate content while you sleep! 🚀
