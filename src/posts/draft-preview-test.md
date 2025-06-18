---
author: Jonathan Haas
pubDate: 2025-06-20
title: "Testing Draft Preview Feature"
description: "This is a draft post to test the new preview link generation feature"
featured: false
draft: true
tags:
  - testing
  - features
  - development
image:
  url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3'
  alt: 'A laptop showing code on the screen'
---

## This is a Draft Post

This post is marked as a draft and should only be visible with a valid preview token.

### Testing Preview Features

1. **Token Generation**: Secure tokens with expiration
2. **Preview Mode**: Visual indicators when viewing drafts
3. **Access Control**: Only accessible with valid tokens

### How It Works

When you generate a preview link:
- A secure token is created with your chosen expiration time
- The token includes the post slug and expiration timestamp
- The token is validated on each request

This allows you to share draft posts with reviewers before publishing!

### Benefits

- 🔒 Secure sharing of unpublished content
- ⏰ Time-limited access
- 👀 Clear visual indicators for preview mode
- 🔗 Easy link generation and sharing