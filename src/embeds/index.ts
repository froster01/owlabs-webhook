import { DiscordEmbed } from "../types/discord";
import {
  GitHubPayload,
  PullRequestPayload,
  IssuePayload,
  IssueCommentPayload,
  ReviewPayload,
  ReviewCommentPayload,
  PushPayload,
} from "../types/github";
import { buildPullRequestEmbed } from "./pull-request";
import { buildIssueEmbed, buildIssueCommentEmbed } from "./issue";
import { buildReviewEmbed, buildReviewCommentEmbed } from "./review";
import { buildPushEmbed } from "./push";

export function buildEmbed(
  eventName: string,
  payload: GitHubPayload,
): DiscordEmbed | null {
  console.log("Building embed for event:", eventName);

  switch (eventName) {
    case "pull_request":
      return buildPullRequestEmbed(payload as PullRequestPayload);
    case "issues":
      return buildIssueEmbed(payload as IssuePayload);
    case "issue_comment":
      return buildIssueCommentEmbed(payload as IssueCommentPayload);
    case "pull_request_review":
      return buildReviewEmbed(payload as ReviewPayload);
    case "pull_request_review_comment":
      return buildReviewCommentEmbed(payload as ReviewCommentPayload);
    case "push":
      return buildPushEmbed(payload as PushPayload);
    default:
      console.log("Unknown event, ignoring:", eventName);
      return null;
  }
}
