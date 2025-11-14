# wellknown

A toolkit from **airnub-labs** for building production-ready `/.well-known/*` endpoints.

This monorepo hosts packages that make it easy to publish machine-readable
capabilities for your APIs and services. The first package,
`@airnub/wellknown-api-catalog`, focuses on the API catalog described in RFC 9727
and helps AI agents discover live API specifications straight from your
infrastructure.

## Packages

- [`@airnub/wellknown-api-catalog`](./packages/api-catalog) – publish Linkset JSON
  catalogs and drop-in handlers for Express and Fastify.

## Development

```bash
pnpm install
pnpm test
pnpm lint
pnpm build
```

Each command runs across all workspaces so new packages automatically opt in.
