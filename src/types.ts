/**
 * Public API contract for the toui.io URL shortener.
 * Mirrors the v1 endpoints exposed under https://toui.io/api/v1/*
 */

export interface ShortenInput {
  /** Destination URL. http or https only. */
  url: string;
  /** Optional custom short code (4–8 chars, [a-zA-Z0-9]). Paid plans only. */
  custom_code?: string;
  /** Optional human-readable title. */
  title?: string;
  /** Open Graph title shown when the short URL is shared on social platforms. */
  og_title?: string;
  /** Open Graph description shown when the short URL is shared on social platforms. */
  og_description?: string;
  /** Public URL of the cover image used in the OG card. http or https only. */
  og_image_url?: string;
}

export interface ShortenResult {
  /** Fully-qualified short URL, e.g. "https://toui.io/aBcD3f". */
  short_url: string;
  /** Just the short code portion, e.g. "aBcD3f". */
  short_code: string;
  /** Final destination URL after normalization. */
  target_url: string;
  /** Server timestamp in `YYYY-MM-DD HH:MM:SS` format (UTC). */
  created_at: string;
}

export interface UrlDetails {
  short_code: string;
  target_url: string;
  title: string | null;
  click_count: number;
  /** Server timestamp in `YYYY-MM-DD HH:MM:SS` format (UTC). */
  created_at: string;
  /** Normalized to a real boolean by the SDK (the API returns 0/1). */
  is_active: boolean;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
}

export interface DailyClicks {
  /** YYYY-MM-DD */
  date: string;
  clicks: number;
  unique_visitors: number;
}

export interface CountBreakdown {
  /** Country ISO code, referer host, device family, or browser family. */
  key: string;
  clicks: number;
}

export interface UrlStats {
  short_code: string;
  target_url: string;
  total_clicks: number;
  daily: DailyClicks[];
  /** ISO country codes ranked by clicks. */
  countries: { country: string; clicks: number }[];
  /** Referer hosts ranked by clicks. Empty array on plans without advanced stats. */
  referers: { referer: string; clicks: number }[];
  /** Device families ranked by clicks. Empty array on plans without advanced stats. */
  devices: { device: string; clicks: number }[];
  /** Browser families ranked by clicks. Empty array on plans without advanced stats. */
  browsers: { browser: string; clicks: number }[];
  /** True when the breakdown was clipped because the plan does not include advanced stats. */
  limited: boolean;
}

export interface StatsOptions {
  /**
   * Number of days of history to return.
   * Free plan caps at 7, Pro at 90, Business at 365. Default 30.
   */
  days?: number;
}

export interface ClientOptions {
  /** API key in the form `toui_<32-hex>`. Generate one in the dashboard. */
  apiKey: string;
  /** Override base URL. Defaults to https://toui.io. */
  baseUrl?: string;
  /** Custom fetch implementation. Defaults to globalThis.fetch. */
  fetch?: typeof fetch;
}
