---
author: 'Jonathan Haas'
pubDate: '2025-06-25'
title: 'Running Untrusted LLM Code Without Fear: Building a MicroVM Sandbox'
description: 'How I built Fission - a high-performance ephemeral sandbox using Firecracker microVMs to safely execute LLM-generated code'
featured: false
draft: false
tags:
  - security
  - sandbox
  - firecracker
  - microvm
  - llm
image:
  url: '/images/running-untrusted-llm-code-without-fear-building-a-microvm-sandbox.jpg'
  alt: 'Running Untrusted LLM Code Without Fear: Building a MicroVM Sandbox header image'
---

Every time an LLM generates code, you face a choice: trust it blindly or spend hours reviewing it. Neither option scales.

I built [Fission](https://github.com/haasonsaas/Fission) to solve this. It's a high-performance sandbox that executes untrusted code in ephemeral Firecracker microVMs. Boot time: 125ms. Overhead: minimal. Security: bulletproof.

Here's how to run LLM code without losing sleep.

## The Trust Problem

LLMs are getting scary good at writing code. But they also hallucinate, make mistakes, and occasionally suggest `rm -rf /`. Even worse, malicious prompts can inject harmful code that looks innocent.

Traditional solutions don't work:

- **Docker**: Shared kernel, container escapes possible
- **VMs**: Too slow, too heavy (2-3 second boot times)
- **Language sandboxes**: Limited to one language, often bypassable
- **Static analysis**: Can't catch runtime behavior

I needed something that was:

1. **Fast**: Sub-second execution for interactive use
2. **Secure**: True isolation, not just namespace separation
3. **Language-agnostic**: Python, Node, Go, whatever
4. **Ephemeral**: No state persistence between runs

Enter Firecracker.

## Firecracker: VMs at Container Speed

Amazon built Firecracker to run Lambda functions. It creates microVMs with:

- 125ms boot time
- 5MB memory overhead
- Hardware-level isolation
- No shared kernel surfaces

Perfect for sandboxing untrusted code.

Here's the architecture I built:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Management API │────▶│  VM Orchestrator │────▶│   Firecracker   │
│    (gRPC)       │     │  (Rust Service)  │     │   MicroVMs      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         ▲                                                │
         │                                                ▼
┌─────────────────┐                              ┌─────────────────┐
│   MCP Adapter   │                              │ Ephemeral VMs   │
│   (JSON-RPC)    │                              │ • Python env    │
└─────────────────┘                              │ • Node.js env   │
                                                 │ • Isolated FS   │
                                                 └─────────────────┘
```

## Real-World Usage

### Basic Execution

```bash
# Run Python code
fission run --lang python "print('Hello from isolation!')"

# Output appears, VM destroyed, no trace left
```

Behind the scenes:

1. VM boots (125ms)
2. Code executes in isolation
3. Output captured
4. VM destroyed completely

### Complex Scenarios

**Running untrusted data analysis:**

```bash
fission run --lang python "
import pandas as pd
# LLM-generated analysis code
df = pd.read_csv('/data/input.csv')
print(df.groupby('category').sum())
"
```

**Testing package combinations:**

```bash
fission install --lang python \
  --packages numpy,scipy,matplotlib \
  --command "python analysis.py"
```

**Clone and test repositories:**

```bash
fission repo https://github.com/untrusted/code \
  --command "pytest" \
  --lang python
```

Each execution is completely isolated. No cross-contamination possible.

## Security Deep Dive

### Layer 1: Hardware Isolation

Firecracker uses KVM for hardware-level isolation:

```rust
// Each VM gets its own virtualized hardware
let vm_config = VmConfig {
    vcpu_count: 1,
    mem_size_mib: 128,
    kernel: "vmlinux-5.10",
    rootfs: "python-rootfs.ext4",
};
```

### Layer 2: Network Isolation

By default, no network access:

```rust
pub struct NetworkConfig {
    enabled: bool,
    allowed_hosts: Vec<String>,  // Empty by default
}
```

Can be selectively enabled:

```bash
fission run --network --allow-host api.example.com \
  --lang python "requests.get('https://api.example.com')"
```

### Layer 3: Resource Limits

Hard limits prevent resource exhaustion:

```rust
pub struct ResourceLimits {
    cpu_shares: u32,      // Default: 1024
    memory_mb: u32,       // Default: 128
    timeout_secs: u32,    // Default: 30
    disk_mb: u32,         // Default: 512
}
```

### Layer 4: Syscall Filtering

Seccomp filters block dangerous syscalls:

```rust
let seccomp_rules = vec![
    // Block kernel module operations
    Rule::new(libc::SYS_init_module, Action::Errno(libc::EPERM)),
    Rule::new(libc::SYS_delete_module, Action::Errno(libc::EPERM)),

    // Block raw network access
    Rule::new(libc::SYS_socket,
        if domain != AF_INET { Action::Errno(libc::EPERM) }),
];
```

## Performance Optimization

### Pre-warmed VM Pool

I maintain a pool of pre-booted VMs:

```rust
struct VmPool {
    python_vms: Vec<PrewarmedVm>,
    node_vms: Vec<PrewarmedVm>,
    go_vms: Vec<PrewarmedVm>,
}

async fn get_vm(lang: Language) -> Vm {
    // Instant VM from pool, or boot new one
    pool.take(lang).await
        .unwrap_or_else(|| boot_vm(lang).await)
}
```

**Result**: <50ms from request to execution start.

### Copy-on-Write Rootfs

Base filesystem shared via CoW:

```rust
// Base image (read-only)
let base_rootfs = "/var/lib/fission/base/python.ext4";

// Create CoW overlay for this execution
let overlay = create_overlay(base_rootfs, execution_id);
```

**Impact**: 5MB per VM instead of 500MB.

### Efficient Output Streaming

Real-time output via virtio-serial:

```rust
let (tx, rx) = channel();
vm.attach_serial(move |data| {
    tx.send(Output::Stdout(data)).ok();
});
```

No polling, no buffering, instant feedback.

## Building Language-Specific Images

Each language gets a minimal rootfs:

```dockerfile
# Python image
FROM scratch
COPY --from=python:3.11-slim /usr/local /usr/local
COPY --from=python:3.11-slim /lib /lib
COPY --from=alpine:latest /bin/sh /bin/sh

# Only essential packages
RUN pip install --no-cache-dir numpy pandas requests

# Total size: ~50MB
```

Build process:

```bash
cd images
sudo make python  # Builds python rootfs
sudo make all     # Builds all languages
```

## Integration Patterns

### With LLM Agents

```python
# Agent generates code
code = llm.generate("Analyze this CSV and find anomalies")

# Execute safely
result = fission.run(
    language="python",
    code=code,
    timeout=30,
    memory_mb=256
)

# Use results with confidence
if result.success:
    return result.output
```

### CI/CD Pipeline Testing

```yaml
# .github/workflows/test-generated.yml
- name: Test LLM-generated solutions
  run: |
    fission run --lang python \
      --file generated_solution.py \
      --timeout 60
```

### Interactive Development

```python
# Real-time code execution for IDEs
async def execute_cell(code: str) -> Result:
    async with fission.connect() as client:
        return await client.run(
            language="python",
            code=code,
            stream_output=True
        )
```

## Lessons Learned

### 1. MicroVMs Are the Sweet Spot

Not as light as containers, not as heavy as VMs. Perfect balance of:

- Security (hardware isolation)
- Performance (sub-second boot)
- Flexibility (any language/runtime)

### 2. Rust + Firecracker = ❤️

The entire orchestrator is 3,000 lines of Rust. Memory safe, blazing fast, perfect for security-critical code:

```rust
// Type-safe VM lifecycle
enum VmState {
    Booting,
    Ready(VmHandle),
    Executing(ExecutionHandle),
    Terminated,
}
```

### 3. Ephemeral by Design

No cleanup needed. VM dies = everything gone:

- No leaked processes
- No orphaned files
- No network connections
- No memory artifacts

### 4. Pre-warming Changes Everything

That 125ms boot time? With pre-warming, execution starts in <50ms. Fast enough for interactive use, secure enough for production.

## What's Next

I'm working on:

- **GPU passthrough**: For ML workloads
- **Distributed execution**: Spread across multiple hosts
- **Persistent volumes**: Optional mounted directories
- **WebAssembly support**: Even lighter isolation

## Try It Yourself

```bash
# Clone and build
git clone https://github.com/haasonsaas/Fission
cd Fission
cargo build --release

# Build VM images
cd images && sudo make all

# Start the service
./target/release/fission-management

# Run untrusted code fearlessly
./target/release/fission run --lang python "
# Your sketchy LLM code here
"
```

The future of AI assistants is code generation. The future of code generation is secure execution.

Build with confidence. Execute without fear.

---

_Using Fission in production? I'd love to hear about your use cases and security requirements._
