import type { FastifyInstance } from 'fastify';
import type { ApiCatalogConfig } from '../types';
import { buildApiCatalogLinkset } from '../builder';

const RFC9727_PROFILE = 'https://www.rfc-editor.org/info/rfc9727';

export function registerFastifyApiCatalog(fastify: FastifyInstance, config: ApiCatalogConfig) {
  fastify.get('/.well-known/api-catalog', async (request, reply) => {
    const linkset = buildApiCatalogLinkset(config, {
      req: request.raw,
    });

    return reply
      .code(200)
      .header('Content-Type', `application/linkset+json; profile="${RFC9727_PROFILE}"`)
      .send(linkset);
  });

  fastify.head('/.well-known/api-catalog', async (request, reply) => {
    const proto = request.protocol;
    const host = request.headers['host'] ?? 'localhost';
    const url = `${proto}://${host}/.well-known/api-catalog`;
    return reply.header('Link', `<${url}>; rel="api-catalog"`).send();
  });
}
