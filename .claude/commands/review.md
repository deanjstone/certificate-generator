Review the current changes for code quality.

1. Run `git diff` to see all uncommitted changes
2. Check each changed file against the conventions in `CLAUDE.md`
3. Report:
   - Any violations of code conventions
   - Security concerns
   - Missing JSDoc on public functions
   - Test coverage gaps
4. Suggest specific fixes for any issues found
5. Identify any GitHub issues addressed by the current changes:
   - Run `git log --oneline -20` to check recent commit messages for issue references (e.g. `#123`, `closes #123`, `fixes #123`)
   - If a PR exists for this branch, link it to any referenced issues using `gh pr edit <pr> --body` to add "Closes #N" or "Related to #N" as appropriate
   - If changes fully resolve an issue, close it with `gh issue close <N> --comment "Resolved in PR #<pr>"`
   - If changes partially address an issue, add a comment with `gh issue comment <N> --body "Partially addressed in PR #<pr>: <summary>"`
