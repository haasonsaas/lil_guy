---
author: Jonathan Haas
pubDate: '2024-04-11'
title: 'Building My UniFi Homelab: A Technical Deep Dive'
description: "After years of experimenting with various networking setups in my homelab, I've finally built out what I consider to be my ideal configuration."
tags:
  - engineering
  - technical
  - personal-growth
---

After years of experimenting with various networking setups in my homelab, I've
finally built out what I consider to be my ideal configuration. This post
details the technical aspects of my current build, focusing on the architecture
decisions, challenges encountered, and lessons learned along the way.

## Core Architecture

### Network Controller & Gateway

The Dream Machine Pro Max serves as my core network controller and gateway.
While it might seem excessive for home use, my requirements justified the
choice:

- Running multiple isolated VLANs for IoT, lab environment, and production
  services
- Supporting container-based services with high throughput requirements
- Managing multiple site-to-site VPNs for remote access
- Handling IPS/IDS for network security monitoring
- Supporting redundant storage for security footage retention

The ability to handle 10G throughput became essential when I started running
distributed storage systems and container orchestration across my lab
environment.

### Network Segmentation

My current VLAN structure:

````text
VLAN 10: Management (network devices, controllers)
VLAN 20: Lab Environment (kubernetes, storage clusters)
VLAN 30: IoT Devices
VLAN 40: Media Streaming
VLAN 50: Guest Network
VLAN 60: Security Systems
```text

Each VLAN has specific firewall rules and traffic policies to maintain security
while allowing necessary inter-VLAN routing.

### Physical Infrastructure

The network backbone consists of:

- Layer 3 Pro Max 24 PoE switch handling inter-VLAN routing
- U7 Pro Max AP for high-density wireless coverage
- Redundant power supplies for critical infrastructure
- 10G fiber interconnects between core components

The PoE budget becomes crucial when you're running:

- Multiple security cameras with continuous recording
- Environmental sensors
- Access points
- IP phones
- Various IoT controllers

## Storage Architecture

The storage system is built around:

- UNVR with 4x 16TB drives in RAID 10
- Dedicated NAS for lab environment backups
- Edge caching for frequently accessed content

Current storage allocation:

- 30% Security footage (with 30-day retention)
- 40% Lab environment (VMs, containers, test data)
- 20% Media storage
- 10% System backups

## Network Services

Currently running these core services:

1. Network Monitoring:

   - Prometheus for metrics collection
   - Grafana for visualization
   - Custom alerting via webhook integration

1. Security:

   - IPS/IDS with custom rulesets
   - Network flow analysis
   - Automated threat detection

1. Lab Environment:
   - Kubernetes cluster for container orchestration
   - CI/CD pipeline for testing
   - Development environments

## Technical Challenges & Solutions

### Challenge 1: High-Density WiFi Coverage

- Initial deployment showed dead zones
- Solution: Added mesh networking with wireless uplink
- Result: Consistent coverage with seamless roaming

### Challenge 2: Power Management

- Initial PoE budget calculations were insufficient
- Solution: Implemented power scheduling and upgraded PSU
- Result: Stable power delivery with 25% headroom

### Challenge 3: Storage I/O

- Network recording created I/O bottlenecks
- Solution: Implemented edge caching and storage tiering
- Result: 70% reduction in main storage I/O

## Future Architecture Plans

1. Technical Improvements:

   - Implementing BGP for more robust routing
   - Adding redundant internet connections
   - Expanding kubernetes cluster

1. Infrastructure Expansion:
   - Additional compute nodes for lab environment
   - Enhanced monitoring and logging
   - Automated failover systems

## Technical Insights

1. Network Architecture:

   - Start with proper VLAN segmentation
   - Plan your IP space carefully
   - Document all custom firewall rules

1. Storage Planning:

   - Calculate IOPS requirements beforehand
   - Plan for backup storage
   - Consider future expansion

1. Infrastructure Management:
   - Implement configuration management
   - Set up automated monitoring
   - Maintain thorough documentation

This setup has evolved into a robust platform for both learning and practical
use. While it may be more complex than a typical home network, it provides an
excellent environment for experimenting with enterprise-grade networking
concepts and running a productive homelab, all while maintaining a high level of
security and performance -- making it well worth the investment.
````
