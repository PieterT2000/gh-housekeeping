import * as core from "@actions/core";
import * as github from "@actions/github";
import { autolinkIssue } from "./tasks/autoLinkIssue.ts";
import { updateIssueStatus } from "./tasks/updateIssueStatus.ts";
import { Task } from "./types.ts";

const VALID_EVENTS = new Set(["pull_request", "pull_request_target"]);

async function run(): Promise<void> {
  validateEvent();
  const inputs = validateInputs();

  const octokit = github.getOctokit(inputs.token);
  const prNumber = github.context.payload.pull_request?.number;

  // TS-guard: this should theoretically never happen due to validateEvent()
  if (!prNumber) {
    throw new Error("Unable to retrieve the PR number.");
  }

  if (inputs.task === Task.AutolinkIssue) {
    await autolinkIssue(octokit, prNumber);
  } else if (inputs.task === Task.UpdateIssueStatus) {
    await updateIssueStatus(octokit, prNumber, {
      qaColumn: inputs.qaColumn,
      doneColumn: inputs.doneColumn,
      skipQaLabel: inputs.skipQaLabel,
      projectName: inputs.projectName,
    });
  }
}

function validateEvent(): void {
  const event = github.context.eventName;
  if (!VALID_EVENTS.has(event)) {
    throw new Error(
      `This action works only for pull requests, but has been triggered for ${event}`
    );
  }
}

function validateInputs() {
  const task = core.getInput("task", {
    required: true,
  });
  if (!Object.values(Task).includes(task as Task)) {
    throw new Error(`Invalid task: ${task}`);
  }
  const token = core.getInput("token", {
    required: true,
  });

  if (task === Task.UpdateIssueStatus) {
    const projectName = core.getInput("project-name", {
      required: true,
    });
    const qaColumn = core.getInput("qa-column");
    const doneColumn = core.getInput("done-column", {
      required: true,
    });
    const skipQaLabel = core.getInput("skip-qa-label");

    return {
      task: Task.UpdateIssueStatus,
      token,
      projectName,
      qaColumn,
      doneColumn,
      skipQaLabel,
    } as const;
  } else {
    return { task: Task.AutolinkIssue, token } as const;
  }
}

run();
