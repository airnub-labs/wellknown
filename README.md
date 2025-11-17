# wellknown

A toolkit from **airnub-labs** for building production-ready `/.well-known/*`
endpoints.

> For complete configuration details, Linkset examples, and AI workflow docs,
> see [`packages/api-catalog/README.md`](./packages/api-catalog/README.md).

## Why this exists (AI LLM / coding agents)

LLM-powered agents increasingly call live APIs, but today they usually depend on
hand-curated OpenAPI URLs, plugin manifests, or scattered documentation. Those
artifacts fall out of sync quickly, forcing humans (or agents) to guess which
spec is current, scrape portals, or maintain brittle allowlists.

RFC 9727 changes that story by standardising `/.well-known/api-catalog`. When a
host publishes a Linkset JSON catalog at that location, any agent can:

1. `GET /.well-known/api-catalog`
2. Parse the `linkset` array (each entry is an API anchor)
3. Follow `service-desc` links to live OpenAPI, GraphQL SDL, AsyncAPI, or JSON
   Schema documents
4. Use those specs to generate clients, validate prompts, or drive toolchains
   against the real infrastructure

wellknown packages automate that publication step so agents—and your own SDKs—can
always discover the canonical source of truth straight from production.

## Standards

- **RFC 9727** – defines `/.well-known/api-catalog`, the `api-catalog` link
  relation, and the requirement to advertise catalogs with the
  `https://www.rfc-editor.org/info/rfc9727` profile
- **RFC 9264** – describes Linkset JSON (`application/linkset+json`), the payload
  format emitted by this repo
- **RFC 8631** – lists the service link relations (`service-desc`, `service-doc`,
  `service-meta`, `status`) that connect anchors to specs, docs, and metadata
- **RFC 7239** – details the `Forwarded` header used to safely reconstruct the
  externally-visible origin even when you sit behind proxies or CDNs

## Packages

- [`@airnub/wellknown-api-catalog`](./packages/api-catalog) – publish Linkset
  JSON catalogs plus drop-in handlers for Express and Fastify so your
  `/.well-known/api-catalog` endpoint is spec-aligned and proxy-safe by default

## Quickstart: API catalog

All RFC complexity (well-known paths, Content-Types, profile URIs) is handled automatically:

```ts
import express from 'express';
import { registerExpressApiCatalog } from '@airnub/wellknown-api-catalog';

const app = express();

// That's it! GET and HEAD handlers auto-registered at /.well-known/api-catalog
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

Or with Fastify:

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

The handlers automatically emit RFC-compliant responses with correct Content-Type,
profile parameters, and Link headers.

### Serverless and edge runtimes

For Next.js App Router (`app/.well-known/api-catalog/route.ts`):

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createNextApiCatalogRoutes } from '@airnub/wellknown-api-catalog';

export const { GET, HEAD } = createNextApiCatalogRoutes(
  {
    apis: [{ id: 'my-api', basePath: '/api/v1', specs: [{ href: '/api/v1/openapi.json' }] }],
  },
  NextRequest,
  NextResponse
);
```

For Supabase Edge Functions / Deno:

```ts
import { serve } from 'https://deno.land/std/http/server.ts';
import { createApiCatalogHandler } from 'npm:@airnub/wellknown-api-catalog';

serve(
  createApiCatalogHandler({
    apis: [{ id: 'my-api', basePath: '/api/v1', specs: [{ href: '/api/v1/openapi.json' }] }],
  })
);
```

Full examples and advanced usage patterns live in
[`packages/api-catalog/README.md`](./packages/api-catalog/README.md).

## Development

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
```

Each command runs across all workspaces so new packages automatically opt in.

## Documentation

Full documentation is published to GitHub Pages:

https://airnub-labs.github.io/wellknown/

The docs are generated from the `docs/` directory and built at CI time using a
temporary Docusaurus project (no Docusaurus config or dependencies are checked
into this repo).

## Publishing to npm

The `@airnub/wellknown-api-catalog` package is published to the public npm
registry. The package is currently in pre-release (`0.1.0-next.x`). Install via
the `next` tag until the first stable release:

```bash
pnpm add @airnub/wellknown-api-catalog@next
# or
npm install @airnub/wellknown-api-catalog@next
```

Releases are done via a manually triggered GitHub Actions workflow:

1. Bump the version in `packages/api-catalog/package.json` using SemVer.
2. Commit and push the change to `main`.
3. Go to **Actions → Publish @airnub/wellknown-api-catalog** and click **Run workflow**.
4. The workflow will build, test, and publish to npm using the `NPM_TOKEN` secret.

For detailed steps and credential setup, see
[`docs/publishing-npm.md`](./docs/publishing-npm.md).
