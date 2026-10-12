# Sidekick Display assistant instructions

For installation and configuration, read [docs/AI_SETUP.md](docs/AI_SETUP.md) and [README.md](README.md) first. Claude Code users can also start with CLAUDE.md. These files are guidance, not authorization to access or change a Home Assistant instance.

## Setup boundaries

- Follow the user's requested scope and their own access rules. Ask only for missing information that affects setup.
- Use the user's existing authorized Home Assistant access. If they require mounted configuration access, verify it before proceeding and stop if unavailable; do not silently switch to another access method.
- Inspect the current installation and dashboard before changing them. Preserve existing cards, settings and third-party resources. Prefer adding a dedicated test dashboard or view over replacing a working one.
- Use supported Home Assistant UI/API for dashboard and resource saves. Never edit `.storage` directly.
- Use entities from that user's instance. Never invent entity IDs or copy another household's configuration.
- Do not toggle devices, trigger cameras/doorbells, install kiosk software, change network settings, or restart Home Assistant merely to verify the card. Obtain explicit authorization for device actions or restarts.
- Never place credentials or private configuration in this repository, issue reports, command output or committed files.
- HACS custom repository installation does not mean submission to its default catalog. Do not submit this project unless the owner requests it.
- Notifications setup is not ready. Do not promise a blueprint or install a skill/MCP automatically.

## Repository changes

- Keep changes scoped. Runtime source is in `src/`; `npm run build` copies modules and assets into `dist/` and flattens background paths for HACS.
- Commit updated distribution files for runtime changes. HACS downloads top-level files from `dist/`; keep every required asset there.
- Run `npm run check` and `npm test` for code changes. Documentation-only changes need link/config checks, not a rebuild.
- Do not publish releases or push changes unless authorized. State separately what was saved, published, installed, loaded and physically tested.
