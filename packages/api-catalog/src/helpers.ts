import type { ApiSpecRef } from './types';

export function openApiSpec(path: string, version: '3.0' | '3.1' = '3.1'): ApiSpecRef {
  return {
    rel: 'service-desc',
    kind: 'openapi',
    href: path,
    type: 'application/vnd.oai.openapi+json',
    profile:
      version === '3.1' ? 'https://spec.openapis.org/oas/3.1' : 'https://spec.openapis.org/oas/3.0',
    title: `OpenAPI ${version} spec`,
  };
}

export function graphqlSchemaSpec(path: string): ApiSpecRef {
  return {
    rel: 'service-desc',
    kind: 'graphql',
    href: path,
    type: 'application/graphql',
    title: 'GraphQL schema',
  };
}
