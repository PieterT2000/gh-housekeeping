import * as github from "@actions/github";

export type Octokit = ReturnType<typeof github.getOctokit>;

export enum Task {
  AutolinkIssue = "autolink-issue",
  UpdateIssueStatus = "update-issue-status",
}
