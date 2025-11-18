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

export function graphqlSchemaSpec(path: string): ApiSpecRef {
  return {
    rel: 'service-desc',
    kind: 'graphql',
    href: path,
    type: 'application/graphql',
    title: 'GraphQL schema',
  };
}
