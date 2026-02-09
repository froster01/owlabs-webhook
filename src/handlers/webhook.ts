import { Request, Response } from "express";
import axios from "axios";
import { WEBHOOKS } from "../config";
import { buildEmbed } from "../embeds";
import { GitHubPayload } from "../types/github";

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const eventHeader = req.headers["x-github-event"];
  const event =
    typeof eventHeader === "string"
      ? eventHeader
      : Array.isArray(eventHeader)
        ? eventHeader[0]
        : undefined;
  const payload = req.body as GitHubPayload;

  console.log("=== Incoming webhook ===");
  console.log("Event header:", eventHeader);
  console.log("Event:", event);
  console.log("Full payload:", JSON.stringify(payload, null, 2));

  const repoName: string | undefined = payload?.repository?.name;
  console.log("Repository name:", repoName);
  console.log("Available repo keys:", Object.keys(WEBHOOKS));
  console.log("Environment vars loaded:", {
    AI: !!process.env.DISCORD_WEBHOOK_AI,
    CORE: !!process.env.DISCORD_WEBHOOK_CORE,
    HOMELAND: !!process.env.DISCORD_WEBHOOK_HOMELAND,
    WEB: !!process.env.DISCORD_WEBHOOK_WEB,
  });

  const webhookUrl = repoName ? WEBHOOKS[repoName] : undefined;
  console.log("Webhook URL found:", !!webhookUrl);

  if (!webhookUrl) {
    console.log("❌ Repo not mapped or webhook URL not configured");
    console.log("❌ Looking for repo name:", `"${repoName}"`);
    console.log(
      "❌ Available mappings:",
      Object.entries(WEBHOOKS).map(
        ([k, v]) => `${k}: ${v ? "configured" : "MISSING"}`,
      ),
    );
    res.status(200).send("Repo not mapped");
    return;
  }

  if (event === "ping") {
    console.log("🏓 Ping received, responding with pong");
    res.send("pong");
    return;
  }

  if (!event) {
    console.log("❌ No event header found");
    res.sendStatus(400);
    return;
  }

  const embed = buildEmbed(event, payload);
  console.log("Embed built:", !!embed);

  if (!embed) {
    console.log("⚠️ No embed returned (event ignored)");
    res.sendStatus(200);
    return;
  }

  try {
    console.log("📤 Sending to Discord...");
    await axios.post(webhookUrl, { embeds: [embed] });
    console.log("✅ Successfully sent to Discord");
  } catch (error) {
    console.error(`❌ Failed to send webhook for ${repoName}:`, error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
  }

  res.sendStatus(200);
}
