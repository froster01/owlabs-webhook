export const WEBHOOKS: Record<string, string | undefined> = {
  "ng-ai": process.env.DISCORD_WEBHOOK_AI,
  "ng-core": process.env.DISCORD_WEBHOOK_CORE,
  "ng-homeland": process.env.DISCORD_WEBHOOK_HOMELAND,
  "ng-web": process.env.DISCORD_WEBHOOK_WEB,
};
