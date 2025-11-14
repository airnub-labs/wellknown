import type { FastifyInstance } from 'fastify';
import type { ApiCatalogConfig } from '../types';
import { buildApiCatalogLinkset } from '../builder';
import { resolveOrigin, normalizeOriginStrategy } from '../origin';
import { API_CATALOG_PATH, LINKSET_CONTENT_TYPE, API_CATALOG_LINK_REL } from '../constants';

export function registerFastifyApiCatalog(fastify: FastifyInstance, config: ApiCatalogConfig) {
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
