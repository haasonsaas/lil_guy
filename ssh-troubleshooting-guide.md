# SSH Troubleshooting: A Comprehensive Guide

## Quick Reference

### SSH Key Authentication Issues
```bash
# Check SSH service status
systemctl status ssh

# Check if SSH is listening
ss -tlnp | grep :22

# Check SSH logs
sudo journalctl -u ssh --since "1 hour ago"

# Check SSH configuration
sudo cat /etc/ssh/sshd_config

# Check authorized keys
ls -la ~/.ssh/
cat ~/.ssh/authorized_keys
```

### Common SSH Problems and Solutions

#### 1. Password Authentication Failures
**Symptoms:** "Failed password" errors in logs, connection refused

**Check:**
```bash
# Review SSH logs for authentication failures
sudo journalctl -u ssh | grep "Failed password"
```

**Solutions:**
- Use SSH key authentication instead of passwords
- Verify correct username
- Check if password authentication is enabled in `/etc/ssh/sshd_config`

#### 2. SSH Key Authentication Not Working
**Symptoms:** Still prompted for password despite having SSH keys

**Check:**
```bash
# Verify SSH key permissions
ls -la ~/.ssh/
# Should show:
# -rw------- for private keys
# -rw-r--r-- for public keys
# -rw------- for authorized_keys
```

**Solutions:**
```bash
# Fix SSH key permissions
chmod 700 ~/.ssh/
chmod 600 ~/.ssh/id_*
chmod 644 ~/.ssh/id_*.pub
chmod 600 ~/.ssh/authorized_keys
```

#### 3. SSH Service Not Running
**Symptoms:** "Connection refused" errors

**Check:**
```bash
systemctl status ssh
```

**Solutions:**
```bash
# Start SSH service
sudo systemctl start ssh

# Enable SSH service at boot
sudo systemctl enable ssh

# Restart SSH service
sudo systemctl restart ssh
```

#### 4. Firewall Blocking SSH
**Symptoms:** Connection timeouts, no response

**Check:**
```bash
# Check firewall status
sudo ufw status

# Check if port 22 is open
sudo ss -tlnp | grep :22
```

**Solutions:**
```bash
# Allow SSH through firewall
sudo ufw allow 22/tcp

# Or allow from specific IP
sudo ufw allow from 192.168.1.0/24 to any port 22
```

#### 5. SSH Configuration Issues
**Symptoms:** Various authentication or connection problems

**Check:**
```bash
# Test SSH configuration
sudo sshd -t

# Check SSH configuration
sudo cat /etc/ssh/sshd_config
```

**Common fixes:**
```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Common settings to verify:
# Port 22
# PubkeyAuthentication yes
# AuthorizedKeysFile .ssh/authorized_keys
# PasswordAuthentication no  # (for security)
# PermitRootLogin no         # (for security)
```

### SSH Security Best Practices

#### 1. Disable Password Authentication
```bash
# In /etc/ssh/sshd_config
PasswordAuthentication no
KbdInteractiveAuthentication no
```

#### 2. Use SSH Key Authentication
```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key to server
ssh-copy-id user@server
```

#### 3. Change Default SSH Port
```bash
# In /etc/ssh/sshd_config
Port 2222

# Update firewall
sudo ufw allow 2222/tcp
sudo ufw delete allow 22/tcp
```

#### 4. Restrict SSH Access
```bash
# In /etc/ssh/sshd_config
AllowUsers specific-user
AllowGroups ssh-users
DenyUsers bad-user
```

### Troubleshooting Steps

1. **Check SSH Service Status**
   ```bash
   systemctl status ssh
   ```

2. **Check SSH Logs**
   ```bash
   sudo journalctl -u ssh --since "1 hour ago"
   ```

3. **Verify SSH Configuration**
   ```bash
   sudo sshd -t
   ```

4. **Check Network Connectivity**
   ```bash
   telnet server-ip 22
   ```

5. **Test SSH Connection with Verbose Output**
   ```bash
   ssh -v user@server
   ```

### Advanced Debugging

#### SSH Client Debug
```bash
# Maximum verbosity
ssh -vvv user@server

# Use specific SSH key
ssh -i ~/.ssh/specific-key user@server
```

#### SSH Server Debug
```bash
# Run SSH daemon in debug mode
sudo /usr/sbin/sshd -d -p 2222
```

### SSH Key Management

#### Generate SSH Keys
```bash
# ED25519 (recommended)
ssh-keygen -t ed25519 -C "your-email@example.com"

# RSA (legacy)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

#### SSH Agent
```bash
# Start SSH agent
eval "$(ssh-agent -s)"

# Add SSH key to agent
ssh-add ~/.ssh/id_ed25519

# List loaded keys
ssh-add -l
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | SSH service not running | Start SSH service |
| `Permission denied (publickey)` | SSH key not recognized | Check authorized_keys |
| `Host key verification failed` | SSH host key changed | Remove old key from known_hosts |
| `Connection timeout` | Firewall blocking | Check firewall rules |
| `Too many authentication failures` | Too many key attempts | Use specific key with -i |

### Configuration Files

#### SSH Client Config (~/.ssh/config)
```
Host myserver
    HostName server.example.com
    User myuser
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

#### SSH Server Config (/etc/ssh/sshd_config)
```
# Security settings
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Connection settings
Port 22
MaxAuthTries 3
MaxSessions 10
ClientAliveInterval 300
```

### Monitoring SSH

#### Real-time SSH Monitoring
```bash
# Monitor SSH connections
sudo tail -f /var/log/auth.log | grep sshd

# Monitor failed login attempts
sudo grep "Failed password" /var/log/auth.log
```

#### SSH Security Monitoring
```bash
# Check for brute force attempts
sudo grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -nr

# Monitor successful logins
sudo grep "Accepted" /var/log/auth.log
```

## Emergency Recovery

If you're locked out of SSH:

1. **Use console access** (physical or VNC)
2. **Check SSH service:** `systemctl status ssh`
3. **Reset SSH config:** `sudo cp /etc/ssh/sshd_config.backup /etc/ssh/sshd_config`
4. **Restart SSH:** `sudo systemctl restart ssh`
5. **Check firewall:** `sudo ufw status`

Remember to always test SSH configuration changes on a separate session before closing your current connection!