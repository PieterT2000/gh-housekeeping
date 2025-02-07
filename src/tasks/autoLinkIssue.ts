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

  let issue: Awaited<ReturnType<typeof octokit.rest.issues.get>>;
  try {
    issue = await octokit.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });
  } catch (error) {
    core.warning(
      `Failed to get issue with number ${issueNumber}. This could be because the issue number in the branch name is invalid. Skipping...`
    );
    return;
  }

  const issueComments = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 200,
  });

  const botComment = hasLinkedIssueBotComment({
    comments: issueComments.data.map((comment) => ({
      userName: comment.user?.login,
      body: comment.body,
    })),
    prNumber,
  });

  if (!botComment) {
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
