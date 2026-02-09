export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  author?: { name: string; icon_url?: string };
  footer?: { text: string };
  timestamp: string;
}
