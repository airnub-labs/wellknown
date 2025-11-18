# Wellknown

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![npm version](https://img.shields.io/npm/v/@airnub/wellknown-api-catalog.svg)](https://www.npmjs.com/package/@airnub/wellknown-api-catalog)
[![npm downloads](https://img.shields.io/npm/dm/@airnub/wellknown-api-catalog.svg)](https://www.npmjs.com/package/@airnub/wellknown-api-catalog)
[![CI](https://github.com/airnub-labs/wellknown/actions/workflows/ci.yml/badge.svg)](https://github.com/airnub-labs/wellknown/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://airnub-labs.github.io/wellknown/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)

A toolkit from **Airnub Technologies Limited** for building production-ready `/.well-known/*`
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

The wellknown toolkit provides both **server-side** and **client-side** tools:

- **`@airnub/wellknown-api-catalog`** – Server-side package that automates the
  publication step so agents can discover the canonical source of truth straight
  from production
- **`@airnub/wellknown-cli`** (planned) – Client-side CLI tool that enables AI
  agents and developers to programmatically discover, fetch, and validate API
  catalogs from any RFC 9727-compliant host

This complete ecosystem makes it trivial for AI agents to both publish and
consume well-known resources without manual configuration.

## Standards

The wellknown toolkit implements various RFC and W3C specifications for different well-known resources.

### API Catalog (`@airnub/wellknown-api-catalog`)

- **RFC 9727** – defines `/.well-known/api-catalog`, the `api-catalog` link
  relation, and the requirement to advertise catalogs with the
  `https://www.rfc-editor.org/info/rfc9727` profile
- **RFC 9264** – describes Linkset JSON (`application/linkset+json`), the payload
  format emitted by this package
- **RFC 8631** – lists the service link relations (`service-desc`, `service-doc`,
  `service-meta`, `status`) that connect anchors to specs, docs, and metadata
- **RFC 7239** – details the `Forwarded` header used to safely reconstruct the
  externally-visible origin even when you sit behind proxies or CDNs

### Future Well-Known Specifications

As new packages are added to the toolkit, their relevant standards will be documented here. See the [roadmap](./docs/roadmap.md) for planned specifications including security.txt (RFC 9116), OAuth metadata (RFC 8414), and others.

## Packages

- [`@airnub/wellknown-api-catalog`](./packages/api-catalog) – publish Linkset
  JSON catalogs plus drop-in handlers for Express and Fastify so your
  `/.well-known/api-catalog` endpoint is spec-aligned and proxy-safe by default

## Roadmap

For information about planned features and future packages, see the
[roadmap](./docs/roadmap.md).

## Quickstart: API catalog

All RFC complexity (well-known paths, Content-Types, profile URIs) is handled automatically. Here's a simple Next.js example:

**Next.js App Router** (`app/.well-known/api-catalog/route.ts`):

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
- **Express** – `registerExpressApiCatalog(app, config)`
- **Fastify** – `registerFastifyApiCatalog(fastify, config)`
- **Supabase Edge Functions / Deno** – `createApiCatalogHandler(config)`
- **Custom frameworks** – Low-level builders and utilities

For complete examples, advanced configuration, and framework-specific guides, see [`packages/api-catalog/README.md`](./packages/api-catalog/README.md).

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

## Installation

**API Catalog Package:**

The `@airnub/wellknown-api-catalog` package is published to the public npm registry:

```bash
npm install @airnub/wellknown-api-catalog@next
```

**CLI Tool** (planned):

The `@airnub/wellknown-cli` tool will be published to GitHub Packages when available.

---

**For maintainers:** Release and publishing guides are available in [`docs/publishing.md`](./docs/publishing.md) and [`docs/publishing-cli.md`](./docs/publishing-cli.md).
