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

## Header and Styles

* Do not change header colors, styles, or layout unless explicitly requested.
* Do not add ThemeProvider, ThemeColorPicker, or any thematic system without authorization.

## Scope

* Do only what was asked—no "extras" or unsolicited improvements.

## Production — Docker Containers

* **NEVER** stop, restart, kill processes, or modify Docker containers in production.
* All running containers are in production—do not touch them.
* Use HTTP calls only for exposed services.

### NEVER STOP DOCKER CONTAINERS!!!