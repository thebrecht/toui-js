import { TouiError } from './errors.js';
import type {
  ClientOptions,
  ShortenInput,
  ShortenResult,
  StatsOptions,
  UrlDetails,
  UrlStats,
} from './types.js';

const DEFAULT_BASE_URL = 'https://toui.io';

export class Toui {
  readonly #apiKey: string;
  readonly #baseUrl: string;
  readonly #fetch: typeof fetch;

  constructor(options: ClientOptions) {
    if (!options?.apiKey) {
      throw new TypeError('Toui: `apiKey` is required. Generate one at https://toui.io/admin/api-keys');
    }
    this.#apiKey = options.apiKey;
    this.#baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  /**
   * Shorten a URL.
   *
   * @example
   * const link = await toui.shorten({ url: 'https://example.com/long' });
   * console.log(link.short_url); // "https://toui.io/aBcD3f"
   */
  async shorten(input: ShortenInput): Promise<ShortenResult> {
    if (!input?.url) {
      throw new TypeError('Toui.shorten: `url` is required.');
    }
    return this.#request<ShortenResult>('POST', '/api/v1/shorten', input);
  }

  /**
   * Look up a short URL's metadata.
   * Only returns URLs owned by the team that issued the API key.
   *
   * @example
   * const details = await toui.get('aBcD3f');
   * console.log(details.click_count);
   */
  async get(shortCode: string): Promise<UrlDetails> {
    assertCode(shortCode);
    return this.#request<UrlDetails>('GET', `/api/v1/urls/${encodeURIComponent(shortCode)}`);
  }

  /**
   * Read click statistics for a short URL.
   *
   * @example
   * const stats = await toui.stats('aBcD3f', { days: 7 });
   * console.log(stats.total_clicks, stats.daily);
   */
  async stats(shortCode: string, options: StatsOptions = {}): Promise<UrlStats> {
    assertCode(shortCode);
    const query = options.days ? `?days=${encodeURIComponent(options.days)}` : '';
    return this.#request<UrlStats>('GET', `/api/v1/urls/${encodeURIComponent(shortCode)}/stats${query}`);
  }

  async #request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.#apiKey}`,
      Accept: 'application/json',
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await this.#fetch(`${this.#baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await res.text();
    let payload: unknown = undefined;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        // Non-JSON body — keep raw text for the error message below.
        payload = text;
      }
    }

    if (!res.ok) {
      const message =
        isRecord(payload) && typeof payload.error === 'string'
          ? payload.error
          : `toui.io API ${method} ${path} failed with status ${res.status}`;
      const code = isRecord(payload) && typeof payload.code === 'string' ? payload.code : undefined;
      throw new TouiError(message, res.status, code);
    }

    return payload as T;
  }
}

function assertCode(code: string): void {
  if (typeof code !== 'string' || code.length === 0) {
    throw new TypeError('Toui: `shortCode` must be a non-empty string.');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export { TouiError } from './errors.js';
export type {
  ClientOptions,
  ShortenInput,
  ShortenResult,
  UrlDetails,
  UrlStats,
  StatsOptions,
  DailyClicks,
  CountBreakdown,
} from './types.js';
