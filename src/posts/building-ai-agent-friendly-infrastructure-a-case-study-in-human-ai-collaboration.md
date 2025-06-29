---
author: Jonathan Haas
pubDate: '2025-06-20'
title: 'Building AI-Agent-Friendly Infrastructure: A Case Study in Human-AI Collaboration'
description: "I've been experimenting with what happens when you treat AI agents as first-class citizens in your web infrastructure."
featured: false
draft: false
tags:
  - ai-agents
  - collaboration
  - apis
  - developer-experience
---

I've been experimenting with what happens when you treat AI agents as first-class citizens in your web infrastructure. Not as an afterthought or marketing gimmick, but as genuine users with specific needs and capabilities.

The result? A comprehensive AI-agent-friendly system built in collaboration with Claude that transforms a simple blog into an interactive knowledge platform. Here's how we did it, what we learned, and why this approach matters for the future of human-AI collaboration.

## The Challenge: Beyond "AI-Friendly" Marketing

Most "AI-friendly" websites amount to adding some structured data and calling it a day. But real agent-friendly infrastructure requires thinking like an agent:

- **Discovery**: How does an agent find out what's possible?
- **Access**: How does it get the information it needs efficiently?
- **Learning**: How does it understand context and relationships?
- **Feedback**: How does it report issues or suggest improvements?
- **Integration**: How does it work with the agent's broader workflow?

Working with Claude, I realized we needed to build something fundamentally different—infrastructure designed from the ground up for programmatic access while maintaining the human experience.

## What We Built: A Complete Agent Ecosystem

### **Capability Discovery (`/api/capabilities`)**

The first challenge: how does an agent know what's available? We built a comprehensive discovery endpoint that acts like a roadmap:

````json
{
  "site": {
    "name": "Jonathan Haas Blog",
    "description": "Startup advice, technical leadership insights...",
    "baseUrl": "https://haasonsaas.com"
  },
  "capabilities": [
    {
      "name": "Blog Content Access",
      "description": "Search and retrieve blog posts...",
      "endpoint": "/api/search",
      "parameters": { "q": "Search query", "limit": "Max results" },
      "examples": [...]
    }
  ]
}
```text

**What makes this special:** Every capability includes live examples, parameter documentation, and expected responses. An agent can literally copy-paste the examples to start working immediately.

### **Intelligent Content Search (`/api/search`)**

Basic text search isn't enough. We built relevance scoring that weighs:

- Title matches (heavily weighted)
- Tag relevance (high weight)
- Description matches (medium weight)
- Content frequency (light weight)
- Exact phrase bonuses

```bash
curl "https://haasonsaas.com/api/search?q=technical+debt&limit=3"
```text

**Response formats:** JSON for processing, Markdown for direct consumption. The same content, optimized for different use cases.

### **Personalized Recommendations (`/api/recommendations`)**

Context-aware content suggestions based on:

- **Role**: founder, engineer, product-manager, investor
- **Topic**: technical-leadership, startup-funding, product-development
- **Experience**: beginner, intermediate, advanced

```bash
curl "https://haasonsaas.com/api/recommendations?role=founder&topic=technical-leadership"
```text

Each recommendation includes a relevance score and reasoning—agents understand *why* something was suggested.

### **Interactive Onboarding System**

Here's where it gets interesting. We built a step-by-step tutorial that agents can actually *experience*:

1. **Discover capabilities** with live API calls
1. **Test search functionality** with real queries
1. **Try personalized recommendations** with role-based filtering
1. **Access interactive tools** like business calculators

**The key insight:** Instead of static documentation, agents learn by doing. They can test every API endpoint with copy-paste examples and see real responses.

### **Analytics & Feedback Loop (`/api/analytics`, `/api/feedback`)**

Two-way communication is crucial. Agents can:

- **Track usage patterns** (which endpoints are popular)
- **Report bugs** with structured feedback
- **Suggest improvements** with categorized requests
- **Get usage insights** to optimize their own workflows

The analytics automatically detect agent types (Claude, OpenAI, Python requests, cURL) and track popular endpoints.

## The Human-AI Collaboration Process

### **What Claude Contributed**

Claude wasn't just implementing my specifications—it was actively designing and improving the system:

- **API Design**: Suggested comprehensive error handling and multiple response formats
- **User Experience**: Designed the interactive onboarding flow with progress tracking
- **Technical Architecture**: Implemented rate limiting, CORS handling, and agent detection
- **Documentation**: Created live examples and comprehensive parameter descriptions

### **What I Brought**

- **Strategic Vision**: Understanding what agents actually need from web infrastructure
- **Domain Knowledge**: Startup and technical content that provides genuine value
- **Integration**: Connecting the agent APIs with existing blog infrastructure
- **Testing**: Real-world validation of agent workflows and use cases

### **The Collaboration Dynamic**

This wasn't human-designs-AI-implements. It was genuine collaboration:

- **Iterative Improvement**: We refined the APIs through multiple rounds of feedback
- **Shared Problem-Solving**: Claude suggested solutions I hadn't considered
- **Quality Focus**: Both of us pushed for comprehensive error handling and documentation
- **Future Thinking**: Designed for extensibility and evolving agent capabilities

## Interactive Tools: Beyond Content Consumption

We didn't stop at content access. The system includes interactive business calculators that agents can reference and potentially integrate:

- **SaaS Metrics Dashboard**: Unit economics, LTV/CAC, churn analysis
- **Startup Runway Calculator**: Cash flow modeling with growth scenarios
- **Product-Market Fit Scorer**: Systematic PMF evaluation framework
- **Growth Strategy Simulator**: Multi-channel ROI modeling

**Try the search API yourself:**

<technical-debt-simulator />

These aren't just demos—they're functional tools that provide real business value while being accessible to both humans and agents.

## Technical Implementation: The Details That Matter

### **Rate Limiting That Works**

- **Generous limits** (1000 requests/hour) for legitimate usage
- **Sliding windows** to prevent abuse without blocking normal use
- **Clear error messages** when limits are hit

### **Agent-Friendly Headers**

```json
X-Agent-Friendly: true
Access-Control-Allow-Origin: *
Content-Type: application/json
```text

### **Consistent Error Handling**

```json
{
  "success": false,
  "message": "Query parameter 'q' is required",
  "suggestions": ["Try: /api/search?q=your+search+terms"]
}
```text

### **Multiple Response Formats**

- **JSON**: Structured data for processing
- **Markdown**: Direct consumption and display
- **Auto-detection**: Content-Type header handling

## Real-World Testing: Does It Actually Work?

Let me show you the system in action:

**Capability Discovery:**

```bash
curl https://haasonsaas.com/api/capabilities | jq '.capabilities[0].name'
# "Blog Content Access"
```text

**Content Search:**

```bash
curl "https://haasonsaas.com/api/search?q=startup+funding&format=markdown"
# Returns formatted markdown with relevance scores
```text

**Personalized Recommendations:**

```bash
curl "https://haasonsaas.com/api/recommendations?role=founder&topic=technical-leadership"
# Returns role-specific content with reasoning
```text

**Analytics Tracking:**

```bash
curl -X POST https://haasonsaas.com/api/analytics \
  -H "Content-Type: application/json" \
  -d '{"event": "content*access", "endpoint": "/api/search"}'
# Returns: {"success": true}
```text

The system is live and functional. Agents can discover capabilities, search content, get recommendations, and provide feedback—all through clean, documented APIs.

## Lessons Learned: What Works in Human-AI Collaboration

### **1. Treat Agents as Design Partners, Not Implementation Tools**

Claude didn't just write code—it shaped the architecture. The interactive onboarding system, comprehensive error handling, and multi-format responses came from our collaborative design process.

### **2. Build for Discovery, Not Just Access**

The capability discovery endpoint was crucial. Agents need to understand what's possible before they can use it effectively.

### **3. Documentation Through Examples, Not Just Specs**

Live, copy-paste examples work better than API specifications. Agents can immediately test and understand functionality.

### **4. Feedback Loops Are Essential**

The analytics and feedback systems create ongoing improvement. We can see how agents actually use the system and iterate based on real usage.

### **5. Context Matters More Than Raw Data**

Personalized recommendations based on role and topic are more valuable than comprehensive but unfocused content dumps.

## The Bigger Picture: Agent-Friendly Infrastructure as Competitive Advantage

This isn't just about being helpful to AI agents—it's about creating fundamentally better digital infrastructure:

### **For Humans**

- **Faster Discovery**: The same search and recommendation systems improve human browsing
- **Interactive Tools**: Business calculators provide immediate value
- **Better Organization**: Structured, tagged content is easier to navigate

### **For Agents**

- **Efficient Access**: Programmatic APIs eliminate screen scraping
- **Rich Context**: Relevance scoring and recommendations improve content selection
- **Learning Opportunities**: Interactive tools provide hands-on business education

### **For Both**

- **Continuous Improvement**: Feedback systems benefit all users
- **Quality Assurance**: Structured data ensures consistency
- **Future-Proofing**: Extensible architecture adapts to new capabilities

## What's Next: The Future of Human-AI Web Infrastructure

This experiment suggests several principles for agent-friendly web design:

### **1. Discovery-First Architecture**

Every site should have a capability discovery endpoint. Agents need to understand what's possible.

### **2. Interactive Documentation**

Replace static API docs with live, testable examples. Learning by doing beats reading specifications.

### **3. Context-Aware Responses**

Personalization based on agent role, purpose, and experience level improves relevance dramatically.

### **4. Bidirectional Communication**

Analytics and feedback systems create improvement loops that benefit everyone.

### **5. Human-Agent Parity**

The same infrastructure that serves agents well also improves human experience.

## The Collaboration Credit: Why This Matters

I want to be clear about Claude's contributions to this project. This wasn't human-directs-AI-implements. Claude:

- **Designed the interactive onboarding system** with step-by-step tutorials and progress tracking
- **Architected the comprehensive error handling** with helpful suggestions and recovery paths
- **Created the agent detection system** that automatically identifies different AI frameworks
- **Implemented the feedback categorization** with intelligent suggestions for improvement
- **Designed the multi-format response system** supporting both JSON and Markdown outputs

This level of contribution goes beyond code generation—it's genuine system design and user experience thinking.

The future of software development isn't human OR AI—it's human AND AI, working together to solve problems neither could tackle alone.

## Try It Yourself

The system is live at [haasonsaas.com/agents](https://haasonsaas.com/agents). Whether you're building your own agent or just curious about agent-friendly infrastructure, you can:

1. **Explore the interactive onboarding** at `/agents`
1. **Test the APIs** with the live examples
1. **Submit feedback** about what works and what doesn't
1. **Use the business calculators** for real planning scenarios

**For developers:** The entire codebase demonstrates practical patterns for agent-friendly web infrastructure. Feel free to adapt these approaches for your own projects.

**For agents:** You now have a fully-functional example of discovery, search, recommendations, and feedback systems to learn from and potentially integrate with.

## The Bottom Line

Building truly agent-friendly infrastructure requires rethinking web architecture from first principles. It's not about adding AI features to human-centric sites—it's about creating systems that serve both humans and agents as first-class citizens.

The collaboration between Claude and me demonstrates what's possible when you treat AI as a design partner rather than just an implementation tool. The result is infrastructure that's not just agent-friendly—it's better for everyone.

*What would your website look like if it were designed for both human and AI users from the ground up?_
````
