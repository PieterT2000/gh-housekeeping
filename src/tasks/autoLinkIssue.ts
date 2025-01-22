import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  extractBranchName,
  extractIssueNumberFromBranchName,
  hasLinkedIssueBotComment,
} from "../utils.ts";
import type { Octokit } from "../types.ts";

export async function autolinkIssue(octokit: Octokit, prNumber: number) {
  const { owner, repo } = github.context.repo;

  const branchName = extractBranchName();
  const issueNumber = extractIssueNumberFromBranchName(branchName);

  if (!issueNumber) {
    core.warning(`⚠️ No issue number found in branch name: ${branchName}.`);
    return;
  }

  const reviewComments = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
  });

  const botComment = hasLinkedIssueBotComment({
    comments: reviewComments.data.map((comment) => ({
      userName: comment.user?.login,
      body: comment.body,
    })),
    issueNumber,
  });

  if (!botComment) {
    // Create a comment on the PR as well as on the issue
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `Adresses #${issueNumber} `,
    });

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `Addressed by #${prNumber} `,
    });
    core.info(
      `✅ Linked issue ${issueNumber} to PR ${prNumber} by bot comment.`
    );
  }
}
