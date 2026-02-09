import { COLORS } from "../config";
import { DiscordEmbed } from "../types/discord";
import { PushPayload } from "../types/github";
import { truncateText } from "../utils/text";

export function buildPushEmbed(payload: PushPayload): DiscordEmbed | null {
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
        .map(
          (c) =>
            `• \`${c.id.substring(0, 7)}\` ${truncateText(c.message.split("\n")[0] || "", 60)}`,
        )
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
