import { COLORS } from "../config";
import { DiscordEmbed } from "../types/discord";
import { ReviewPayload, ReviewCommentPayload } from "../types/github";
import { truncateText } from "../utils/text";

export function buildReviewEmbed(payload: ReviewPayload): DiscordEmbed | null {
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

export function buildReviewCommentEmbed(
  payload: ReviewCommentPayload,
): DiscordEmbed | null {
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
