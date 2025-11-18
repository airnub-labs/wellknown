# wellknown

`wellknown` is a toolkit for shipping standards-aligned `/.well-known/*` endpoints. The `@airnub/wellknown-api-catalog` package implements [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727.html) for API catalog discovery via `/.well-known/api-catalog`, emitting Linkset JSON so humans, SDKs, and AI coding agents can discover live APIs.

When every API describes itself through a Linkset catalog, agents no longer hunt for scattered OpenAPI URLs or proprietary plugin manifests—they can resolve one URL and follow machine-readable relationships to official specs.

## Documentation

- **[Roadmap](roadmap.md)** - Future packages and well-known specs
- **[Publishing Guide](publishing.md)** - How to release new versions to npm

## Features

- **RFC 9727 Compliant** - Fully implements the API catalog specification
- **Framework Support** - Express, Fastify, Next.js, Supabase Edge Functions, and more
- **TypeScript First** - Complete type safety and inference
- **Zero Dependencies** - Minimal runtime footprint (only proxy parsing libs)
- **Proxy Aware** - Handles X-Forwarded headers and RFC 7239 correctly

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

### Using the origin-based helper

For environments that expose a `Request` object instead of Node's
`IncomingMessage`—such as the Next.js App Router or Supabase Edge Functions—use
`buildApiCatalogLinksetForOrigin(config, origin)`. Derive the origin from the
request URL, build the Linkset once, and return it via the platform's preferred
response helper.

#### Using with Next.js App Router

```ts
// app/.well-known/api-catalog/route.ts
import { NextRequest, NextResponse } from 'next/server';
import type { ApiCatalogConfig } from '@airnub/wellknown-api-catalog';
import {
  buildApiCatalogLinksetForOrigin,
  openApiSpec,
} from '@airnub/wellknown-api-catalog';

const catalogConfig: ApiCatalogConfig = {
  publisher: 'example-publisher',
  apis: [
    {
      id: 'example-service-one',
      title: 'Example Service One API',
      basePath: '/api/service-one',
      specs: [
        openApiSpec('/api/service-one/openapi.json', '3.1'),
      ],
    },
  ],
};

const RFC9727_PROFILE = 'https://www.rfc-editor.org/info/rfc9727';

export function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const linkset = buildApiCatalogLinksetForOrigin(catalogConfig, origin);

  return NextResponse.json(linkset, {
    status: 200,
    headers: {
      'Content-Type': `application/linkset+json; profile="${RFC9727_PROFILE}"`,
    },
  });
}

export function HEAD(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const url = `${origin}/.well-known/api-catalog`;

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': `application/linkset+json; profile="${RFC9727_PROFILE}"`,
      Link: `<${url}>; rel="api-catalog"`,
    },
  });
}
```

This pattern works in both the Node.js and Edge runtimes because it never touches
`IncomingMessage`; the origin is reconstructed via `request.url`.

#### Using with Supabase Edge Functions (Deno)

```ts
// supabase/functions/api-catalog/index.ts
import { serve } from 'https://deno.land/std/http/server.ts';
// Deno can import npm packages via the `npm:` specifier:
import {
  buildApiCatalogLinksetForOrigin,
  openApiSpec,
  type ApiCatalogConfig,
} from 'npm:@airnub/wellknown-api-catalog';

const catalogConfig: ApiCatalogConfig = {
  publisher: 'example-publisher',
  apis: [
    {
      id: 'example-service-one',
      title: 'Example Service One API',
      basePath: '/api/service-one',
      specs: [
        openApiSpec('/api/service-one/openapi.json', '3.1'),
      ],
    },
  ],
};

const RFC9727_PROFILE = 'https://www.rfc-editor.org/info/rfc9727';

serve((request: Request): Response => {
  const url = new URL(request.url);

  if (url.pathname !== '/.well-known/api-catalog') {
    return new Response('Not found', { status: 404 });
  }

  const origin = url.origin;
  const linkset = buildApiCatalogLinksetForOrigin(catalogConfig, origin);

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Content-Type': `application/linkset+json; profile="${RFC9727_PROFILE}"`,
        Link: `<${origin}/.well-known/api-catalog>; rel="api-catalog"`,
      },
    });
  }

  return new Response(JSON.stringify(linkset), {
    status: 200,
    headers: {
      'Content-Type': `application/linkset+json; profile="${RFC9727_PROFILE}"`,
    },
  });
});
```

Supabase Edge Functions run on Deno and expose the standard Fetch API. Import
the package via `npm:@airnub/wellknown-api-catalog` and rely on the origin-based
helper to stay compatible with Deno's npm layer.

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
