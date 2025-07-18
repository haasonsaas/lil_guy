---
author: 'Jonathan Haas'
pubDate: "2025-07-18"
title: 'From Consumer NUC to Production-Grade Homelab: My Journey with Proxmox and Infrastructure as Code'
description: 'How I transformed an ASUS NUC 15 Pro+ into an enterprise-grade homelab using Proxmox, Terraform, Ansible, and 100% Infrastructure as Code'
featured: false
draft: false
tags: ['homelab', 'proxmox', 'infrastructure-as-code', 'devops', 'automation']
---

I've been running production workloads on cloud providers for years. AWS, GCP, you name it. But there's something deeply satisfying about running your own metal—especially when you apply the same enterprise-grade practices you'd use in a corporate environment.

When I picked up an ASUS NUC 15 Pro+ with 96GB RAM and a 4TB NVMe drive, I didn't just want another homelab. I wanted to build something that could rival any production infrastructure, just at a smaller scale.

Here's how I turned a consumer-grade NUC into a fully automated, monitored, and secured homelab infrastructure using 100% Infrastructure as Code.

## The Foundation: Why Proxmox?

I evaluated several hypervisors before settling on Proxmox VE. VMware ESXi felt too enterprise (and expensive), while bare Docker felt too limiting. Proxmox hit the sweet spot:

- **Native LXC support**: Near-metal performance without VM overhead
- **ZFS integration**: Snapshots, compression, and data integrity out of the box
- **API-first design**: Everything is automatable via REST API
- **Active community**: Solutions to problems are always a search away

But here's the kicker—I wasn't going to click through any web UIs. Everything had to be code.

## The Architecture: LXC Containers Over Kubernetes

You might be wondering: "Why not Kubernetes?" I ran k8s clusters professionally for years. For a homelab, it's overkill.

Instead, I chose LXC containers for service isolation:

```text
LXC 106: Media Server (Jellyfin)
LXC 107: Media Stack (Sonarr, Radarr, Prowlarr, Bazarr, qBittorrent)
LXC 108: Home Apps (Mealie, Grocy, Paperless-ngx, Glance)
LXC 109: Service Monitoring (Uptime Kuma)
LXC 110: Cloud Storage (Nextcloud + MariaDB + Redis)
LXC 400: Docker Host (monitoring infrastructure - Prometheus, Grafana, Loki)
```

Each container gets dedicated resources, isolated networking, and can be individually snapshotted. Boot times? Under 5 seconds. Try that with a VM.

## Infrastructure as Code: The Holy Trinity

### Terraform: Declarative Infrastructure

Every VM and container starts as Terraform code:

```hcl
resource "proxmox_lxc" "media_server" {
  target_node  = "nuc"
  hostname     = "jellyfin"
  ostemplate   = "local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst"
  cores        = 4
  memory       = 4096
  swap         = 0
  
  rootfs {
    storage = "local-lvm"
    size    = "20G"
  }
  
  network {
    name   = "eth0"
    bridge = "vmbr0"
    ip     = "192.168.4.106/24"
    gw     = "192.168.4.1"
  }
  
  features {
    nesting = true
    fuse    = true
  }
}
```

### Packer: Hardened VM Templates

I built four base templates, each hardened according to CIS benchmarks:

- **Ubuntu 22.04 LTS**: For services needing broad compatibility
- **Debian 12**: Minimal footprint for lightweight services
- **Rocky Linux 9**: When I need RHEL compatibility
- **Alpine 3.19**: Ultra-lightweight container hosts

Each template includes:

- Security hardening scripts
- Node Exporter pre-installed
- Cloud-init ready
- Automatic security updates configured

### Ansible: Configuration Management

Once Terraform provisions the infrastructure, Ansible takes over:

```yaml
- name: Deploy Monitoring Stack
  hosts: monitoring
  roles:
    - prometheus
    - grafana
    - loki
    - alertmanager
  vars:
    prometheus_retention: 30d
    grafana_auth_anonymous_enabled: false
    alertmanager_slack_webhook: !vault |
      $ANSIBLE_VAULT;1.1;AES256
```

## The Monitoring Stack: Observability First

You can't manage what you can't measure. My monitoring stack rivals what I've built for companies with millions in ARR:

### Metrics Collection

- **Prometheus**: 30+ scrape targets across all services
- **Node Exporter**: System metrics on every host
- **Proxmox Exporter**: Hypervisor-level metrics
- **Custom exporters**: For application-specific metrics

### Visualization & Alerting

- **Grafana**: 15 pre-built dashboards covering everything from CPU usage to backup status
- **Alertmanager**: Intelligent routing with PagerDuty integration (yes, for a homelab)
- **Loki**: Centralized logging with 30-day retention

### Real Alerts That Matter

```yaml
groups:
  - name: homelab
    rules:
      - alert: BackupFailed
        expr: time() - backup_last_success_timestamp > 86400
        annotations:
          summary: "Backup hasn't succeeded in 24 hours"
          
      - alert: ServiceDown
        expr: up{job=~"jellyfin|nextcloud|vault"} == 0
        for: 5m
        annotations:
          summary: "Critical service {{ $labels.job }} is down"
```

## Security: Production-Grade Hardening

### Network Segmentation

Five VLANs isolate different security zones:

- Management (Proxmox, monitoring)
- DMZ (internet-facing services)
- Internal (trusted services)
- IoT (untrusted devices)
- Lab (experimental workloads)

### Authentication & Authorization

- **Authelia**: SSO for all web services with 2FA enforcement
- **Vault**: Centralized secrets management with automatic rotation
- **SSH**: Key-based only, with fail2ban and rate limiting

### Automated Security Updates

```bash
#!/bin/bash
# Runs nightly via systemd timer
for container in $(pct list | awk 'NR>1 {print $1}'); do
  pct exec $container -- bash -c "apt update && apt upgrade -y"
  pct snapshot $container pre-update-$(date +%Y%m%d)
done
```

## Backup Strategy: Assume Everything Will Fail

Three-tier backup strategy because I've learned the hard way:

1. **Local ZFS snapshots**: Every 4 hours, retained for 7 days
2. **Proxmox Backup Server**: Nightly incrementals to dedicated LXC container
3. **Cloud backup**: Weekly encrypted Restic backups to Backblaze B2

Restoration? Tested monthly. I can rebuild the entire infrastructure from scratch in under 2 hours.

## The DevOps Pipeline: GitOps All The Way

Every change goes through Git:

```yaml
name: Deploy Infrastructure
on:
  push:
    branches: [main]
    
jobs:
  terraform:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v3
      - name: Terraform Apply
        run: |
          cd terraform
          terraform init
          terraform apply -auto-approve
          
  ansible:
    needs: terraform
    runs-on: self-hosted
    steps:
      - name: Run Ansible Playbooks
        run: |
          cd ansible
          ansible-playbook site.yml
```

The GitHub runner? It runs on the NUC itself, in a dedicated LXC container.

## Challenges and Lessons Learned

### LXC Networking Quirks

LXC containers with Tailscale hit weird DNS resolution issues. The fix? Custom `/etc/resolv.conf` management:

```bash
echo "nameserver 100.100.100.100" > /etc/resolv.conf
chattr +i /etc/resolv.conf  # Make it immutable
```

### Resource Constraints

32GB RAM seems like a lot until you're running 15+ services. Resource limits are crucial:

```yaml
# Ansible group_vars/all/main.yml
container_defaults:
  memory: 2048
  swap: 0
  cores: 2
  
container_overrides:
  jellyfin:
    memory: 4096
    cores: 4
  nextcloud:
    memory: 3072
```

### Backup Window Management

Staggering backups prevents IO storms:

```text
2:00 AM - VMs backup
3:00 AM - Container snapshots  
4:00 AM - Restic cloud sync
5:00 AM - Cleanup old snapshots
```

## Performance Metrics

After 6 months of operation:

- **Uptime**: 99.94% (one planned maintenance window)
- **Resource usage**: 65% RAM, 15% CPU average
- **Power consumption**: 35W idle, 85W under load
- **Monthly cost**: ~$8 in electricity + $3 for Backblaze B2

Compare that to equivalent cloud infrastructure: easily $200+/month.

## Future Expansions

The beauty of Infrastructure as Code? Scaling is trivial:

1. **Second NUC**: Proxmox cluster with HA failover
2. **Ceph storage**: Distributed storage across nodes
3. **BGP routing**: Full network automation with Cilium
4. **GitLab CI**: Move from GitHub to self-hosted CI/CD

## Key Takeaways

Building a production-grade homelab taught me several things:

**Infrastructure as Code isn't just for work.** The same practices that make cloud infrastructure manageable work brilliantly at home scale.

**LXC containers are underrated.** For service isolation without Kubernetes complexity, they're perfect.

**Monitoring isn't optional.** You'll catch issues before they become problems.

**Automation compounds.** Every script you write saves hours down the road.

**Documentation matters.** Future you will thank present you.

## The Real-World Impact

The best infrastructure is the one that gets out of your way. This setup has been running my home services—media streaming with Jellyfin, recipe management with Mealie, document archival with Paperless-ngx, and cloud storage with Nextcloud—without me thinking about it. That's when you know you've built something solid.

The migration from a monolithic docker-host to dedicated LXC containers brought tangible benefits:

- **Service isolation**: Jellyfin transcoding no longer impacts Nextcloud performance
- **Granular backups**: Individual container snapshots instead of backing up everything
- **Easier debugging**: Logs and metrics scoped to specific services
- **Resource efficiency**: Better CPU and memory allocation per service type

What's your homelab running? I'd love to hear how others are approaching infrastructure at home scale.
