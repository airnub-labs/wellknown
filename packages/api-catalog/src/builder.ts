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

import type { IncomingMessage } from 'http';
import type { ApiCatalogConfig, ApiEntryConfig, LinkObject, OriginStrategy } from './types';
import type { ApiCatalogLinkset, LinksetContext, LinksetMetadata } from './linkset';
import { resolveOrigin, normalizeOriginStrategy } from './origin';
import type { OriginResult } from './origin';
import { RFC9727_PROFILE } from './constants';

export interface BuildContextOptions {
  req: IncomingMessage;
  originStrategy?: OriginStrategy;
  resolvedOrigin?: OriginResult;
}

function joinPaths(origin: string, prefix?: string, basePath?: string): string {
  const parts: string[] = [origin.replace(/\/+$/, '')];
  if (prefix) {
    parts.push(prefix.replace(/^\/+/, '').replace(/\/+$/, ''));
  }
  const base = basePath ?? '/';
  if (base && base !== '/') {
    parts.push(base.replace(/^\/+/, '').replace(/\/+$/, ''));
  }
  return parts.join('/');
}

function buildContextForApi(
  api: ApiEntryConfig,
  origin: string,
  basePathPrefix?: string
): LinksetContext {
  const anchor = (api.absoluteAnchor ?? joinPaths(origin, basePathPrefix, api.basePath ?? '/')).replace(
    /\/+$/,
    ''
  );

  const ctx: LinksetContext = { anchor };

  for (const spec of api.specs) {
    const { rel: relOverride, kind: _kind, ...rest } = spec;
    const rel = relOverride ?? 'service-desc';
    const bucket = ((ctx[rel] as LinkObject[]) ?? []) as LinkObject[];
    bucket.push(rest);
    ctx[rel] = bucket as LinkObject[];
  }

  return ctx;
}

function buildMetadata(publisher?: string): LinksetMetadata[] {
  const metadata: LinksetMetadata = { profile: RFC9727_PROFILE };
  if (publisher) {
    metadata.publisher = publisher;
  }
  return [metadata];
}

interface BuildForOriginOptions {
  basePathPrefix?: string;
}

function buildApiCatalogLinksetForOriginInternal(
  config: ApiCatalogConfig,
  origin: string,
  options?: BuildForOriginOptions
): ApiCatalogLinkset {
  const linkset: LinksetContext[] = config.apis.map((api) =>
    buildContextForApi(api, origin, options?.basePathPrefix)
  );

  return { linkset, 'linkset-metadata': buildMetadata(config.publisher) };
}

export function buildApiCatalogLinkset(
  config: ApiCatalogConfig,
  options: BuildContextOptions
): ApiCatalogLinkset {
  const originStrategy = options.originStrategy ?? normalizeOriginStrategy(config.originStrategy);
  const resolvedOrigin = options.resolvedOrigin ?? resolveOrigin({ strategy: originStrategy, req: options.req });
  const basePathPrefix = originStrategy.basePath;

  return buildApiCatalogLinksetForOriginInternal(config, resolvedOrigin.origin, { basePathPrefix });
}

export function buildApiCatalogLinksetForOrigin(
  config: ApiCatalogConfig,
  origin: string,
  options?: BuildForOriginOptions
): ApiCatalogLinkset {
  const normalizedStrategy = normalizeOriginStrategy(config.originStrategy);
  const basePathPrefix = options?.basePathPrefix ?? normalizedStrategy.basePath;
  return buildApiCatalogLinksetForOriginInternal(config, origin, { basePathPrefix });
}
