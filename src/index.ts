import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const WEBHOOKS: Record<string, string | undefined> = {
  ai: process.env.DISCORD_WEBHOOK_AI,
  core: process.env.DISCORD_WEBHOOK_CORE,
  homeland: process.env.DISCORD_WEBHOOK_HOMELAND,
  web: process.env.DISCORD_WEBHOOK_WEB,
};

// Color constants
const COLORS: { [key: string]: number } = {
  green: 0x57F287,
  red: 0xED4245,
  yellow: 0xFEE75C,
  blue: 0x3498DB,
  purple: 0x9B59B6,
  gray: 0x95A5A6,
};

// GitHub webhook payload types
interface GitHubUser {
  login: string;
  avatar_url?: string;
}

interface GitHubRepository {
  name: string;
  full_name?: string;
}

interface GitHubLabel {
  name: string;
  color?: string;
}

interface BasePayload {
  repository: GitHubRepository;
  sender?: GitHubUser;
  action?: string;
}

interface PullRequestPayload extends BasePayload {
  action: "opened" | "closed" | "edited" | "reopened" | "synchronize" | "merged";
  pull_request: {
    title: string;
    html_url: string;
    user: GitHubUser;
    base: { ref: string };
    head: { ref: string };
    merged: boolean;
    merged_at?: string;
  };
}

interface IssuePayload extends BasePayload {
  action: "opened" | "closed" | "edited" | "reopened" | "deleted";
  issue: {
    title: string;
    html_url: string;
    user: GitHubUser;
    labels?: GitHubLabel[];
    state: string;
  };
}

interface ReviewPayload extends BasePayload {
  action: "submitted" | "edited" | "dismissed";
  review: {
    state: "approved" | "changes_requested" | "commented" | "pending";
    body?: string;
    html_url: string;
    user: GitHubUser;
    pull_request_url: string;
  };
  pull_request?: {
    title: string;
    html_url: string;
    number: number;
  };
}

interface ReviewCommentPayload extends BasePayload {
  action: "created" | "edited" | "deleted";
  comment: {
    body: string;
    html_url: string;
    user: GitHubUser;
    path?: string;
    commit_id?: string;
    pull_request_url?: string;
  };
}

interface PushPayload extends BasePayload {
  ref: string;
  before?: string;
  after?: string;
  pusher: {
    name: string;
    email?: string;
  };
  commits?: Array<{
    id: string;
    message: string;
    author?: {
      name?: string;
      email?: string;
    };
    url?: string;
  }>;
  distinct?: number;
  head_commit?: {
    id: string;
    message: string;
    timestamp?: string;
  };
  compare?: string;
  repository: {
    name: string;
    full_name?: string;
    owner?: {
      name?: string;
      login?: string;
    };
  };
}

type GitHubPayload =
  | PullRequestPayload
  | IssuePayload
  | ReviewPayload
  | ReviewCommentPayload
  | PushPayload;

interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  author?: { name: string; icon_url?: string };
  footer?: { text: string };
  timestamp: string;
}

// Build embed for pull request events
function buildPullRequestEmbed(payload: PullRequestPayload): DiscordEmbed | null {
  const { action, pull_request, repository, sender } = payload;
  const pr = pull_request;

  if (action === "synchronize" || action === "edited") {
    return null;
  }

  let color = COLORS.gray;
  let title = "";
  let description = "";

  switch (action) {
    case "opened":
      color = COLORS.green;
      title = `🔀 Pull Request ${action}`;
      description = `**${pr.title}**`;
      break;
    case "closed":
      if (pr.merged) {
        color = COLORS.purple;
        title = "🔀 Pull Request merged";
        description = `**${pr.title}**`;
      } else {
        color = COLORS.red;
        title = `🔀 Pull Request ${action}`;
        description = `**${pr.title}**`;
      }
      break;
    case "reopened":
      color = COLORS.green;
      title = `🔀 Pull Request ${action}`;
      description = `**${pr.title}**`;
      break;
    default:
      return null;
  }

  return {
    title,
    description,
    url: pr.html_url,
    color,
    fields: [
      { name: "Repository", value: repository.name, inline: true },
      { name: "Author", value: pr.user.login, inline: true },
      { name: "Branch", value: `${pr.head.ref} → ${pr.base.ref}`, inline: false },
    ],
    author: {
      name: sender?.login || pr.user.login,
      icon_url: sender?.avatar_url || pr.user.avatar_url,
    },
    timestamp: new Date().toISOString(),
  };
}

// Build embed for issue events
function buildIssueEmbed(payload: IssuePayload): DiscordEmbed | null {
  const { action, issue, repository, sender } = payload;

  let color = COLORS.gray;
  let title = "";

  switch (action) {
    case "opened":
      color = COLORS.green;
      title = "📋 Issue opened";
      break;
    case "closed":
      color = COLORS.red;
      title = "📋 Issue closed";
      break;
    case "reopened":
      color = COLORS.green;
      title = "📋 Issue reopened";
      break;
    default:
      return null;
  }

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    { name: "Repository", value: repository.name, inline: true },
    { name: "Author", value: issue.user.login, inline: true },
  ];

  if (issue.labels && issue.labels.length > 0) {
    const labels = issue.labels.map((l) => l.name).join(", ");
    fields.push({ name: "Labels", value: labels, inline: false });
  }

  return {
    title,
    description: `**${issue.title}**`,
    url: issue.html_url,
    color,
    fields,
    author: {
      name: sender?.login || issue.user.login,
      icon_url: sender?.avatar_url || issue.user.avatar_url,
    },
    timestamp: new Date().toISOString(),
  };
}

// Build embed for review events
function buildReviewEmbed(payload: ReviewPayload): DiscordEmbed | null {
  const { action, review, repository, sender } = payload;

  if (action !== "submitted") {
    return null;
  }

  let color = COLORS.gray;
  let title = "";
  let emoji = "";

  switch (review.state) {
    case "approved":
      color = COLORS.green;
      title = "✅ Review approved";
      emoji = "✅";
      break;
    case "changes_requested":
      color = COLORS.red;
      title = "🔄 Changes requested";
      emoji = "🔄";
      break;
    case "commented":
      color = COLORS.yellow;
      title = "💬 Review commented";
      emoji = "💬";
      break;
    case "pending":
      color = COLORS.yellow;
      title = "⏳ Review pending";
      emoji = "⏳";
      break;
    default:
      return null;
  }

  const description = review.body
    ? truncateText(review.body, 200)
    : "No comment provided";

  return {
    title,
    description: `${emoji} ${description}`,
    url: review.html_url,
    color,
    fields: [
      { name: "Repository", value: repository.name, inline: true },
      { name: "Reviewer", value: review.user.login, inline: true },
    ],
    author: {
      name: sender?.login || review.user.login,
      icon_url: sender?.avatar_url || review.user.avatar_url,
    },
    timestamp: new Date().toISOString(),
  };
}

// Build embed for review comment events
function buildReviewCommentEmbed(payload: ReviewCommentPayload): DiscordEmbed | null {
  const { action, comment, repository, sender } = payload;

  if (action !== "created") {
    return null;
  }

  const description = truncateText(comment.body, 200);

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    { name: "Repository", value: repository.name, inline: true },
    { name: "Author", value: comment.user.login, inline: true },
  ];

  if (comment.path) {
    fields.push({ name: "File", value: comment.path, inline: false });
  }

  return {
    title: "💬 Review comment",
    description,
    url: comment.html_url,
    color: COLORS.yellow,
    fields,
    author: {
      name: sender?.login || comment.user.login,
      icon_url: sender?.avatar_url || comment.user.avatar_url,
    },
    timestamp: new Date().toISOString(),
  };
}

// Build embed for push events
function buildPushEmbed(payload: PushPayload): DiscordEmbed | null {
  const { ref, pusher, commits, repository, compare, before, after } = payload;

  if (!ref || ref.startsWith("refs/tags/")) {
    return null;
  }

  const branchName = ref.replace("refs/heads/", "");
  const commitCount = commits?.length || 0;

  if (commitCount === 0) {
    return null;
  }

  const commitMessages = commits
    ? commits
        .slice(0, 3)
        .map((c) => `• \`${c.id.substring(0, 7)}\` ${truncateText(c.message.split("\n")[0] || "", 60)}`)
        .join("\n")
    : "";

  const moreCommits = commitCount > 3 ? `\n... and ${commitCount - 3} more` : "";

  let url: string | undefined = compare;
  if (!url && repository.full_name && before && after) {
    url = `https://github.com/${repository.full_name}/compare/${before.substring(0, 7)}...${after.substring(0, 7)}`;
  }

  return {
    title: `🚀 Push to \`${branchName}\``,
    description: `${commitMessages}${moreCommits}`,
    url,
    color: COLORS.blue,
    fields: [
      { name: "Repository", value: repository.name, inline: true },
      { name: "Pusher", value: pusher.name, inline: true },
      { name: "Commits", value: commitCount.toString(), inline: true },
    ],
    author: {
      name: pusher.name,
    },
    timestamp: new Date().toISOString(),
  };
}

// Truncate text to max length
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

// Main router function
function buildEmbed(eventName: string, payload: GitHubPayload): DiscordEmbed | null {
  switch (eventName) {
    case "pull_request":
      return buildPullRequestEmbed(payload as PullRequestPayload);
    case "issues":
      return buildIssueEmbed(payload as IssuePayload);
    case "pull_request_review":
      return buildReviewEmbed(payload as ReviewPayload);
    case "pull_request_review_comment":
      return buildReviewCommentEmbed(payload as ReviewCommentPayload);
    case "push":
      return buildPushEmbed(payload as PushPayload);
    default:
      return null;
  }
}

app.post("/github/webhook", async (req: Request, res: Response) => {
  const eventHeader = req.headers["x-github-event"];
  const event = typeof eventHeader === "string" ? eventHeader : Array.isArray(eventHeader) ? eventHeader[0] : undefined;
  const payload = req.body as GitHubPayload;

  const repoName: string | undefined = payload?.repository?.name;
  const webhookUrl = repoName ? WEBHOOKS[repoName] : undefined;

  if (!webhookUrl) {
    return res.status(200).send("Repo not mapped");
  }

  if (event === "ping") {
    return res.send("pong");
  }

  if (!event) {
    return res.sendStatus(400);
  }

  const embed = buildEmbed(event, payload);

  if (!embed) {
    return res.sendStatus(200);
  }

  try {
    await axios.post(webhookUrl, { embeds: [embed] });
  } catch (error) {
    console.error(`Failed to send webhook for ${repoName}:`, error);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
