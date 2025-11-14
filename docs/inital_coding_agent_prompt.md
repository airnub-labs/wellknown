Role
You are a senior TypeScript library engineer and Node.js ecosystem expert. You are working in the GitHub org `airnub-labs` and will create a new monorepo called `wellknown` containing an initial npm package:

- npm name: `@airnub/wellknown-api-catalog`

This package will implement an RFC-compliant `/.well-known/api-catalog` endpoint (per RFC 9727) using Linkset JSON (per RFC 9264), with robust origin detection behind proxies, and documentation that explicitly explains how this helps AI LLM / coding agents discover live API specs.

You own:
- Repo & workspace scaffolding
- Library design & implementation
- Tests & CI
- Documentation & examples
- npm packaging for `@airnub/wellknown-api-catalog`

You must produce **production-quality** code with strong typing, good ergonomics, and clear docs.

────────────────────────────────────
High-level Problem & Motivation
────────────────────────────────────

Context the library is solving:

1. **RFC 9727 – API catalog**
   - Defines a well-known URI: `/.well-known/api-catalog`
   - Defines the `api-catalog` link relation
   - Requires that `GET /.well-known/api-catalog` returns an **API catalog document** in the Linkset JSON format (`application/linkset+json`), with a `profile` parameter indicating the document represents an API catalog.
   - `HEAD /.well-known/api-catalog` must expose a `Link` header with `rel="api-catalog"` pointing to the catalog resource.

2. **RFC 9264 – Linkset**
   - Defines **Linkset JSON** (`application/linkset+json`) as a structured way to publish sets of links (link relations, href, media types, etc.).
   - A Linkset JSON document has a top-level `linkset` array of “contexts”, each with an `anchor` and relation arrays like `service-desc`, `service-doc`, etc.

3. **RFC 8631 – web API link relations**
   - Defines relation types like `service-desc`, `service-doc`, `service-meta`, `status`.
   - These are ideal to point from an API catalog to:
     - machine-readable specs (OpenAPI / AsyncAPI / GraphQL SDL / JSON Schema),
     - human docs,
     - meta endpoints,
     - health/status endpoints.

4. **AI LLM / Coding agents’ problem**
   - Agents often rely on:
     - hard-coded OpenAPI URLs,
     - plugin manifests,
     - or out-of-sync human docs / RAG.
   - This doesn’t scale and can drift from reality.
   - A standard **discovery entry point** (`/.well-known/api-catalog`), returning a Linkset listing all APIs on a host and their machine-readable descriptions, is a clean way for agents to:
     - discover what APIs exist,
     - find their live specs,
     - see basic usage metadata (e.g., auth, terms, AI-usage hints).

5. **Reverse proxy / origin complexity**
   - Servers frequently sit behind proxies / load balancers (NGINX, Envoy, Cloudflare, etc.).
   - Correctly reconstructing the externally visible origin (`https://api.example.com`) requires understanding:
     - RFC 7239’s `Forwarded` header (`proto=`, `host=`),
     - `X-Forwarded-Proto`, `X-Forwarded-Host`, `X-Forwarded-For`.
   - We want a robust helper that:
     - uses a library like `forwarded-http` to parse `Forwarded` + X-Forwarded-*,
     - supports a `trustProxy` mechanism similar to Express/Fastify, so we only trust forwarded headers from known proxies,
     - falls back to the raw `Host` + TLS state when proxies aren’t trusted.

Goal: a **small, focused TS library** that:

- Implements RFC 9727’s `/.well-known/api-catalog` in Linkset JSON.
- Is **spec-agnostic**: it doesn’t assume OpenAPI; it links to any spec type (OpenAPI, GraphQL SDL, JSON Schema, AsyncAPI, etc.) via `service-desc` / `service-doc`.
- Provides framework adapters (Express, Fastify; optional example for Next.js).
- Exposes a **strongly-typed, ergonomic config API** for backend developers.
- Documents clearly how AI LLM / coding agents can consume the catalog.

────────────────────────────────────
Monorepo & Package Layout
────────────────────────────────────

Create the GitHub repo:

- `airnub-labs/wellknown`

Use a Node workspace (prefer pnpm, but npm workspaces is acceptable). Initial structure:

- `package.json` (workspace root)
- `pnpm-workspace.yaml` (or equivalent for chosen tool)
- `tsconfig.base.json`
- `README.md` (top-level: vision for “wellknown” as a toolkit for `.well-known/*` endpoints)

- `packages/`
  - `api-catalog/`
    - `package.json` (name: `@airnub/wellknown-api-catalog`)
    - `src/`
    - `tests/`
    - `README.md` (package-specific)
  - (optional future) `core/` for shared helpers, but for now you can keep everything in `api-catalog`.

Configure the workspace so that you can run:

- `pnpm install` (or equivalent) at root.
- `pnpm -C packages/api-catalog test`, `build`, etc.

────────────────────────────────────
Package: @airnub/wellknown-api-catalog
────────────────────────────────────

### Language & Build

- Language: TypeScript (strict mode), Node.js 18+.
- Build tooling:
  - Use `tsup` to build ESM + CJS bundles and `.d.ts`.
- Testing:
  - `vitest`
- Linting & formatting:
  - `eslint` + `prettier`

`packages/api-catalog/package.json` key points:

- `"name": "@airnub/wellknown-api-catalog"`
- `"version": "0.1.0"`
- `"main": "dist/index.cjs"`
- `"module": "dist/index.mjs"`
- `"types": "dist/index.d.ts"`
- `"exports"`:

  ```json
  {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
"files": ["dist"]

"scripts":

"build": "tsup src/index.ts --dts --format esm,cjs --clean"

"test": "vitest"

"lint": "eslint ."

"prepare": "pnpm run build" (so npm install from git builds it)

dependencies:

forwarded-http – for parsing Forwarded + X-Forwarded-*.

devDependencies:

typescript, tsup, vitest, @vitest/coverage-* (if desired), @types/node

eslint, @typescript-eslint/*, prettier, testing utilities.

Create tsconfig.json in packages/api-catalog extending the root tsconfig.base.json.

────────────────────────────────────
Core Library Design
────────────────────────────────────

Implement the following modules in packages/api-catalog/src:

1. Config Types (src/types.ts)
Define high-level config types:

ts
Copy code
// src/types.ts

export interface LinkObject {
  href: string;
  type?: string;
  hreflang?: string | string[];
  title?: string | string[];
  profile?: string | string[];
}

/** Optional hint about the spec type; for tooling, not the protocol. */
export type ApiSpecKind = "openapi" | "asyncapi" | "graphql" | "json-schema" | "other";

export interface ApiSpecRef extends LinkObject {
  /**
   * Link relation: service-desc, service-doc, service-meta, status, etc.
   * Defaults to "service-desc" when omitted.
   */
  rel?: "service-desc" | "service-doc" | "service-meta" | "status" | string;

  /** Optional hint for the type of spec, purely descriptive. */
  kind?: ApiSpecKind;
}

/** Mirror Express/Fastify-style "trust proxy" semantics. */
export type TrustProxySetting =
  | boolean
  | string
  | string[]
  | ((addr: string, index: number) => boolean);

export type OriginStrategy =
  | {
      kind: "fromRequest";
      trustProxy?: TrustProxySetting;
      /** Optional basePath prefix (e.g. "/apis") applied when materialising anchors. */
      basePath?: string;
    }
  | {
      kind: "fixed";
      origin: string; // e.g. "https://api.airnub.dev"
      basePath?: string;
    };

export interface ApiEntryConfig {
  id: string; // internal identifier
  title?: string;
  description?: string;

  /** Path segment for this API under the origin, e.g. "/apis/service-one". */
  basePath?: string;

  /** Fully-qualified anchor URL; overrides basePath+origin if given. */
  absoluteAnchor?: string;

  /** Links to spec docs / human docs / meta for this API. */
  specs: ApiSpecRef[];
}

export interface ApiCatalogConfig {
  publisher?: string;
  originStrategy?: OriginStrategy;
  apis: ApiEntryConfig[];
}
2. Linkset Types (src/linkset.ts)
Model the Linkset JSON wire format:

ts
Copy code
// src/linkset.ts

import type { LinkObject } from "./types";

/** A single linkset context (one anchor with various link relations). */
export interface LinksetContext {
  anchor: string;

  "service-desc"?: LinkObject[];
  "service-doc"?: LinkObject[];
  "service-meta"?: LinkObject[];
  status?: LinkObject[];
  item?: LinkObject[];
  "api-catalog"?: LinkObject[] | string;

  // Allow other extension relations:
  [rel: string]: any;
}

/** The full Linkset document for an API catalog. */
export interface ApiCatalogLinkset {
  linkset: LinksetContext[];
}
3. Origin Resolution (src/origin.ts)
Implement robust origin resolution using forwarded-http:

ts
Copy code
// src/origin.ts

import type { IncomingMessage } from "http";
import { forwarded } from "forwarded-http";
import type { OriginStrategy, TrustProxySetting } from "./types";

export interface OriginResult {
  scheme: "http" | "https";
  host: string;   // host[:port]
  origin: string; // `${scheme}://${host}`
}

export interface ResolveOriginOptions {
  strategy: OriginStrategy;
  req: IncomingMessage;
}

function isTrusted(addr: string, index: number, setting: TrustProxySetting | undefined): boolean {
  if (!setting) return false;
  if (setting === true) return true;
  if (setting === false) return false;
  if (typeof setting === "function") return setting(addr, index);
  if (typeof setting === "string") return addr === setting;
  if (Array.isArray(setting)) return setting.includes(addr);
  return false;
}

/**
 * Resolve the externally visible origin, taking into account Forwarded / X-Forwarded-* headers
 * when strategy.kind === "fromRequest" and trustProxy is enabled.
 */
export function resolveOrigin({ strategy, req }: ResolveOriginOptions): OriginResult {
  if (strategy.kind === "fixed") {
    const url = new URL(strategy.origin.replace(/\/+$/, ""));
    const scheme = (url.protocol.replace(":", "") || "https") as "http" | "https";
    const host = url.host;
    return {
      scheme,
      host,
      origin: `${scheme}://${host}`,
    };
  }

  // fromRequest strategy
  const { trustProxy } = strategy;

  let scheme: "http" | "https" = req.socket.encrypted ? "https" : "http";
  let host = (req.headers["host"] as string | undefined) ?? "localhost";

  if (trustProxy) {
    // forwarded() returns hops with info from Forwarded / X-Forwarded-* / X-Real-*.
    const hops = forwarded(req);
    // hops[0] is closest to client; higher indexes are nearer to the app.
    // We want the "client-facing" hop that's trusted.
    for (let i = hops.length - 1; i >= 0; i--) {
      const hop = hops[i];
      const addr = hop.for || hop.host || "";
      if (isTrusted(addr, i, trustProxy)) {
        if (hop.proto === "https" || hop.proto === "http") {
          scheme = hop.proto;
        }
        if (hop.host) {
          host = hop.host;
        }
        break;
      }
    }
  }

  const origin = `${scheme}://${host.replace(/\/+$/, "")}`;
  return { scheme, host, origin };
}
Adjust the exact use of forwarded-http based on its API (import name, return shape); ensure tests verify the behaviour.

4. Catalog Builder (src/builder.ts)
Implement the core builder:

ts
Copy code
// src/builder.ts

import type { IncomingMessage } from "http";
import type {
  ApiCatalogConfig,
  ApiEntryConfig,
  ApiSpecRef,
} from "./types";
import type { ApiCatalogLinkset, LinksetContext } from "./linkset";
import { resolveOrigin } from "./origin";

export interface BuildContextOptions {
  req: IncomingMessage;
}

/** Build a single LinksetContext from one API entry. */
function buildContextForApi(
  api: ApiEntryConfig,
  origin: string,
  basePathPrefix?: string
): LinksetContext {
  const basePath = api.basePath ?? "/";
  const prefix = basePathPrefix ? `/${basePathPrefix.replace(/^\/+/, "")}` : "";

  const computed = `${origin}${prefix}${basePath.startsWith("/") ? "" : "/"}${basePath}`;
  const anchor = (api.absoluteAnchor ?? computed).replace(/\/+$/, "");

  const ctx: LinksetContext = { anchor };

  for (const spec of api.specs) {
    const rel = spec.rel ?? "service-desc";
    const { rel: _rel, kind: _kind, ...rest } = spec;
    const link = { ...rest };
    if (!ctx[rel]) ctx[rel] = [];
    (ctx[rel] as any[]).push(link);
  }

  return ctx;
}

/**
 * Build the Linkset document representing the API catalog for this host.
 */
export function buildApiCatalogLinkset(
  config: ApiCatalogConfig,
  options: BuildContextOptions
): ApiCatalogLinkset {
  const originStrategy = config.originStrategy ?? { kind: "fromRequest", trustProxy: true };
  const { origin } = resolveOrigin({ strategy: originStrategy, req: options.req });

  const basePathPrefix =
    originStrategy.kind === "fromRequest" ? originStrategy.basePath : originStrategy.basePath;

  const linkset: LinksetContext[] = config.apis.map((api) =>
    buildContextForApi(api, origin, basePathPrefix)
  );

  return { linkset };
}
5. HTTP Adapters
5.1 Express (src/handlers/express.ts)
ts
Copy code
// src/handlers/express.ts

import type { Request, Response, NextFunction } from "express";
import type { ApiCatalogConfig } from "../types";
import { buildApiCatalogLinkset } from "../builder";

const RFC9727_PROFILE = "https://www.rfc-editor.org/info/rfc9727";

export function createExpressApiCatalogHandler(config: ApiCatalogConfig) {
  return function apiCatalogHandler(
    req: Request,
    res: Response,
    _next: NextFunction
  ) {
    const linkset = buildApiCatalogLinkset(config, {
      req: req as any,
    });

    res
      .status(200)
      .setHeader(
        "Content-Type",
        `application/linkset+json; profile="${RFC9727_PROFILE}"`
      )
      .json(linkset);
  };
}

/**
 * HEAD /.well-known/api-catalog MUST return a Link header with rel="api-catalog".
 */
export function createExpressApiCatalogHeadHandler() {
  return function apiCatalogHeadHandler(
    req: Request,
    res: Response,
    _next: NextFunction
  ) {
    const proto = req.secure ? "https" : "http";
    const host = req.get("host") ?? "localhost";
    const url = `${proto}://${host}/.well-known/api-catalog`;
    res.status(200).setHeader("Link", `<${url}>; rel="api-catalog"`).end();
  };
}
Express usage example for README:

ts
Copy code
import express from "express";
import {
  createExpressApiCatalogHandler,
  createExpressApiCatalogHeadHandler,
} from "@airnub/wellknown-api-catalog";
import { catalogConfig } from "./catalog-config";

const app = express();

app.get("/.well-known/api-catalog", createExpressApiCatalogHandler(catalogConfig));
app.head("/.well-known/api-catalog", createExpressApiCatalogHeadHandler());
5.2 Fastify (src/handlers/fastify.ts)
ts
Copy code
// src/handlers/fastify.ts

import type { FastifyPluginCallback } from "fastify";
import type { ApiCatalogConfig } from "../types";
import { buildApiCatalogLinkset } from "../builder";
import { API_CATALOG_PATH, LINKSET_CONTENT_TYPE } from "../constants";

interface FastifyApiCatalogPluginOptions {
  config: ApiCatalogConfig;
}

export const fastifyApiCatalogPlugin: FastifyPluginCallback<FastifyApiCatalogPluginOptions> = (
  fastify,
  opts,
  done
) => {
  const { config } = opts ?? {};
  if (!config) {
    done(new Error("fastifyApiCatalogPlugin requires a config option."));
    return;
  }

  fastify.get(API_CATALOG_PATH, async (request, reply) => {
    const linkset = buildApiCatalogLinkset(config, {
      req: request.raw,
    });

    return reply.header("Content-Type", LINKSET_CONTENT_TYPE).send(linkset);
  });

  fastify.head(API_CATALOG_PATH, async (request, reply) => {
    const proto = request.protocol;
    const host = request.headers["host"] ?? "localhost";
    const url = `${proto}://${host}${API_CATALOG_PATH}`;
    return reply
      .header("Content-Type", LINKSET_CONTENT_TYPE)
      .header("Link", `<${url}>; rel="api-catalog"`)
      .send();
  });

  done();
};
6. Helpers (src/helpers.ts)
Provide convenience helpers (spec-agnostic core; helpers are opinionated sugar):

ts
Copy code
// src/helpers.ts

import type { ApiSpecRef } from "./types";

export function openApiSpec(path: string, version: "3.0" | "3.1" = "3.1"): ApiSpecRef {
  return {
    rel: "service-desc",
    kind: "openapi",
    href: path,
    type: "application/vnd.oai.openapi+json",
    profile:
      version === "3.1"
        ? "https://spec.openapis.org/oas/3.1"
        : "https://spec.openapis.org/oas/3.0",
    title: `OpenAPI ${version} spec`,
  };
}

export function graphqlSchemaSpec(path: string): ApiSpecRef {
  return {
    rel: "service-desc",
    kind: "graphql",
    href: path,
    type: "application/graphql",
    title: "GraphQL schema",
  };
}
7. Public Entry (src/index.ts)
Re-export all public APIs:

ts
Copy code
// src/index.ts

export * from "./types";
export * from "./linkset";
export * from "./origin";
export * from "./builder";
export * from "./handlers/express";
export * from "./handlers/fastify";
export * from "./helpers";
────────────────────────────────────
Testing with Vitest
────────────────────────────────────

Create packages/api-catalog/tests with:

builder.test.ts

Test that, given a sample ApiCatalogConfig with multiple APIs and spec refs, buildApiCatalogLinkset:

Produces a linkset array with correct length.

Each context has the expected anchor.

Relation arrays (service-desc, service-doc) contain the expected href, type, title, profile.

origin.test.ts

Test resolveOrigin for:

No proxies: only Host (http / https) and socket TLS.

With Forwarded: proto=https; host=api.example.com when trustProxy is enabled.

With X-Forwarded-Proto / X-Forwarded-Host when trustProxy is enabled.

With trustProxy: false ignoring forwarded headers.

handlers-express.test.ts

Use a minimal Express app and supertest (or similar):

GET /.well-known/api-catalog returns HTTP 200, with Content-Type application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727", and a JSON body with linkset.

HEAD /.well-known/api-catalog returns HTTP 200 and includes Link header with rel="api-catalog".

handlers-fastify.test.ts

Similar coverage for Fastify registration.

Optional snapshot test:

For a representative ApiCatalogConfig, snapshot the JSON output of buildApiCatalogLinkset and assert that it doesn’t change by accident.

────────────────────────────────────
CI & Quality Gates
────────────────────────────────────

At repo root, add:

.eslintrc.cjs, .prettierrc, .editorconfig for consistent style.

GitHub Actions workflow at .github/workflows/ci.yml:

Trigger on push and pull_request.

Use a matrix for Node 18 & 20.

Steps:

actions/checkout

pnpm/action-setup (or npm install)

Install dependencies at root.

Run pnpm lint, pnpm test, pnpm build (or workspace equivalents).

────────────────────────────────────
README for @airnub/wellknown-api-catalog
────────────────────────────────────

In packages/api-catalog/README.md, include:

Overview

Explain that this library implements /.well-known/api-catalog per RFC 9727, emitting application/linkset+json Linkset documents.

State that it’s spec-agnostic (supports OpenAPI, GraphQL schemas, JSON Schema, etc.).

Why this matters for AI LLM / coding agents

Describe the problem:

Agents often rely on manual config, outdated docs, or plugin manifests.

There’s no standard, host-level entry point for “What APIs do you have?”.

Explain the solution:

RFC 9727 introduces /.well-known/api-catalog as a standard discovery endpoint.

This package makes it trivial for servers to publish an API catalog as Linkset JSON.

Agents can:

GET /.well-known/api-catalog

Parse the linkset array

Follow service-desc links to live specs (OpenAPI, GraphQL SDL, etc.)

Build clients or tool configs from those specs.

Standards background

Brief explanation of:

RFC 9727 (API catalog, well-known URI, api-catalog link relation).

RFC 9264 (Linkset JSON and application/linkset+json).

RFC 8631 (link relations like service-desc, service-doc).

RFC 7239 (Forwarded header) + X-Forwarded-* for origin reconstruction.

Quickstart

Installation:

bash
Copy code
pnpm add @airnub/wellknown-api-catalog@next
# or
npm install @airnub/wellknown-api-catalog@next
Example config:

ts
Copy code
import type { ApiCatalogConfig } from "@airnub/wellknown-api-catalog";
import { openApiSpec, graphqlSchemaSpec } from "@airnub/wellknown-api-catalog";

export const catalogConfig: ApiCatalogConfig = {
  publisher: "example-publisher",
  originStrategy: { kind: "fromRequest", trustProxy: true },
  apis: [
    {
      id: "example-service-one",
      title: "Example Service One API",
      basePath: "/apis/service-one",
      specs: [
        openApiSpec("/apis/service-one/openapi.json", "3.1"),
        {
          rel: "service-doc",
          href: "https://docs.example.com/service-one",
          type: "text/html",
          title: "HTML docs",
        },
      ],
    },
    {
      id: "example-service-two",
      title: "Example Service Two API",
      basePath: "/apis/service-two",
      specs: [
        graphqlSchemaSpec("/apis/service-two/schema.graphql"),
      ],
    },
  ],
};
Express integration snippet as above.

Fastify integration snippet as above.

Origin strategy

Document OriginStrategy:

fromRequest with trustProxy semantics (explain security considerations).

fixed for static origins (good for serverless / API gateways).

Security considerations

Warn that trustProxy: true should only be used when you control/know the proxy chain.

Otherwise, set trustProxy to false or a whitelist.

Using this from AI agents

Example pseudo-code:

Fetch /.well-known/api-catalog.

For each linkset context:

Read anchor as API base.

Look for service-desc links; inspect type and profile to detect OpenAPI (application/vnd.oai.openapi+json), GraphQL, etc.

Fetch and parse the spec to build an HTTP client.

Versioning & stability

State that breaking changes to config types or Linkset structure will bump the major version.

Encourage users to pin a major version.

────────────────────────────────────
Task Plan
────────────────────────────────────

Work in roughly this order:

Scaffold airnub-labs/wellknown monorepo with root workspace config.

Create packages/api-catalog with package.json, tsconfig.json, and source structure.

Implement types.ts, linkset.ts, origin.ts, builder.ts, Express & Fastify handlers, and helpers.

Add index.ts re-exporting all public pieces.

Set up tsup build and verify ESM/CJS + .d.ts output.

Add Vitest tests covering builder, origin, and handlers.

Configure ESLint + Prettier and ensure lint passes.

Add GitHub Actions CI to run lint, test, build on Node 18 & 20.

Write packages/api-catalog/README.md with the sections above, emphasising the AI LLM / coding-agent use case.

Run full pipeline: pnpm lint, pnpm test, pnpm build.

Ensure the package is ready to publish as @airnub/wellknown-api-catalog (via pnpm publish --filter @airnub/wellknown-api-catalog or similar).

Once all of this is implemented and green, stop and present:

Final repo structure

Any key design notes or trade-offs made

Example usage snippets from the README.
