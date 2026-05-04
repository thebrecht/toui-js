# @toui/client

Tiny TypeScript SDK for the [toui.io](https://toui.io) URL shortener.

Three things, no dependencies:

- **Shorten** any URL into `https://toui.io/<code>`
- **Look up** an existing short link's metadata and click count
- **Read stats** — daily clicks, top countries, referrers, devices, browsers

Built on `fetch`. Works in Node 18+, Bun, Deno, Cloudflare Workers, and modern browsers.

## Install

```sh
npm install @toui/client
# or
pnpm add @toui/client
# or
bun add @toui/client
```

## Quick start

Get an API key at [toui.io/admin/api-keys](https://toui.io/admin/api-keys) (the Free plan includes API access).

```ts
import { Toui } from '@toui/client';

const toui = new Toui({ apiKey: process.env.TOUI_API_KEY! });

const link = await toui.shorten({ url: 'https://example.com/launch' });
console.log(link.short_url); // "https://toui.io/aBcD3f"
```

## API

### `new Toui({ apiKey, baseUrl?, fetch? })`

| Option    | Type             | Default              | Notes                                                          |
|-----------|------------------|----------------------|----------------------------------------------------------------|
| `apiKey`  | `string`         | required             | `toui_<32-hex>`. Generate at /admin/api-keys.                  |
| `baseUrl` | `string`         | `https://toui.io`    | Override for self-hosted or staging.                           |
| `fetch`   | `typeof fetch`   | `globalThis.fetch`   | Pass a custom fetch (e.g. `undici.fetch` or a logging wrapper).|

### `toui.shorten(input)`

Create a short URL.

```ts
const link = await toui.shorten({
  url: 'https://example.com/very/long/path?utm_source=launch',
  custom_code: 'launch',     // paid plans only; 4–8 chars [a-zA-Z0-9]
  title: 'Spring launch',    // optional, internal label
  og_title: 'Spring Launch', // optional, social preview
  og_description: 'Doors open May 5',
  og_image_url: 'https://example.com/launch-card.png',
});
```

Returns `{ short_url, short_code, target_url, created_at }`.

### `toui.get(shortCode)`

Read metadata for a short URL your team owns.

```ts
const details = await toui.get('aBcD3f');
// { short_code, target_url, title, click_count, created_at, is_active,
//   og_title, og_description, og_image_url }
```

Throws `TouiError` with `status: 404` if the code isn't owned by your team.

### `toui.stats(shortCode, { days? })`

Read click statistics. `days` defaults to 30 and is clamped per plan
(Free 7, Pro 90, Business 365).

```ts
const stats = await toui.stats('aBcD3f', { days: 7 });
// {
//   short_code, target_url, total_clicks,
//   daily:     [{ date, clicks, unique_visitors }, ...],
//   countries: [{ country, clicks }, ...],
//   referers:  [{ referer, clicks }, ...],   // empty on Free
//   devices:   [{ device,  clicks }, ...],   // empty on Free
//   browsers:  [{ browser, clicks }, ...],   // empty on Free
//   limited:   true,                         // true on Free
// }
```

### Error handling

All API failures throw a `TouiError`:

```ts
import { Toui, TouiError } from '@toui/client';

try {
  await toui.shorten({ url: 'not-a-url' });
} catch (err) {
  if (err instanceof TouiError) {
    console.error(err.status, err.message); // e.g. 400 "Invalid URL"
  } else {
    throw err;
  }
}
```

## Recipes

### Bulk shortening with a concurrency cap

```ts
async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]!);
      }
    }),
  );
  return out;
}

const urls = ['https://a.example/...', 'https://b.example/...', /* ... */];
const links = await pool(urls, 5, (url) => toui.shorten({ url }));
```

### Cloudflare Worker

```ts
import { Toui } from '@toui/client';

export default {
  async fetch(req: Request, env: { TOUI_API_KEY: string }): Promise<Response> {
    const toui = new Toui({ apiKey: env.TOUI_API_KEY });
    const { url } = await req.json<{ url: string }>();
    const link = await toui.shorten({ url });
    return Response.json(link);
  },
};
```

### Next.js Route Handler

```ts
// app/api/shorten/route.ts
import { Toui } from '@toui/client';

const toui = new Toui({ apiKey: process.env.TOUI_API_KEY! });

export async function POST(req: Request) {
  const { url } = await req.json();
  const link = await toui.shorten({ url });
  return Response.json(link);
}
```

### Logging every request

```ts
const toui = new Toui({
  apiKey: process.env.TOUI_API_KEY!,
  fetch: async (input, init) => {
    const start = Date.now();
    const res = await fetch(input, init);
    console.log(`${init?.method ?? 'GET'} ${input} -> ${res.status} (${Date.now() - start}ms)`);
    return res;
  },
});
```

## Plan limits at a glance

| Capability             | Free          | Pro ($5/mo)        | Business ($15/mo)   |
|------------------------|---------------|--------------------|---------------------|
| API access             | ✓             | ✓                  | ✓                   |
| Burst rate limit       | 20 req/min    | 200 req/min        | 600 req/min         |
| Monthly API quota      | 5,000         | 500,000            | 500,000             |
| Custom short codes     | —             | ✓                  | ✓                   |
| Stats retention        | 7 days        | 90 days            | 1 year              |
| Advanced breakdown     | —             | country/ref/device | country/ref/device  |

See the live limits at [toui.io/pricing](https://toui.io/pricing).

## License

MIT © Brecht Huang
