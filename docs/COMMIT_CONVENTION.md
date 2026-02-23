# Git Commit Message Convention

To maintain a clean and readable project history, we follow a structured commit message format:  
`<type>: <description>`

## Commit Types

| Type | Description |
| :--- | :--- |
| **feat** | Adds a new feature to the codebase. |
| **fix** | Specifically fixes a bug. |
| **refactor** | Code changes that neither fix a bug nor add a feature (e.g., restructuring). |
| **chore** | Miscellaneous changes that don't modify `src` or `test` (e.g., `.gitignore`, dependencies). |
| **perf** | A special refactor aimed specifically at improving performance. |
| **ci** | Changes related to Continuous Integration (e.g., GitHub Actions). |
| **ops** | Affects operational components like infrastructure, deployment, or backups. |
| **build** | Changes affecting the build system, project version, or build tools. |
| **docs** | Updates to documentation, such as the `README.md`. |
| **style** | Formatting changes (white-space, semi-colons) that don't affect code logic. |
| **revert** | Used to revert a previous commit. |
| **test** | Adding missing tests or correcting existing ones. |

## Examples

- `feat: add QR code generation logic`
- `fix: resolve login session timeout bug`
- `docs: update installation instructions in README`
- `chore: add node_modules to .gitignore`

---
*Maintained by the Project Manager.*