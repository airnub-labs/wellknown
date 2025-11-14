import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { registerFastifyApiCatalog } from '../src/handlers/fastify';
import type { ApiCatalogConfig } from '../src/types';
import { openApiSpec } from '../src/helpers';

const config: ApiCatalogConfig = {
  apis: [
    {
      id: 'rotation',
      basePath: '/apis/rotation',
      specs: [openApiSpec('/apis/rotation/openapi.json')],
    },
  ],
};

describe('Fastify handler', () => {
  it('registers GET and HEAD routes that emit the catalog', async () => {
    const fastify = Fastify();
    registerFastifyApiCatalog(fastify, config);

    const getRes = await fastify.inject({
      method: 'GET',
      url: '/.well-known/api-catalog',
      headers: { host: 'api.example.com' },
      remoteAddress: '127.0.0.1',
    });

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toContain('application/linkset+json');
    const body = getRes.json();
    expect(body.linkset[0].anchor).toBe('http://api.example.com/apis/rotation');

    const headRes = await fastify.inject({
      method: 'HEAD',
      url: '/.well-known/api-catalog',
      headers: { host: 'api.example.com' },
    });

    expect(headRes.statusCode).toBe(200);
    expect(headRes.headers['link']).toBe('<http://api.example.com/.well-known/api-catalog>; rel="api-catalog"');
  });
});
