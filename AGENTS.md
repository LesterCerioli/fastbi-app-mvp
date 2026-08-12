Here is the English translation of the rules:

---

# Rules for the Assistant

## Fundamental Rule

Never delete existing code. This is a production project.

* Every action must be **authorized** by the user before execution.
* Never take initiative on your own for any operation.

## Modifications

* Every modification must be **authorized** by the user before execution.
* Never take initiative on your own to alter, delete, or modify files.
* Always explain the reason for the modification and request authorization.

## .env

* **NEVER** touch the `.env` file.

## Environment Variables

* **Always** reference environment variables by name (`process.env.*`) — never inline a literal value.
* **Never** add a credential fallback value (e.g. `|| "dummy"`, `|| "secret"`) or expose any environment variable value as a hardcoded string in the code.
* Never hardcode service endpoints/URLs (e.g. `http://localhost:4566`) — always read them from the environment variable (e.g. `process.env.LOCALSTACK_ENDPOINT`).
* If a variable is mandatory and missing, let the code fail with a clear error instead of embedding a fallback value.

## Header and Styles

* Do not change header colors, styles, or layout unless explicitly requested.
* Do not add ThemeProvider, ThemeColorPicker, or any thematic system without authorization.

## Scope

* Do only what was asked—no "extras" or unsolicited improvements.

## Skills

* For UI/design tasks (styling, layouts, visual improvements), load the `frontend-design` skill for visual direction and `web-design-guidelines` for accessibility/UX auditing before implementing.
* For complex tasks, check the available skills first and use the ones that fit the demand—skills empower the assistant's capabilities.

## Production — Docker Containers

* **NEVER** stop, restart, kill processes, or modify Docker containers in production.
* All running containers are in production—do not touch them.
* Use HTTP calls only for exposed services.

### NEVER STOP DOCKER CONTAINERS!!!

### Use skills like Next Js, UI/Design and anothers from Vercel installed on this computer. Don't take tokens with jobs that skills can help you.