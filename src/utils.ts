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
  issueNumber: number;
};

function getLinkedIssueNumberFromBotComment(params: LinkedIssueParameters) {
  return params.comments.find(
    (comment) =>
      comment.userName === botUsername &&
      strContains(comment.body, `#${params.issueNumber}`)
  );
}

export function hasLinkedIssueBotComment(params: LinkedIssueParameters) {
  return !!getLinkedIssueNumberFromBotComment(params);
}

export function strContains(a: string | undefined, b: string) {
  if (!a) {
    return false;
  }
  return a.toLowerCase().includes(b.toLowerCase());
}
