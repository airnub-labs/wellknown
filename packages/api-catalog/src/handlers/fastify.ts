import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import type { ApiCatalogConfig } from '../types';
import { buildApiCatalogLinkset } from '../builder';
import { resolveOrigin, normalizeOriginStrategy } from '../origin';
import { API_CATALOG_PATH, LINKSET_CONTENT_TYPE, API_CATALOG_LINK_REL } from '../constants';

/**
 * Simplified API: Registers both GET and HEAD routes automatically at /.well-known/api-catalog
 * This is the recommended way to use the API catalog with Fastify.
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify';
 * import { registerFastifyApiCatalog } from '@airnub/wellknown-api-catalog';
 *
 * const fastify = Fastify();
 *
 * registerFastifyApiCatalog(fastify, {
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
export function registerFastifyApiCatalog(fastify: FastifyInstance, config: ApiCatalogConfig): void {
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

/**
 * Plugin options for fastifyApiCatalogPlugin.
 * Note: For simpler usage, consider using registerFastifyApiCatalog() instead.
 */
export interface FastifyApiCatalogPluginOptions {
  config: ApiCatalogConfig;
}

/**
 * Fastify plugin for API catalog (advanced usage).
 * For most cases, use registerFastifyApiCatalog() instead for a simpler API.
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify';
 * import { fastifyApiCatalogPlugin } from '@airnub/wellknown-api-catalog';
 *
 * const fastify = Fastify();
 *
 * // Plugin style (more complex)
 * fastify.register(fastifyApiCatalogPlugin, {
 *   config: {
 *     apis: [...]
 *   }
 * });
 * ```
 */
export const fastifyApiCatalogPlugin: FastifyPluginCallback<FastifyApiCatalogPluginOptions> = (
  fastify,
  opts,
  done
) => {
  if (!opts?.config) {
    done(new Error('fastifyApiCatalogPlugin requires a config option.'));
    return;
  }

  registerFastifyApiCatalog(fastify, opts.config);
  done();
};

/** @deprecated Use registerFastifyApiCatalog instead. */
export const registerFastifyApiCatalogRoutes = registerFastifyApiCatalog;

