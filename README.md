# Github issues housekeeping

## Description

Various Github housekeeping utilities, such as

- autolink issues to PRs
- set the status of issues on the project board (e.g. move to QA/Testing or Done when PR is merged)

## Inputs

| name            | description                                                                                                                                                                        | required | default        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------- |
| `token`         | <p>GH Token: please ensure this token has repository and project permissions</p>                                                                                                   | `true`   | `GITHUB_TOKEN` |
| `task`          | <p>The task to run</p> <b>options</b>: <br />- `autolink-issue` <br />- `update-issue-status`                                                                                      | `true`   | `""`           |
| `done-column`   | <p>The name of the Done column to move the project issue to</p>                                                                                                                    | `false`  | `Done`         |
| `project-name`  | <p>Only for `update-issue-status` task</p>                                                                                                                                         | `false`  | `""`           |
| `qa-column`     | <p>The name of the QA/Testing column to move the project issue to</p>                                                                                                              | `false`  | `""`           |
| `skip-qa-label` | <p>The label that will be used to check when the QA/Testing column move should be skipped. If a PR has this label, the linked issue will be moved directly to the Done column.</p> | `false`  | `""`           |

## Usage examples

#### 1. Autolink issues to PRs

```yaml
- uses: gh-housekeeping@latest
  with:
    task: autolink-issue
    token: ${{ secrets.GITHUB_TOKEN }}
```

#### 2. Update issue status on project board on PR merge

```yaml
on:
  pull_request:
    types: [closed]

jobs:
  update-issue-status:
    - uses: gh-housekeeping@latest
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        task: update-issue-status
        project-name: "Project Name"
        done-column: "Done"
        qa-column: "QA/Testing"
        skip-qa-label: "no QA"
```
