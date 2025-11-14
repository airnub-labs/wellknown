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

export interface LinkObject {
  href: string;
  type?: string;
  hreflang?: string | string[];
  title?: string | string[];
  profile?: string | string[];
}

export type ApiSpecKind = 'openapi' | 'asyncapi' | 'graphql' | 'json-schema' | 'other';

export interface ApiSpecRef extends LinkObject {
  rel?: 'service-desc' | 'service-doc' | 'service-meta' | 'status' | string;
  kind?: ApiSpecKind;
}

export type TrustProxySetting =
  | boolean
  | string
  | string[]
  | ((addr: string, index: number) => boolean);

export type OriginStrategy =
  | {
      kind: 'fromRequest';
      trustProxy?: TrustProxySetting;
      basePath?: string;
    }
  | {
      kind: 'fixed';
      origin: string;
      basePath?: string;
    };

export interface ApiEntryConfig {
  id: string;
  title?: string;
  description?: string;
  basePath?: string;
  absoluteAnchor?: string;
  specs: ApiSpecRef[];
}

export interface ApiCatalogConfig {
  publisher?: string;
  originStrategy?: OriginStrategy;
  apis: ApiEntryConfig[];
}
