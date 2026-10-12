# Sidekick Display

An early testing release of a Home Assistant dashboard card for a clock, weather, and four customizable navigation pages. Includes a visual editor, bundled backgrounds, and Light, Dark, Transparent and Glass navigation styles.

## Install with HACS

This repository is available as a **custom repository only**. It has not been submitted to the HACS default catalog.

1. Open HACS, open its menu, and choose **Custom repositories**.
2. Add `https://github.com/tn9design/sidekick-display` with type **Dashboard**.
3. Find **Sidekick Display** in HACS and download it.
4. Reload your browser. In a dashboard, choose **Add card**, then **Sidekick Display**.
5. For a display that fills the screen, use a **Panel (one card)** view. Configure the weather entity and the light entity on each numbered page using the visual editor.
6. Click **Save** to persist your card configuration. Changes in the editor preview are drafts until saved.

HACS installs the files and normally registers the JavaScript resource for storage-mode dashboards. It does not create a dashboard, install a kiosk app, or configure your devices. If the card does not appear, check Settings → Dashboards → Resources for `/hacsfiles/sidekick-display/sidekick-display.js` with type **JavaScript module**. YAML dashboards require manual resource registration.

New cards use four enabled pages with grid, camera, moon and globe icons with the same Tile card, selecting the first light from your own Home Assistant instance. If no light exists, they show a setup message. Existing configurations are never reset simply by opening the editor.

## AI-assisted setup

Using Codex or Claude Code? Start with [the AI setup guide](docs/AI_SETUP.md), including a copyable request and a verification checklist. [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md) provide repository instructions. No dedicated skill or MCP installation is needed.

## Settings

- **Home:** clock format/font/color/size, date visibility and weather.
- **Navigation pages:** navigation icon/name, visibility and embedded cards. Drag the handle to reorder cards; keyboard arrow keys also work. Remove is inside the expanded editor. The dashed plus adds a card.
- **Notifications:** Coming soon. A blueprint-based setup is being considered.
- **Settings:** background, collapsed background advanced controls, navigation style/size/side and idle return.

Uploaded backgrounds use Home Assistant's image storage. Standard Home Assistant cards use their native editors; third-party child cards must already be installed on your instance. No household entity IDs, dashboard exports, credentials or kiosk configuration are shipped.

## Testing and feedback

This is a beta for early feedback, not a final release. The current editor was reviewed on the development Home Assistant instance; this HACS package still needs a clean installation test on another instance. Camera sizing, third-party card compatibility and kiosk/WebView behavior may differ between devices. The Notifications tab is a placeholder.

Report issues at https://github.com/tn9design/sidekick-display/issues. Include your Home Assistant and browser versions, what you did, expected/actual behavior, and a screenshot where useful. Remove private entity names and addresses before sharing.

## Manual install

Copy **all contents of `dist/`**, to `/config/www/sidekick-display/`. Add `/local/sidekick-display/sidekick-display.js` as a JavaScript module resource and reload your browser.

## Development

Node.js is needed only for development. Run `npm test`, `npm run check`, and `npm run build`. Runtime files have no npm dependencies. The release build flattens background assets into dist because HACS downloads the top-level dashboard files. This package preserves the reviewed build `v.0.5.101226.713`.

## License

See LICENSE. Home Assistant and HACS are separate projects; Sidekick Display is not affiliated with them.
