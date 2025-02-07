export function extractBranchName() {
  const branchName = process.env.GITHUB_HEAD_REF as string;

  if (!branchName) {
    throw new Error("Unable to retrieve the branch name.");
  }
  return branchName;
}

export function extractIssueNumberFromBranchName(branchName: string) {
  const issueNumberMatch = branchName.match(/^(\d+)[_-].*/);
  if (!issueNumberMatch) {
    return;
  }
  return parseInt(issueNumberMatch[1]);
}

const botUsername = "github-actions[bot]";

type LinkedIssueParameters = {
  comments: { userName: string | undefined; body: string | undefined }[];
  prNumber: number;
};

function getLinkedIssueBotComment(params: LinkedIssueParameters) {
  return params.comments.find(
    (comment) =>
      comment.userName?.toLowerCase() === botUsername.toLowerCase() &&
      strContains(comment.body, `${params.prNumber}`)
  );
}

export function hasLinkedIssueBotComment(params: LinkedIssueParameters) {
  return !!getLinkedIssueBotComment(params);
}

export function strContains(a: string | undefined, b: string) {
  if (!a) {
    return false;
  }
  return a.toLowerCase().includes(b.toLowerCase());
}
