import { test, expect, describe, mock, beforeEach } from "bun:test";
import { autolinkIssue } from "../tasks/autoLinkIssue";
import issueCommentsData from "./data/issue-comments.json";

const MOCK_OWNER = "test-owner";
const MOCK_REPO = "test-repo";
const MOCK_BRANCH_NAME = "123-test-branch";
const MOCK_ISSUE_NUMBER = 123;
const MOCK_PR_NUMBER = 1426;

// Mock github.context
mock.module("@actions/github", () => {
  return {
    context: {
      repo: { owner: MOCK_OWNER, repo: MOCK_REPO },
    },
  };
});

// Mock core.warning and core.info
mock.module("@actions/core", () => {
  return {
    warning: mock(() => {}),
    info: mock(() => {}),
  };
});

// Mock utils functions
mock.module("../utils", () => {
  return {
    extractBranchName: mock(() => MOCK_BRANCH_NAME),
    extractIssueNumberFromBranchName: mock(() => MOCK_ISSUE_NUMBER),
  };
});

describe("autolinkIssue", () => {
  let mockOctokit: any;

  beforeEach(() => {
    mockOctokit = {
      rest: {
        issues: {
          get: mock(async () => ({
            data: {
              number: MOCK_ISSUE_NUMBER,
              title: "Test Issue",
            },
          })),
          listComments: mock(async () => ({
            data: issueCommentsData,
          })),
          createComment: mock(async () => ({})),
        },
      },
    };
  });

  test("should create a comment when no bot comment exists", async () => {
    // Override the default mock for listComments to return empty array
    mockOctokit.rest.issues.listComments.mockResolvedValueOnce({ data: [] });

    await autolinkIssue(mockOctokit as any, MOCK_PR_NUMBER);

    // Verify createComment was called with correct parameters
    expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith({
      owner: MOCK_OWNER,
      repo: MOCK_REPO,
      issue_number: MOCK_ISSUE_NUMBER,
      body: `Addressed by #${MOCK_PR_NUMBER} `,
    });
  });

  test("should not create a comment when bot comment already exists", async () => {
    await autolinkIssue(mockOctokit as any, MOCK_PR_NUMBER);

    expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  test("should handle case where no issue number in branch name", async () => {
    mock.module("../utils", () => {
      return {
        extractIssueNumberFromBranchName: mock(() => undefined),
        extractBranchName: mock(() => MOCK_BRANCH_NAME),
      };
    });

    await autolinkIssue(mockOctokit as any, MOCK_PR_NUMBER);

    expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  test("should handle invalid issue numbers", async () => {
    mockOctokit.rest.issues.get.mockImplementationOnce(async () => {
      throw new Error("Not found");
    });

    await autolinkIssue(mockOctokit as any, MOCK_PR_NUMBER);

    expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
  });
});
