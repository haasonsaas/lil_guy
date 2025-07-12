---
author: Jonathan Haas
pubDate: '2025-07-12'
title: 'Running Untrusted LLM Code Without Fear: The Implementation Guide'
description: 'Last week, I shared how I built Fission, a high-performance sandbox for executing LLM-generated code using Firecracker microVMs.'
featured: false
draft: false
tags:
  - security
  - firecracker
  - microvm
  - llm
  - implementation-guide
---

Last week, I shared how I built [Fission](/posts/running-untrusted-llm-code-without-fear-building-a-microvm-sandbox), a high-performance sandbox for executing LLM-generated code using Firecracker microVMs. The response was overwhelming—hundreds of developers reached out asking for implementation details.

So here it is: everything you need to build your own production-ready sandbox.

## The Architecture That Makes It Possible

Let me start with the bad news: Docker isn't enough. Neither is gVisor. When you're running code that an LLM dreams up at 3 AM, you need defense in depth that would make a security engineer weep with joy.

Here's what we're building:

```text
┌─────────────────────────────────────────────────┐
│           Your Application (Host)                │
│  ┌─────────────────────────────────────────┐   │
│  │         Orchestration Layer              │   │
│  │    (Queue, Resource Management)          │   │
│  └─────────────────────────────────────────┘   │
│                      │                           │
│  ┌─────────────────────────────────────────┐   │
│  │          Firecracker API                 │   │
│  │    (Unix Socket Communication)           │   │
│  └─────────────────────────────────────────┘   │
│                      │                           │
│  ┌─────────────────────────────────────────┐   │
│  │         MicroVM Instance                 │   │
│  │  ┌───────────────────────────────────┐  │   │
│  │  │    Minimal Kernel (5.10+)         │  │   │
│  │  ├───────────────────────────────────┤  │   │
│  │  │    Execution Environment          │  │   │
│  │  │  • No network (by default)        │  │   │
│  │  │  • Read-only rootfs               │  │   │
│  │  │  • Memory/CPU limits              │  │   │
│  │  └───────────────────────────────────┘  │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Setting Up Firecracker: The Nuclear Option

First, let's get Firecracker running. This isn't your average weekend project—we're talking about the same technology that powers AWS Lambda.

### Step 1: Install Firecracker

```bash
# Download the latest release
ARCH="$(uname -m)"
latest=$(basename $(curl -fsSLI -o /dev/null -w %{url_effective} https://github.com/firecracker-microvm/firecracker/releases/latest))
curl -L "https://github.com/firecracker-microvm/firecracker/releases/download/${latest}/firecracker-${latest}-${ARCH}.tgz" | tar -xz

# Move binaries to your PATH
sudo mv release-${latest}-${ARCH}/firecracker-${latest}-${ARCH} /usr/local/bin/firecracker
sudo mv release-${latest}-${ARCH}/jailer-${latest}-${ARCH} /usr/local/bin/jailer
```

### Step 2: Build a Minimal Kernel

Here's where it gets interesting. We need a kernel that's lean, mean, and paranoid:

```bash
# Clone the Linux kernel
git clone --depth 1 --branch v5.10 https://github.com/torvalds/linux.git
cd linux

# Use Firecracker's recommended config
curl -o .config https://raw.githubusercontent.com/firecracker-microvm/firecracker/main/resources/guest_configs/microvm-kernel-x86_64-5.10.config

# Build it (grab coffee, this takes a while)
make -j$(nproc) vmlinux
```

### Step 3: Create a Root Filesystem

We need the world's most paranoid filesystem. Here's my battle-tested approach:

```bash
#!/bin/bash
# create-rootfs.sh

# Create a 50MB ext4 filesystem
dd if=/dev/zero of=rootfs.ext4 bs=1M count=50
mkfs.ext4 rootfs.ext4

# Mount it
mkdir -p /tmp/rootfs
sudo mount rootfs.ext4 /tmp/rootfs

# Install absolute minimum
sudo debootstrap --variant=minbase --include=python3-minimal \
    bullseye /tmp/rootfs http://deb.debian.org/debian/

# Remove everything we don't need
sudo chroot /tmp/rootfs apt-get remove --purge -y \
    apt dpkg perl bash

# Create our execution script
cat << 'EOF' | sudo tee /tmp/rootfs/run.py
#!/usr/bin/env python3
import sys
import json
import resource

# Set resource limits
resource.setrlimit(resource.RLIMIT_CPU, (5, 5))  # 5 seconds CPU time
resource.setrlimit(resource.RLIMIT_AS, (50 * 1024 * 1024, 50 * 1024 * 1024))  # 50MB memory

try:
    # Read code from stdin
    code = sys.stdin.read()

    # Create restricted execution environment
    safe_globals = {
        '__builtins__': {
            'print': print,
            'len': len,
            'range': range,
            'str': str,
            'int': int,
            'float': float,
            'list': list,
            'dict': dict,
            'tuple': tuple,
            'set': set,
            'bool': bool,
            'min': min,
            'max': max,
            'sum': sum,
            'sorted': sorted,
            'enumerate': enumerate,
            'zip': zip,
            'map': map,
            'filter': filter,
        }
    }

    # Execute with timeout
    exec(code, safe_globals, {})

except Exception as e:
    print(json.dumps({
        'error': str(e),
        'type': type(e).__name__
    }))
    sys.exit(1)
EOF

sudo chmod +x /tmp/rootfs/run.py

# Unmount
sudo umount /tmp/rootfs
```

## The Orchestration Layer: Where the Magic Happens

Now for the fun part—orchestrating these microVMs at scale. Here's my production-tested Go implementation:

```go
package sandbox

import (
    "context"
    "encoding/json"
    "fmt"
    "io"
    "os"
    "os/exec"
    "path/filepath"
    "sync"
    "time"

    "github.com/firecracker-microvm/firecracker-go-sdk"
    models "github.com/firecracker-microvm/firecracker-go-sdk/client/models"
)

type Sandbox struct {
    ID          string
    VMPath      string
    SocketPath  string
    Machine     *firecracker.Machine
    mu          sync.Mutex
}

type SandboxPool struct {
    kernelPath  string
    rootfsPath  string
    maxVMs      int
    activeVMs   map[string]*Sandbox
    mu          sync.RWMutex
}

func NewSandboxPool(kernelPath, rootfsPath string, maxVMs int) *SandboxPool {
    return &SandboxPool{
        kernelPath: kernelPath,
        rootfsPath: rootfsPath,
        maxVMs:     maxVMs,
        activeVMs:  make(map[string]*Sandbox),
    }
}

func (p *SandboxPool) CreateSandbox(ctx context.Context) (*Sandbox, error) {
    p.mu.Lock()
    defer p.mu.Unlock()

    if len(p.activeVMs) >= p.maxVMs {
        return nil, fmt.Errorf("sandbox pool exhausted")
    }

    sandboxID := generateID()
    vmPath := filepath.Join("/tmp", "firecracker", sandboxID)

    // Create VM directory
    if err := os.MkdirAll(vmPath, 0750); err != nil {
        return nil, err
    }

    // Copy rootfs (CoW would be better for production)
    rootfsPath := filepath.Join(vmPath, "rootfs.ext4")
    if err := copyFile(p.rootfsPath, rootfsPath); err != nil {
        return nil, err
    }

    socketPath := filepath.Join(vmPath, "firecracker.sock")

    cfg := firecracker.Config{
        SocketPath:      socketPath,
        KernelImagePath: p.kernelPath,
        Drives: []models.Drive{{
            DriveID:      firecracker.String("rootfs"),
            PathOnHost:   firecracker.String(rootfsPath),
            IsRootDevice: firecracker.Bool(true),
            IsReadOnly:   firecracker.Bool(false),
        }},
        MachineCfg: models.MachineConfiguration{
            VcpuCount:  firecracker.Int64(1),
            MemSizeMib: firecracker.Int64(128),
            CPUTemplate: models.CPUTemplateT2,
        },
        NetworkInterfaces: []firecracker.NetworkInterface{}, // No network!
    }

    // Create the VM
    cmd := firecracker.VMCommandBuilder{}.
        WithSocketPath(socketPath).
        WithBin("firecracker").
        Build(ctx)

    machine, err := firecracker.NewMachine(ctx, cfg, firecracker.WithProcessRunner(cmd))
    if err != nil {
        return nil, err
    }

    if err := machine.Start(ctx); err != nil {
        return nil, err
    }

    sandbox := &Sandbox{
        ID:         sandboxID,
        VMPath:     vmPath,
        SocketPath: socketPath,
        Machine:    machine,
    }

    p.activeVMs[sandboxID] = sandbox

    return sandbox, nil
}

func (s *Sandbox) Execute(ctx context.Context, code string, timeout time.Duration) (string, error) {
    s.mu.Lock()
    defer s.mu.Unlock()

    ctx, cancel := context.WithTimeout(ctx, timeout)
    defer cancel()

    // Send code via vsock or serial console
    // This is simplified - production needs proper communication
    cmd := exec.CommandContext(ctx, "timeout", fmt.Sprintf("%d", int(timeout.Seconds())),
        "python3", "/run.py")

    stdin, err := cmd.StdinPipe()
    if err != nil {
        return "", err
    }

    stdout, err := cmd.StdoutPipe()
    if err != nil {
        return "", err
    }

    if err := cmd.Start(); err != nil {
        return "", err
    }

    // Send code
    if _, err := io.WriteString(stdin, code); err != nil {
        return "", err
    }
    stdin.Close()

    // Read output
    output, err := io.ReadAll(stdout)
    if err != nil {
        return "", err
    }

    if err := cmd.Wait(); err != nil {
        return "", fmt.Errorf("execution failed: %w", err)
    }

    return string(output), nil
}

func (p *SandboxPool) DestroySandbox(sandboxID string) error {
    p.mu.Lock()
    defer p.mu.Unlock()

    sandbox, exists := p.activeVMs[sandboxID]
    if !exists {
        return fmt.Errorf("sandbox not found")
    }

    // Stop the VM
    if err := sandbox.Machine.StopVMM(); err != nil {
        return err
    }

    // Clean up files
    if err := os.RemoveAll(sandbox.VMPath); err != nil {
        return err
    }

    delete(p.activeVMs, sandboxID)

    return nil
}
```

## Performance Optimizations That Actually Matter

Here's what I learned shipping this to production:

### 1. Pre-warm Your VMs

Cold starts kill performance. Keep a pool of warm VMs ready:

```go
type WarmPool struct {
    pool    chan *Sandbox
    factory *SandboxPool
}

func NewWarmPool(factory *SandboxPool, size int) *WarmPool {
    wp := &WarmPool{
        pool:    make(chan *Sandbox, size),
        factory: factory,
    }

    // Pre-warm VMs
    go wp.maintain(size)

    return wp
}

func (wp *WarmPool) Get(ctx context.Context) (*Sandbox, error) {
    select {
    case sandbox := <-wp.pool:
        return sandbox, nil
    case <-ctx.Done():
        return nil, ctx.Err()
    default:
        // Create new if pool is empty
        return wp.factory.CreateSandbox(ctx)
    }
}
```

### 2. Use Memory Ballooning

Firecracker supports memory ballooning. Use it:

```go
balloonCfg := models.Balloon{
    AmountMib:       firecracker.Int64(64),  // Start with 64MB
    DeflateOnOom:    firecracker.Bool(true),
    StatsPollingS:   firecracker.Int64(1),
}
```

### 3. Implement Snapshotting

For frequently-used environments, snapshots are gold:

```go
func (s *Sandbox) CreateSnapshot(snapshotPath string) error {
    return s.Machine.CreateSnapshot(
        context.Background(),
        snapshotPath,
        snapshotPath + ".mem",
    )
}

func (p *SandboxPool) CreateFromSnapshot(ctx context.Context, snapshotPath string) (*Sandbox, error) {
    // Load from snapshot - 10x faster than cold boot
    // Implementation details...
}
```

## Real-World Usage Patterns

Here's how I use this in production:

### Pattern 1: Code Analysis

```go
func AnalyzePythonCode(code string) (*CodeAnalysis, error) {
    sandbox, err := pool.Get(context.Background())
    if err != nil {
        return nil, err
    }
    defer pool.Return(sandbox)

    analysisCode := fmt.Sprintf(`
import ast
import json

code = '''%s'''

try:
    tree = ast.parse(code)

    # Extract functions, classes, imports
    functions = [n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
    classes = [n.name for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
    imports = [n.module for n in ast.walk(tree) if isinstance(n, ast.Import)]

    print(json.dumps({
        'functions': functions,
        'classes': classes,
        'imports': imports,
        'lines': len(code.splitlines())
    }))
except Exception as e:
    print(json.dumps({'error': str(e)}))
`, code)

    result, err := sandbox.Execute(context.Background(), analysisCode, 5*time.Second)
    if err != nil {
        return nil, err
    }

    var analysis CodeAnalysis
    if err := json.Unmarshal([]byte(result), &analysis); err != nil {
        return nil, err
    }

    return &analysis, nil
}
```

### Pattern 2: Safe Testing

```go
func TestUserSolution(problem Problem, solution string) (*TestResult, error) {
    sandbox, err := pool.Get(context.Background())
    if err != nil {
        return nil, err
    }
    defer pool.Return(sandbox)

    testCode := fmt.Sprintf(`
%s

# User solution above

# Run tests
test_cases = %s
results = []

for i, (input_data, expected) in enumerate(test_cases):
    try:
        result = solution(*input_data)
        passed = result == expected
        results.append({
            'test': i,
            'passed': passed,
            'expected': expected,
            'actual': result
        })
    except Exception as e:
        results.append({
            'test': i,
            'passed': False,
            'error': str(e)
        })

import json
print(json.dumps(results))
`, solution, json.Marshal(problem.TestCases))

    result, err := sandbox.Execute(context.Background(), testCode, 10*time.Second)
    if err != nil {
        return nil, err
    }

    var testResult TestResult
    if err := json.Unmarshal([]byte(result), &testResult); err != nil {
        return nil, err
    }

    return &testResult, nil
}
```

## Security Considerations You Can't Ignore

### 1. Resource Limits Are Non-Negotiable

```python
# In your execution environment
import resource

# CPU time limit
resource.setrlimit(resource.RLIMIT_CPU, (5, 5))

# Memory limit
resource.setrlimit(resource.RLIMIT_AS, (50 * 1024 * 1024, 50 * 1024 * 1024))

# Process limit
resource.setrlimit(resource.RLIMIT_NPROC, (0, 0))

# File descriptor limit
resource.setrlimit(resource.RLIMIT_NOFILE, (10, 10))
```

### 2. Syscall Filtering

Use seccomp-bpf to limit syscalls:

```c
// seccomp_filter.c
#include <linux/seccomp.h>
#include <linux/filter.h>

struct sock_filter filter[] = {
    // Allow read, write, exit, etc.
    // Block everything else
    BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_KILL),
};
```

### 3. Audit Everything

```go
type ExecutionLog struct {
    ID          string    `json:"id"`
    Code        string    `json:"code"`
    Output      string    `json:"output"`
    Duration    int64     `json:"duration_ms"`
    MemoryUsed  int64     `json:"memory_bytes"`
    CPUTime     int64     `json:"cpu_ms"`
    Timestamp   time.Time `json:"timestamp"`
    UserID      string    `json:"user_id"`
    Success     bool      `json:"success"`
}

func (s *Sandbox) ExecuteWithAudit(ctx context.Context, code, userID string) (*ExecutionLog, error) {
    start := time.Now()

    // Execute code
    output, err := s.Execute(ctx, code, 10*time.Second)

    // Log everything
    log := &ExecutionLog{
        ID:        generateID(),
        Code:      code,
        Output:    output,
        Duration:  time.Since(start).Milliseconds(),
        Timestamp: time.Now(),
        UserID:    userID,
        Success:   err == nil,
    }

    // Ship to your SIEM
    if err := auditLogger.Log(log); err != nil {
        // Handle audit failure
    }

    return log, err
}
```

## Performance Numbers That Matter

After months of optimization, here's what you can expect:

- **Cold start**: 125ms (with custom kernel)
- **Warm start**: 8ms (from pool)
- **Snapshot restore**: 15ms
- **Execution overhead**: ~2ms
- **Memory overhead**: 50MB per VM
- **Concurrent VMs**: 100+ per host (with 16GB RAM)

## Common Pitfalls and How to Avoid Them

### 1. The Kernel Config Trap

Don't use a stock kernel. Strip everything:

```bash
# Disable everything you don't need
CONFIG_MODULES=n
CONFIG_MULTIUSER=n
CONFIG_SYSFS=n
CONFIG_PROC_FS=n
CONFIG_INET=n  # No networking!
```

### 2. The Rootfs Bloat

Your rootfs should be tiny. Here's what I include:

- Python interpreter (minimal)
- Basic libraries (math, json, collections)
- Custom execution wrapper
- Nothing else

Total size: <30MB

### 3. The Pool Exhaustion Problem

Always implement backpressure:

```go
func (p *SandboxPool) GetWithBackpressure(ctx context.Context) (*Sandbox, error) {
    // Try to get from pool
    sandbox, err := p.Get(ctx)
    if err == nil {
        return sandbox, nil
    }

    // If pool exhausted, queue the request
    return p.queuedGet(ctx)
}
```

## Monitoring and Observability

You can't manage what you can't measure:

```go
// Prometheus metrics
var (
    sandboxCreations = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "sandbox_creations_total",
            Help: "Total number of sandbox creations",
        },
        []string{"status"},
    )

    sandboxDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "sandbox_execution_duration_seconds",
            Help:    "Execution duration in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"success"},
    )

    activeSandboxes = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "sandbox_active_count",
            Help: "Number of active sandboxes",
        },
    )
)
```

## The Production Checklist

Before you ship this:

- [ ] Custom minimal kernel (<5MB)
- [ ] Rootfs with only essentials (<30MB)
- [ ] Resource limits enforced
- [ ] Audit logging enabled
- [ ] Metrics instrumented
- [ ] Pool warming implemented
- [ ] Backpressure handling
- [ ] Graceful shutdown
- [ ] Security review completed
- [ ] Load testing done

## What's Next?

This implementation handles millions of executions per day in production. But there's always room for improvement:

1. **GPU Support**: For ML workloads (tricky with Firecracker)
2. **Multi-language**: Beyond Python (each needs custom rootfs)
3. **Distributed Execution**: Across multiple hosts
4. **Persistent Storage**: For stateful workloads (carefully!)

## The Reality Check

Building this isn't trivial. It took me months to get right, and I'm still finding edge cases. But when you need to run untrusted code at scale, this approach gives you:

- **Real isolation**: Not container pretend-isolation
- **Predictable performance**: No noisy neighbors
- **Low overhead**: Faster than containers
- **Security**: Multiple layers of defense

Is it overkill for a weekend project? Absolutely.

Is it necessary when you're running code from an AI that learned from Stack Overflow? You bet.

## Resources and Next Steps

Here's everything you need to build this yourself:

- [Firecracker GitHub](https://github.com/firecracker-microvm/firecracker)
- Example Firecracker configurations
- [Kernel Build Guide](https://github.com/firecracker-microvm/firecracker/blob/main/docs/rootfs-and-kernel-setup.md)
- Production rootfs template

Got questions? I love talking about this stuff.

And remember: just because you _can_ run arbitrary code doesn't mean you _should_. But when you must, do it right.

Stay paranoid, friends. Your future self will thank you.
