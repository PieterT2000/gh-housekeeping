import * as core from "@actions/core";
import * as github from "@actions/github";
import type { Octokit } from "../types.ts";
import { extractBranchName, strContains } from "../utils.ts";
import { extractIssueNumberFromBranchName } from "../utils.ts";

export async function updateIssueStatus(
  octokit: Octokit,
  prNumber: number,
  inputs: {
    projectName: string;
    doneColumn: string;
    qaColumn: string | undefined;
    skipQaLabel: string | undefined;
  }
) {
  const { owner, repo } = github.context.repo;
  const branchName = extractBranchName();
  const issueNumber = extractIssueNumberFromBranchName(branchName);

  if (!issueNumber) {
    core.warning(`⚠️ No issue number found in branch name: ${branchName}.`);
    return;
  }

  const pr = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  const prHasSkipQaLabel = pr.data.labels.some(
    (label) =>
      !!inputs.skipQaLabel && strContains(label.name, inputs.skipQaLabel)
  );

  const shouldSkipQATesting = !inputs.qaColumn || prHasSkipQaLabel;

  const { data: updatedIssue } = await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state: shouldSkipQATesting ? "closed" : "open",
  });
  const node_id = updatedIssue.node_id;

  if (shouldSkipQATesting) {
    core.info(`Moving issue ${issueNumber} to done...`);
    moveIssueCardToColumn(octokit, {
      issue_node_id: node_id,
      columnName: inputs.doneColumn,
      projectName: inputs.projectName,
    });
  } else {
    core.info(`Moving issue ${issueNumber} to QA/Testing...`);
    moveIssueCardToColumn(octokit, {
      issue_node_id: node_id,
      columnName: inputs.qaColumn!,
      projectName: inputs.projectName,
    });
  }
}

async function moveIssueCardToColumn(
  octokit: Octokit,
  inputs: {
    issue_node_id: string;
    columnName: string;
    projectName: string;
  }
) {
  /**  Approach:
    1. Find the status field Id and the desired status field option Id
    2. Get the project card id - by using projectId and issue.node_id
    3. Move card to new column by updating Status field
  */
  const { owner, repo } = github.context.repo;
  core.info(`context: ${JSON.stringify({ owner, repo, inputs }, null, 2)}`);

  const getStatusFieldOptionsData = await octokit.graphql<{ repository: any }>(
    `query getStatusFieldOptions($owner: String!, $repo: String!, $projectName: String!) {
  repository(owner: $owner, name: $repo) {
    projectsV2(query: $projectName, first: 5) {
      nodes {
        id
        field(name:"Status") {
          ...on ProjectV2SingleSelectField {
            id
            name
            options {
              name
              id
              color
            }
          }
        }
      }
    }
  }
}`,
    {
      owner,
      repo,
      projectName: inputs.projectName,
    }
  );

  core.info(JSON.stringify(getStatusFieldOptionsData, null, 2));

  const project = getStatusFieldOptionsData?.repository?.projectsV2?.nodes?.[0];

  if (!project) {
    throw new Error("Project not found. Check projectName argument.");
  }

  const projectId = project?.id;
  const statusFieldOptions = project?.field?.options;

  if (!statusFieldOptions) {
    throw new Error(
      "Please check if the project cards have a field called 'Status'."
    );
  }

  const statusFieldId = project?.field?.id;
  const statusFieldOption = statusFieldOptions.find((option: any) =>
    strContains(option.name, inputs.columnName)
  );

  if (!statusFieldOption) {
    throw new Error(
      `The value '${inputs.columnName}' is not a valid value for the 'Status' field.`
    );
  }

  const statusFieldOptionId = statusFieldOption.id;

  const ensureIssueProjectCardIdData = await octokit.graphql<{
    addProjectV2ItemById: any;
  }>(
    `mutation ensureIssueProjectCardId($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(
        input: { projectId: $projectId, contentId: $contentId }
      ) {
        item {
          id
        }
      }
    }`,
    {
      projectId,
      contentId: inputs.issue_node_id,
    }
  );

  const projectCardId =
    ensureIssueProjectCardIdData?.addProjectV2ItemById?.item?.id;

  const changeIssueProjectCardStatusData = await octokit.graphql<{
    updateProjectV2ItemFieldValue: any;
  }>(
    `mutation changeStatus(
  $field: ID!
  $item: ID!
  $project: ID!
  $value: ProjectV2FieldValue!
) {
  updateProjectV2ItemFieldValue(
    input: {
      fieldId: $field
      itemId: $item
      projectId: $project
      value: $value
    }
  ) {
    clientMutationId
  }
}`,
    {
      field: statusFieldId,
      item: projectCardId,
      project: projectId,
      value: statusFieldOptionId,
    }
  );

  const mutationID =
    changeIssueProjectCardStatusData?.updateProjectV2ItemFieldValue
      ?.clientMutationId;

  if (!mutationID) {
    throw new Error("Failed to update project card status.");
  }
}
