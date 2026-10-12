const ID = /^[a-z][a-z0-9_-]{0,31}$/;
export function normalizeAutomation(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('automation must be an object.');
  const display_id = value.display_id ?? '';
  const helper = value.helper ?? '';
  if (typeof display_id !== 'string' || (display_id && !ID.test(display_id))) throw new Error('automation.display_id must be a short lowercase ID.');
  if (typeof helper !== 'string' || (helper && !/^input_text\.[a-z0-9_]+$/.test(helper))) throw new Error('automation.helper must be an input_text entity.');
  if (!!display_id !== !!helper) throw new Error('Automation needs both display_id and helper.');
  const ignore_repeated_alerts = value.ignore_repeated_alerts ?? true;
  if (typeof ignore_repeated_alerts !== 'boolean') throw new Error('automation.ignore_repeated_alerts must be true or false.');
  const pages = value.pages ?? [];
  if (!Array.isArray(pages)) throw new Error('automation.pages must be a list.');
  const ids = new Set();
  return {display_id, helper, ignore_repeated_alerts, pages:pages.map(page => {
    if (!page || typeof page.id !== 'string' || !ID.test(page.id) || ids.has(page.id)) throw new Error('Automation pages need unique short IDs.');
    ids.add(page.id);
    if (typeof page.name !== 'string' || !page.name.trim()) throw new Error('Automation pages need a name.');
    const seconds = page.seconds ?? 30;
    if (!Number.isFinite(seconds) || seconds < 5 || seconds > 600) throw new Error('Automation duration must be 5–600 seconds.');
    return {...page,seconds,card:structuredClone(page.card)};
  })};
}
export class RequestGate {
  constructor() { this.tokens = new Set(); this.reset(); }
  reset() { this.ready = false; this.value = undefined; this.diagnostic = undefined; }
  baseline(value) { this.value = value; this.ready = true; const request = this.parse(value); if (request) this.tokens.add(request.request); }
  parse(value) {
    try {
      const request = JSON.parse(value);
      if (!request || typeof request !== 'object' || Array.isArray(request) || typeof request.page !== 'string' || !ID.test(request.page) || typeof request.request !== 'string' || !request.request.trim() || request.request.length > 128 || Object.keys(request).some(key => !['page','request'].includes(key))) return null;
      return request;
    } catch { return null; }
  }
  receive(value, pages) {
    if (!this.ready) { const request = this.parse(value); if (request) this.tokens.add(request.request); return null; }
    if (value === this.value) return null;
    this.value = value;
    const request = this.parse(value);
    if (!request) { this.diagnostic = 'Malformed automation request ignored.'; return null; }
    if (this.tokens.has(request.request)) return null;
    this.tokens.add(request.request);
    const page = pages.find(page => page.id === request.page);
    if (!page) { this.diagnostic = 'Unknown automation page ignored.'; return null; }
    this.diagnostic = undefined;
    return page;
  }
}
