# Set up Sidekick Display with an AI assistant

Give Codex, Claude Code or another assistant this guide and tell it which Home Assistant instance and dashboard you want to use. This guide requires no dedicated skill or MCP server. Reading it grants no access; use only tools and permissions you have already authorized.

## Copyable request

> Help me install Sidekick Display from https://github.com/tn9design/sidekick-display as a HACS custom Dashboard repository. Read its AGENTS.md and docs/AI_SETUP.md. Inspect my current setup, preserve my existing dashboards, and help me add a dedicated test Panel view. Use entities from my Home Assistant instance and verify the saved configuration and rendered card without operating my devices. Tell me what you could and could not verify.

## Before making changes

1. Confirm the user has authorized installation/configuration and identify the intended instance and destination dashboard. If none is specified, suggest a separate test dashboard and clarify the destination before saving.
2. Check the user's access requirements and use existing authorized access. Do not ask them to paste credentials into the chat. A user-required mounted config folder must be available before proceeding.
3. Inspect Home Assistant/HACS versions, whether Sidekick is already installed, its resource entry, and the destination view. Record existing configuration needed to undo the scoped change. Do not overwrite an existing Sidekick card to reset defaults.
4. Determine which available `weather.*` and `light.*` entities the user wants. Ask when names do not clearly identify the intended devices. Entity selection is configuration; testing by toggling a light requires separate explicit authorization.

## Install

1. In HACS, choose its menu → Custom repositories.
2. Add `https://github.com/tn9design/sidekick-display` with type **Dashboard**. This is a custom testing repo, not a default catalog entry.
3. Download Sidekick Display and reload the browser. No Home Assistant restart is normally required for this frontend card.
4. Verify a **JavaScript module** resource beginning `/hacsfiles/sidekick-display/sidekick-display.js` exists under Settings → Dashboards → Resources. Keep HACS's version query when present. HACS normally manages it for storage-mode dashboards; YAML-mode dashboards need manual registration. Avoid duplicate entries.
5. Create or use the agreed test **Panel (one card)** view and add **Sidekick Display** from the card picker.

The picker initializes four enabled navigation pages with grid, camera, moon and globe icons. Each contains the same Tile using the first light in the local instance, or a setup message if no light is available. Confirm or change that selection rather than assuming the first light is the intended one.

## Configure

- **Home tab:** choose the weather entity, clock settings and date visibility. If no weather entity exists, set Show Weather to Off.
- **Navigation tabs:** choose each page's name/icon and whether it appears in the navbar. Expand its starter card and choose the intended light. Use the dashed plus to add cards; the handle reorders them; Remove is inside the expanded card.
- **Settings tab:** choose background and navigation style, size, side and idle return. Background Advanced settings starts collapsed. Uploaded images are stored through Home Assistant's image storage.
- **Notifications tab:** says Coming soon. Skip notification/blueprint setup in this early release.
- Click **Save** in the card editor. Preview changes are drafts until saved. Complete any additional dashboard save/Done action required by the UI.

If the card picker is unavailable, the minimal manual card configuration is:

```yaml
type: custom:sidekick-display
```

That minimal YAML renders Home; it does not invoke the picker's four-page stub. Configure pages with the visual editor or use the picker to obtain the starter defaults. Do not add private configuration to a public example.

## Verify without operating devices

1. Reopen the saved card and confirm the selected entities, pages and settings persisted.
2. Confirm Home renders clock/date/weather as configured, each enabled navigation page opens, Home returns, and the editor opens. Inspect device state displays without tapping their device action controls.
3. Check that installed modules and selected background assets load without missing-file errors. A published release is not proof that HACS installed it correctly.
4. Report the installed release and browser, observed result, and any unverified kiosk/device behavior. A browser test does not establish physical Echo compatibility.

## Troubleshoot and undo

- **Custom element doesn't exist:** check installation, resource URL/type and browser reload before changing anything else. Do not install duplicate copies from both `/local/` and `/hacsfiles/`.
- **Blank/missing background:** check the installed asset and browser network error; use a bundled background or configured fallback color while investigating.
- **Entity unavailable:** inspect the selected entity on this instance and choose a valid replacement. Do not substitute a guessed ID.
- **Old design:** verify the loaded resource/build first; do not assume the newest GitHub version is loaded.
- **Changes disappear:** check whether Save was clicked, then reopen the saved card.
- **Undo:** remove only the new test card/view or restore the captured configuration through supported UI/API. Uninstall via HACS only when requested and after confirming no other dashboard uses the card.

For feedback, use [GitHub Issues](https://github.com/tn9design/sidekick-display/issues). Include versions, reproduction steps and sanitized screenshots. Posting an issue requires the user's authorization; do not upload private entity names, addresses, tokens or full configuration exports.

References: [HACS custom repositories](https://www.hacs.xyz/docs/faq/custom_repositories/), [Home Assistant Panel views](https://www.home-assistant.io/dashboards/panel/).
