# Email Automation Deployment Guide

## 1. Environment Variables

Add these to your Cloudflare Pages environment variables:

```
EMAIL_QUEUE (KV Namespace)
```

## 2. Create KV Namespace

In Cloudflare Dashboard:
1. Go to Workers & Pages → KV
2. Create namespace: `EMAIL_QUEUE`
3. Bind it to your Pages project

## 3. Set up Cron Trigger

In your `wrangler.toml` (if using Workers) or Pages settings:

```toml
[triggers]
crons = ["0 */1 * * *"]  # Run every hour
```

For Cloudflare Pages, you'll need to set this up in the dashboard or use a Worker.

## 4. Test the System

### Trigger Welcome Series Manually

```bash
curl -X POST https://your-domain.com/email-automation/trigger-welcome \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Process Email Queue Manually

```bash
curl -X POST https://your-domain.com/email-automation/process-queue
```

## 5. Monitor Logs

Check Cloudflare Pages logs to see:
- Email queue processing
- Successful sends
- Any errors

## 6. Function URLs

- Subscribe: `/subscribe` (already working)
- Unsubscribe: `/unsubscribe`
- Email Automation: `/email-automation/*`

## Welcome Series Timeline

1. **Immediate**: Welcome email 1 (Introduction)
2. **+24 hours**: Welcome email 2 (Best posts)  
3. **+72 hours**: Welcome email 3 (Current perspective)

## Features Included

✅ Welcome email series (3 emails)
✅ Automatic scheduling and delivery
✅ Retry logic for failed sends
✅ Unsubscribe functionality
✅ Subscriber preference management
✅ Analytics tracking integration
✅ Rate limiting and security

## Next Steps

1. Deploy the functions
2. Set up KV namespace
3. Configure cron trigger
4. Test with a real email
5. Monitor for 1 week
6. Add more automation types (weekly digest, etc.)