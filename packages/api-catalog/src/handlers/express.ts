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

import type { Request, Response, NextFunction, Router } from 'express';
import type { ApiCatalogConfig } from '../types';
import { buildApiCatalogLinkset } from '../builder';
import { resolveOrigin, normalizeOriginStrategy } from '../origin';
import { API_CATALOG_PATH, LINKSET_CONTENT_TYPE, API_CATALOG_LINK_REL } from '../constants';

export function createExpressApiCatalogHandler(config: ApiCatalogConfig) {
  const originStrategy = normalizeOriginStrategy(config.originStrategy);
  return function apiCatalogHandler(req: Request, res: Response, _next: NextFunction) {
    const resolvedOrigin = resolveOrigin({ strategy: originStrategy, req });
    const catalogUrl = `${resolvedOrigin.origin}${API_CATALOG_PATH}`;
    const linkset = buildApiCatalogLinkset(config, {
      req,
      originStrategy,
      resolvedOrigin,
    });

    res
      .status(200)
      .setHeader('Content-Type', LINKSET_CONTENT_TYPE)
      .setHeader('Link', `<${catalogUrl}>; rel="${API_CATALOG_LINK_REL}"`)
      .json(linkset);
  };
}

export function createExpressApiCatalogHeadHandler(config?: ApiCatalogConfig) {
  const originStrategy = normalizeOriginStrategy(config?.originStrategy);
  return function apiCatalogHeadHandler(req: Request, res: Response, _next: NextFunction) {
    const resolvedOrigin = resolveOrigin({ strategy: originStrategy, req });
    const catalogUrl = `${resolvedOrigin.origin}${API_CATALOG_PATH}`;
    res
      .status(200)
      .setHeader('Content-Type', LINKSET_CONTENT_TYPE)
      .setHeader('Link', `<${catalogUrl}>; rel="${API_CATALOG_LINK_REL}"`)
      .end();
  };
}

/**
 * Simplified API: Registers both GET and HEAD routes automatically at /.well-known/api-catalog
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { registerExpressApiCatalog } from '@airnub/wellknown-api-catalog';
 *
 * const app = express();
 *
 * registerExpressApiCatalog(app, {
 *   apis: [
 *     {
 *       id: 'my-api',
 *       basePath: '/api/v1',
 *       specs: [{ href: '/api/v1/openapi.json' }]
 *     }
 *   ]
 * });
 * ```
 */
export function registerExpressApiCatalog(
  app: Router,
  config: ApiCatalogConfig
): void {
  app.get(API_CATALOG_PATH, createExpressApiCatalogHandler(config));
  app.head(API_CATALOG_PATH, createExpressApiCatalogHeadHandler(config));
}
