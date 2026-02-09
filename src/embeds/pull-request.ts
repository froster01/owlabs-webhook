import { COLORS } from "../config";
import { DiscordEmbed } from "../types/discord";
import { PullRequestPayload } from "../types/github";

export function buildPullRequestEmbed(
  payload: PullRequestPayload,
): DiscordEmbed | null {
  const { action, pull_request, repository, sender, requested_reviewer } =
    payload;
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
      title = `🔀 Pull Request opened`;
      description = `**${pr.title}**`;
      break;
    case "closed":
      if (pr.merged) {
        color = COLORS.purple;
        title = "🔀 Pull Request merged";
        description = `**${pr.title}**`;
      } else {
        color = COLORS.red;
        title = `🔀 Pull Request closed`;
        description = `**${pr.title}**`;
      }
      break;
    case "reopened":
      color = COLORS.green;
      title = `🔀 Pull Request reopened`;
      description = `**${pr.title}**`;
      break;
    case "review_requested":
      color = COLORS.yellow;
      title = `👀 Review requested`;
      description = `**${pr.title}**`;
      break;
    case "review_request_removed":
      color = COLORS.gray;
      title = `❌ Review request removed`;
      description = `**${pr.title}**`;
      break;
    case "ready_for_review":
      color = COLORS.green;
      title = `✅ Ready for review`;
      description = `**${pr.title}**`;
      break;
    case "converted_to_draft":
      color = COLORS.gray;
      title = `📝 Converted to draft`;
      description = `**${pr.title}**`;
      break;
    case "auto_merge_enabled":
      color = COLORS.blue;
      title = `🤖 Auto-merge enabled`;
      description = `**${pr.title}**`;
      break;
    case "auto_merge_disabled":
      color = COLORS.gray;
      title = `⏸️ Auto-merge disabled`;
      description = `**${pr.title}**`;
      break;
    default:
      return null;
  }

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    { name: "Repository", value: repository.name, inline: true },
    { name: "Author", value: pr.user.login, inline: true },
  ];

  if (action === "review_requested" && requested_reviewer) {
    fields.push({
      name: "Requested reviewer",
      value: requested_reviewer.login,
      inline: true,
    });
  }

  fields.push({
    name: "Branch",
    value: `${pr.head.ref} → ${pr.base.ref}`,
    inline: false,
  });

  return {
    title,
    description,
    url: pr.html_url,
    color,
    fields,
    author: {
      name: sender?.login || pr.user.login,
      icon_url: sender?.avatar_url || pr.user.avatar_url,
    },
    timestamp: new Date().toISOString(),
  };
}
