# wellknown docs

`wellknown` is a toolkit for shipping standards-aligned `/.well-known/*`
endpoints. The `@airnub/wellknown-api-catalog` package focuses on
`/.well-known/api-catalog`, emitting Linkset JSON (RFC 9727 / RFC 9264) so
humans, SDKs, and AI coding agents can discover live APIs straight from your
host.

When every API describes itself through a Linkset catalog, agents no longer hunt
for scattered OpenAPI URLs or proprietary plugin manifests—they can resolve one
URL and follow machine-readable relationships to official specs.

## Quickstart

Install the current pre-release:

```bash
pnpm add @airnub/wellknown-api-catalog@next
# or
npm install @airnub/wellknown-api-catalog@next
```

Configure your catalog and wire the handlers into Express and Fastify:

```ts
import type { ApiCatalogConfig } from '@airnub/wellknown-api-catalog';
import {
  createExpressApiCatalogHandler,
  createExpressApiCatalogHeadHandler,
  fastifyApiCatalogPlugin,
  openApiSpec,
} from '@airnub/wellknown-api-catalog';
import express from 'express';
import Fastify from 'fastify';

const config: ApiCatalogConfig = {
  publisher: 'example-publisher',
  originStrategy: { kind: 'fromRequest', trustProxy: false },
  apis: [
    {
      id: 'example-service-one',
      title: 'Example Service One API',
      basePath: '/api/service-one',
      specs: [openApiSpec('/api/service-one/openapi.json', '3.1')],
    },
  ],
};

const app = express();
const fastify = Fastify();

app.get('/.well-known/api-catalog', createExpressApiCatalogHandler(config));
app.head('/.well-known/api-catalog', createExpressApiCatalogHeadHandler(config));

fastify.register(fastifyApiCatalogPlugin, { config });
```

`createExpressApiCatalogHandler` and `createExpressApiCatalogHeadHandler` emit
`application/linkset+json` plus the `rel="api-catalog"` Link header. The
Fastify plugin registers both GET and HEAD routes with the same headers and
payload semantics.

## For AI agents

LLM and coding agents can:

1. `GET /.well-known/api-catalog` with `Accept: application/linkset+json`.
2. Parse the `linkset` array; each entry is an API anchor that points to a base
   URL on your host.
3. Follow `service-desc` links to fetch OpenAPI, GraphQL, AsyncAPI, JSON Schema,
   or other specs announced via standard web link relations.
4. Use those specs to build clients, derive auth requirements, or drive tool
   execution safely against live infrastructure.

Because the Linkset payload is self-describing and versioned, agents always hit
the canonical documentation without scraping portals or guessing at URLs.
