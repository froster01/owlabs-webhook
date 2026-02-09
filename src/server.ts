import dotenv from "dotenv";

// Load environment variables before importing config
dotenv.config();

import express from "express";
import { WEBHOOKS } from "./config";
import { handleWebhook } from "./handlers/webhook";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Register routes
app.post("/github/webhook", handleWebhook);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("Configured webhooks:");
  Object.entries(WEBHOOKS).forEach(([repo, url]) => {
    console.log(`  ${repo}: ${url ? "✓ configured" : "✗ NOT CONFIGURED"}`);
  });
});
