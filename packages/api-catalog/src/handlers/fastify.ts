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

import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import type { ApiCatalogConfig } from '../types';
import { buildApiCatalogLinkset } from '../builder';
import { resolveOrigin, normalizeOriginStrategy } from '../origin';
import { API_CATALOG_PATH, LINKSET_CONTENT_TYPE, API_CATALOG_LINK_REL } from '../constants';

export interface FastifyApiCatalogPluginOptions {
  config: ApiCatalogConfig;
}

export const fastifyApiCatalogPlugin: FastifyPluginCallback<FastifyApiCatalogPluginOptions> = (
  fastify,
  opts,
  done
) => {
  if (!opts?.config) {
    done(new Error('fastifyApiCatalogPlugin requires a config option.'));
    return;
  }

  registerFastifyApiCatalogRoutes(fastify, opts.config);
  done();
};

export function registerFastifyApiCatalogRoutes(fastify: FastifyInstance, config: ApiCatalogConfig) {
  const originStrategy = normalizeOriginStrategy(config.originStrategy);
  fastify.get('/.well-known/api-catalog', async (request, reply) => {
    const resolvedOrigin = resolveOrigin({ strategy: originStrategy, req: request.raw });
    const catalogUrl = `${resolvedOrigin.origin}${API_CATALOG_PATH}`;
    const linkset = buildApiCatalogLinkset(config, {
      req: request.raw,
      originStrategy,
      resolvedOrigin,
    });

    return reply
      .code(200)
      .header('Content-Type', LINKSET_CONTENT_TYPE)
      .header('Link', `<${catalogUrl}>; rel="${API_CATALOG_LINK_REL}"`)
      .send(linkset);
  });

  fastify.head('/.well-known/api-catalog', async (request, reply) => {
    const resolvedOrigin = resolveOrigin({ strategy: originStrategy, req: request.raw });
    const catalogUrl = `${resolvedOrigin.origin}${API_CATALOG_PATH}`;
    return reply
      .code(200)
      .header('Content-Type', LINKSET_CONTENT_TYPE)
      .header('Link', `<${catalogUrl}>; rel="${API_CATALOG_LINK_REL}"`)
      .send();
  });
}

/** @deprecated Use fastifyApiCatalogPlugin instead. */
export const registerFastifyApiCatalog = registerFastifyApiCatalogRoutes;
