import { COLORS } from "../config";
import { DiscordEmbed } from "../types/discord";
import { IssuePayload, IssueCommentPayload } from "../types/github";
import { truncateText } from "../utils/text";

export function buildIssueEmbed(payload: IssuePayload): DiscordEmbed | null {
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

export function buildIssueCommentEmbed(
  payload: IssueCommentPayload,
): DiscordEmbed | null {
  const { action, comment, repository, issue, sender } = payload;

  if (action !== "created") {
    return null;
  }

  const description = truncateText(comment.body, 200);
  const isPR = !!issue.pull_request;

  return {
    title: isPR ? "💬 PR comment" : "💬 Issue comment",
    description,
    url: comment.html_url,
    color: COLORS.blue,
    fields: [
      { name: "Repository", value: repository.name, inline: true },
      { name: "Author", value: comment.user.login, inline: true },
      { name: isPR ? "Pull Request" : "Issue", value: `#${issue.number}`, inline: true },
    ],
    author: {
      name: sender?.login || comment.user.login,
      icon_url: sender?.avatar_url || comment.user.avatar_url,
    },
    timestamp: new Date().toISOString(),
  };
}
