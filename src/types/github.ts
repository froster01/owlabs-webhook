export interface GitHubUser {
  login: string;
  avatar_url?: string;
}

export interface GitHubRepository {
  name: string;
  full_name?: string;
}

export interface GitHubLabel {
  name: string;
  color?: string;
}

export interface BasePayload {
  repository: GitHubRepository;
  sender?: GitHubUser;
  action?: string;
}

export interface PullRequestPayload extends BasePayload {
  action:
    | "opened"
    | "closed"
    | "edited"
    | "reopened"
    | "synchronize"
    | "review_requested"
    | "review_request_removed"
    | "ready_for_review"
    | "converted_to_draft"
    | "merged"
    | "auto_merge_enabled"
    | "auto_merge_disabled";
  pull_request: {
    title: string;
    html_url: string;
    user: GitHubUser;
    base: { ref: string };
    head: { ref: string };
    merged: boolean;
    merged_at?: string;
  };
  requested_reviewer?: GitHubUser;
}

export interface IssuePayload extends BasePayload {
  action: "opened" | "closed" | "edited" | "reopened" | "deleted";
  issue: {
    title: string;
    html_url: string;
    user: GitHubUser;
    labels?: GitHubLabel[];
    state: string;
  };
}

export interface ReviewPayload extends BasePayload {
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

export interface ReviewCommentPayload extends BasePayload {
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

export interface IssueCommentPayload extends BasePayload {
  action: "created" | "edited" | "deleted";
  comment: {
    body: string;
    html_url: string;
    user: GitHubUser;
    created_at: string;
    updated_at: string;
  };
  issue: {
    number: number;
    title: string;
    html_url: string;
    pull_request?: {
      html_url: string;
      diff_url: string;
    };
  };
}

export interface PushPayload extends BasePayload {
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

export type GitHubPayload =
  | PullRequestPayload
  | IssuePayload
  | ReviewPayload
  | ReviewCommentPayload
  | IssueCommentPayload
  | PushPayload;
