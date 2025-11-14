/**
 * Copyright 2024-2025 Airnub Technologies Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

export function graphqlSchemaSpec(
  path: string,
  options?: { format?: 'sdl' | 'introspection' }
): ApiSpecRef {
  const format = options?.format ?? 'sdl';
  return {
    rel: 'service-desc',
    kind: 'graphql',
    href: path,
    type: format === 'sdl' ? 'application/graphql' : 'application/json',
    profile: format === 'introspection' ? 'https://spec.graphql.org/introspection' : undefined,
    title: format === 'sdl' ? 'GraphQL schema' : 'GraphQL introspection result',
  };
}

export function asyncApiSpec(path: string, version: '2.0' | '3.0' = '3.0'): ApiSpecRef {
  return {
    rel: 'service-desc',
    kind: 'asyncapi',
    href: path,
    type: 'application/vnd.aai.asyncapi+json',
    profile: `https://www.asyncapi.com/definitions/${version}`,
    title: `AsyncAPI ${version} spec`,
  };
}

export function jsonSchemaSpec(path: string, draft: '2020-12' | '2019-09' | '07' = '2020-12'): ApiSpecRef {
  const draftYear = draft === '07' ? '07' : draft;
  return {
    rel: 'service-desc',
    kind: 'json-schema',
    href: path,
    type: 'application/schema+json',
    profile: `https://json-schema.org/draft/${draftYear}/schema`,
    title: `JSON Schema (draft ${draftYear})`,
  };
}
