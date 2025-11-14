# wellknown

`wellknown` is a toolkit for shipping and consuming standards-aligned `/.well-known/*` endpoints.

The toolkit provides both **server-side** and **client-side** tools:

- **`@airnub/wellknown-api-catalog`** - Server-side package implementing [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727.html) for API catalog discovery via `/.well-known/api-catalog`, emitting Linkset JSON so humans, SDKs, and AI coding agents can discover live APIs
- **`@airnub/wellknown-cli`** (planned) - Client-side CLI tool enabling AI agents and developers to programmatically discover, fetch, and validate API catalogs from any RFC 9727-compliant host

When every API describes itself through a Linkset catalog, agents no longer hunt for scattered OpenAPI URLs or proprietary plugin manifests—they can resolve one URL and follow machine-readable relationships to official specs.

## Documentation

- **[Roadmap](roadmap.md)** - Future packages and well-known specs
- **[Publishing Guide - API Catalog](publishing.md)** - How to release new versions to npm
- **[Publishing Guide - CLI Tool](publishing-cli.md)** - How to release CLI tool to GitHub Packages

## Features

- **RFC 9727 Compliant** - Fully implements the API catalog specification
- **Framework Support** - Express, Fastify, Next.js, Supabase Edge Functions, and more
- **TypeScript First** - Complete type safety and inference
- **Zero Dependencies** - Minimal runtime footprint (only proxy parsing libs)
- **Proxy Aware** - Handles X-Forwarded headers and RFC 7239 correctly

## Quickstart

Install the current pre-release:

```bash
npm install @airnub/wellknown-api-catalog@next
```

All RFC complexity (well-known paths, Content-Types, profile URIs) is handled automatically. Here's a simple Next.js example:

### Next.js App Router

Create `app/.well-known/api-catalog/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createNextApiCatalogRoutes } from '@airnub/wellknown-api-catalog';

export const { GET, HEAD } = createNextApiCatalogRoutes(
  {
    apis: [
      {
        id: 'my-api',
        basePath: '/api/v1',
        specs: [{ href: '/api/v1/openapi.json' }],
      },
    ],
  },
  NextRequest,
  NextResponse
);
```

That's it! The package automatically handles RFC-compliant responses with correct Content-Type, profile parameters, and Link headers.

### Other Frameworks

The package includes handlers for:
- **Express** - `registerExpressApiCatalog(app, config)`
- **Fastify** - `registerFastifyApiCatalog(fastify, config)`
- **Supabase Edge Functions / Deno** - `createApiCatalogHandler(config)`
- **Custom frameworks** - Low-level builders and utilities

For detailed examples, see the sections below.

---

## Advanced Examples

### Express

```ts
import express from 'express';
import { registerExpressApiCatalog } from '@airnub/wellknown-api-catalog';

const app = express();

registerExpressApiCatalog(app, {
  apis: [
    {
      id: 'my-api',
      basePath: '/api/v1',
      specs: [{ href: '/api/v1/openapi.json' }],
    },
  ],
});
```

### Fastify

```ts
import Fastify from 'fastify';
import { registerFastifyApiCatalog } from '@airnub/wellknown-api-catalog';

const fastify = Fastify();

registerFastifyApiCatalog(fastify, {
  apis: [
    {
      id: 'my-api',
      basePath: '/api/v1',
      specs: [{ href: '/api/v1/openapi.json' }],
    },
  ],
});
```

### Supabase Edge Functions (Deno)

```ts
import { serve } from 'https://deno.land/std/http/server.ts';
import { createApiCatalogHandler } from 'npm:@airnub/wellknown-api-catalog';

serve(
  createApiCatalogHandler({
    apis: [
      {
        id: 'my-api',
        basePath: '/api/v1',
        specs: [{ href: '/api/v1/openapi.json' }],
      },
    ],
  })
);
```

---

## For AI agents

### Publishing APIs (Server-side)

The `@airnub/wellknown-api-catalog` package enables services to publish RFC 9727-compliant API catalogs. Once integrated, any AI agent or developer can discover your APIs automatically.

### Discovering APIs (Client-side)

LLM and coding agents can discover APIs in two ways:

**Manual approach:**
1. `GET /.well-known/api-catalog` with `Accept: application/linkset+json`
2. Parse the `linkset` array; each entry is an API anchor that points to a base URL on your host
3. Follow `service-desc` links to fetch OpenAPI, GraphQL, AsyncAPI, JSON Schema, or other specs
4. Use those specs to build clients, derive auth requirements, or drive tool execution safely

**Automated approach (coming soon):**

The `@airnub/wellknown-cli` tool (planned) will automate this workflow:

```bash
# Discover all APIs on a host
wellknown discover api.example.com --format json

# Fetch API specifications
wellknown fetch api.example.com --all --output ./specs/

# Validate RFC compliance
wellknown validate api.example.com
```

The CLI will provide JSON output optimized for programmatic consumption by AI agents, including:
- API metadata and extensions (x-auth, x-description, x-stability)
- Automatic spec fetching and validation
- CI/CD integration for compliance checking

Because the Linkset payload is self-describing and versioned, agents always hit the canonical documentation without scraping portals or guessing at URLs.
