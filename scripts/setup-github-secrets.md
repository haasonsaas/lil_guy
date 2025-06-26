# GitHub Secrets Setup Guide

This guide helps you configure the required secrets for the GitHub Actions workflows.

## Required Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions, then add these secrets:

### Cloudflare Configuration

1. **CLOUDFLARE_API_TOKEN**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
   - Create a "Custom token" with these permissions:
     - Account: Cloudflare Pages:Edit
     - Zone: Zone Settings:Read, Zone:Read
     - Include: All accounts
   - Copy the generated token

2. **CLOUDFLARE_ACCOUNT_ID**
   - Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Copy the Account ID from the right sidebar

3. **CLOUDFLARE_PROJECT_NAME**
   - Your Cloudflare Pages project name (e.g., "haas-blog")

4. **CLOUDFLARE_ZONE_ID**
   - Go to your domain in Cloudflare Dashboard
   - Copy the Zone ID from the right sidebar

### Application Configuration

5. **VITE_RESEND_API_KEY**
   - Your Resend API key for email subscriptions
   - Get from [Resend Dashboard](https://resend.com/api-keys)

6. **VITE_EMAIL_TO**
   - Email address to receive newsletter subscriptions

7. **VITE_EMAIL_FROM**
   - Email address to send from (must be verified in Resend)

## Setting up Cloudflare Pages

1. **Connect your repository to Cloudflare Pages:**
   - Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
   - Click "Create a project"
   - Connect to Git and select your repository
   - Use these build settings:
     - Build command: `bun run build`
     - Build output directory: `dist`
     - Environment variables: Add the VITE\_\* variables above

2. **Configure custom domain (optional):**
   - In your Pages project, go to Custom domains
   - Add your domain and follow DNS setup instructions

## Testing the Setup

1. **Test Quality Checks:**

   ```bash
   # These run on every push and PR
   git push origin main
   ```

2. **Test Preview Deployment:**

   ```bash
   # Create a PR to trigger preview deployment
   git checkout -b test-deployment
   git push origin test-deployment
   # Create PR on GitHub
   ```

3. **Verify Production Deployment:**
   ```bash
   # Merge PR or push to main triggers production deployment
   git checkout main
   git merge test-deployment
   git push origin main
   ```

## Troubleshooting

### Common Issues:

1. **"Invalid API token"**
   - Verify the token has correct permissions
   - Check if token is expired
   - Ensure Account ID is correct

2. **"Project not found"**
   - Verify CLOUDFLARE_PROJECT_NAME matches exactly
   - Project must exist in Cloudflare Pages

3. **Build failures**
   - Check environment variables are set correctly
   - Verify Bun version compatibility
   - Review build logs in GitHub Actions

### Getting Help:

- Check [Cloudflare Pages docs](https://developers.cloudflare.com/pages/)
- Review [GitHub Actions logs](https://github.com/your-username/your-repo/actions)
- Verify secrets are properly configured

## Security Notes

- Never commit API tokens to your repository
- Use environment-specific tokens when possible
- Regularly rotate API tokens
- Monitor usage in Cloudflare Dashboard

## Next Steps

After setup:

1. Verify all workflows pass
2. Test preview deployments work
3. Confirm production deployments are successful
4. Set up monitoring and alerts (optional)
