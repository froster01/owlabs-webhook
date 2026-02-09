# GitHub Webhook to Discord

A Node.js + TypeScript server that receives GitHub webhook events and forwards them to Discord channels using embeds.

## Features

- **Multi-repository support** - Route different repos to different Discord channels
- **Event filtering** - Only processes relevant events (issues, PRs, reviews, push)
- **Clean Discord embeds** - Short, readable messages with consistent colors
- **All branch support** - Push events work on any branch
- **Modular architecture** - Well-organized codebase for easy maintenance

## Supported Events

| Event | Actions Handled |
|-------|----------------|
| `issues` | opened, closed, reopened |
| `pull_request` | opened, closed, merged, reopened, review_requested, ready_for_review, converted_to_draft, auto_merge_enabled, auto_merge_disabled |
| `pull_request_review` | approved, changes_requested, commented |
| `pull_request_review_comment` | created |
| `issue_comment` | created |
| `push` | all branches (tags ignored) |

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file:

```env
PORT=4001
DISCORD_WEBHOOK_AI=https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_CORE=https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_HOMELAND=https://discord.com/api/webhooks/...
DISCORD_WEBHOOK_WEB=https://discord.com/api/webhooks/...
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DISCORD_WEBHOOK_*` | Discord webhook URLs for each repo | - |

### Verifying Configuration

When the server starts, it will display the webhook configuration status:

```
🚀 Server running on port 4001
Configured webhooks:
  ng-ai: ✓ configured
  ng-core: ✓ configured
  ng-homeland: ✓ configured
  ng-web: ✓ configured
```

If any show as `✗ NOT CONFIGURED`, check that the corresponding environment variable is set in your `.env` file.

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### With PM2 (recommended)

```bash
npm run build
pm2 start dist/server.js --name github-webhook
pm2 save
pm2 startup
```

### Restart with PM2

```bash
pm2 restart github-webhook
```

### View Logs

```bash
pm2 logs github-webhook
```

## Project Structure

```
src/
├── server.ts                 # Main entry point - Express app setup
├── config/
│   ├── index.ts             # Export all config
│   ├── webhooks.ts          # Webhook URL mappings
│   └── colors.ts            # Color constants
├── types/
│   ├── github.ts            # GitHub webhook payload types
│   └── discord.ts           # Discord embed types
├── embeds/
│   ├── index.ts             # Main embed router (buildEmbed function)
│   ├── pull-request.ts      # PR embed builders
│   ├── issue.ts             # Issue embed builders
│   ├── review.ts            # Review embed builders
│   └── push.ts              # Push embed builders
├── utils/
│   └── text.ts              # Text utility functions
└── handlers/
    └── webhook.ts           # Main webhook POST handler
```

### Module Overview

- **server.ts** - Express application setup, route registration, and server startup
- **config/** - Configuration values including webhook URLs and color constants
- **types/** - TypeScript type definitions for GitHub and Discord data structures
- **embeds/** - Embed builder functions for each GitHub event type
- **utils/** - Shared utility functions (text formatting, etc.)
- **handlers/** - Request handlers for webhook endpoints

## GitHub Webhook Setup

1. Go to repository **Settings** → **Webhooks**
2. Click **Add webhook**
3. Set **Payload URL** to: `http://your-server:4001/github/webhook`
4. Set **Content type** to: `application/json`
5. Select events: Issues, Pull requests, Pull request reviews, Pushes
6. Click **Add webhook**

**All repositories use the same webhook URL.** The server routes based on repository name.

## Repository Mapping

| Repository | Environment Variable |
|------------|---------------------|
| `ng-ai` | `DISCORD_WEBHOOK_AI` |
| `ng-core` | `DISCORD_WEBHOOK_CORE` |
| `ng-homeland` | `DISCORD_WEBHOOK_HOMELAND` |
| `ng-web` | `DISCORD_WEBHOOK_WEB` |

## Color Scheme

| Color | Hex | Usage |
|-------|-----|-------|
| Green | `0x57F287` | Opened / Success |
| Red | `0xED4245` | Closed / Failed |
| Yellow | `0xFEE75C` | Reviews / Pending |
| Blue | `0x3498DB` | Push events / Comments |
| Purple | `0x9B59B6` | Merged PRs |
| Gray | `0x95A5A6` | Fallback |

## Troubleshooting

### No Discord message received

1. **Check logs:**
   ```bash
   pm2 logs github-webhook
   ```
   Look for `❌ Repo not mapped` or `❌ Failed to send webhook`

2. **Verify webhook URL in .env:**
   - Ensure the correct `DISCORD_WEBHOOK_*` variable is set
   - Test URL in browser (should show JSON with webhook info)

3. **Check GitHub webhook delivery:**
   - Go to repo Settings → Webhooks → Click your webhook
   - Scroll to "Recent Deliveries"
   - Check response status (should be `200 OK`)

4. **Verify repository name:**
   - Debug log shows "Repository name: xyz"
   - Ensure it matches keys: `ng-ai`, `ng-core`, `ng-homeland`, `ng-web`

5. **Test with ping:**
   ```bash
   curl -X POST http://localhost:4001/github/webhook \
     -H "Content-Type: application/json" \
     -H "X-GitHub-Event: ping"
   ```
   Should return `pong`
