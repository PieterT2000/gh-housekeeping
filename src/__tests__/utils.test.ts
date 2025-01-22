import { test, expect, describe } from "bun:test";
import {
  extractIssueNumberFromBranchName,
  hasLinkedIssueBotComment,
} from "../utils.ts";

describe("extract issue number from branch name", () => {
  test("for xx-branch format", () => {
    const branchName = "123-branch";
    const issueNumber = extractIssueNumberFromBranchName(branchName);
    expect(issueNumber).toBe(123);
  });
  test.each([
    ["123-branch", 123],
    ["123_branch", 123],
    ["branch-blah", undefined],
    ["branch-123-asdf", undefined],
    ["123-branch-456", 123],
    ["123_456-jasdf", 123],
  ])("for %s format", (branchName, issueNumber) => {
    expect<number | undefined>(
      extractIssueNumberFromBranchName(branchName)
    ).toBe(issueNumber);
  });
});

describe("getLinkedIssueFromBotComment", () => {
  test("if the comment is from the bot and contains the issue number", () => {
    const comments = [
      { userName: "github-actions[bot]", body: "Adresses #123" },
    ];
    expect(
      hasLinkedIssueBotComment({
        comments,
        issueNumber: 123,
      })
    ).toBe(true);
  });

  test("if the comment is not from the bot", () => {
    const comments = [{ userName: "pietert2000", body: "Adresses #123" }];
    expect(
      hasLinkedIssueBotComment({
        comments,
        issueNumber: 123,
      })
    ).toBe(false);
  });
  test("if the comment does not contain the issue number", () => {
    const comments = [{ userName: "pietert2000", body: "Adresses" }];
    expect(
      hasLinkedIssueBotComment({
        comments,
        issueNumber: 123,
      })
    ).toBe(false);
  });
});
