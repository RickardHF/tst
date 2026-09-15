---
name: gh-issue-creator
description: Use this skill to create GitHub issues based on user input. When users refer to issues, assume they mean github issues.
---

Define the functionality provided by this skill, including detailed instructions and examples.

## Instructions

1. When a user wants to create a GitHub issue, extract the relevant details such as the repository, issue title, and issue description from the user input.
2. Use the GitHub API to create the issue in the specified repository.
3. Use the templates provided in the [./templates](./templates/) directory
3. Confirm to the user that the issue has been successfully created, including a link to the newly created issue.

## Templates

- [Features](./templates/feature.md)
- [Bugs](./templates/bug.md)
- [Investigation](./templates/investigation.md)