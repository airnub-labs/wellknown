import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import {
  fastifyApiCatalogPlugin,
  registerFastifyApiCatalog,
  registerFastifyApiCatalogRoutes,
} from '../src/handlers/fastify';
import type { ApiCatalogConfig } from '../src/types';
import { openApiSpec } from '../src/helpers';

const config: ApiCatalogConfig = {
  apis: [
    {
      id: 'example-service-one',
      basePath: '/apis/service-one',
      specs: [openApiSpec('/apis/service-one/openapi.json')],
    },
  ],
};

describe('Fastify handlers', () => {
  it('registers GET and HEAD routes via simplified API', async () => {
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
    expect(body.linkset[0].anchor).toBe('http://api.example.com/apis/service-one');
    expect(getRes.headers['link']).toBe(
      '<http://api.example.com/.well-known/api-catalog>; rel="api-catalog"'
    );

    const headRes = await fastify.inject({
      method: 'HEAD',
      url: '/.well-known/api-catalog',
      headers: { host: 'api.example.com' },
    });

    expect(headRes.statusCode).toBe(200);
    expect(headRes.headers['link']).toBe(
      '<http://api.example.com/.well-known/api-catalog>; rel="api-catalog"'
    );
    expect(headRes.headers['content-type']).toContain('application/linkset+json');
    expect(headRes.body).toBe('');
  });

  it('registers GET and HEAD routes via plugin (advanced usage)', async () => {
    const fastify = Fastify();
    await fastify.register(fastifyApiCatalogPlugin, { config });

    const getRes = await fastify.inject({
      method: 'GET',
      url: '/.well-known/api-catalog',
      headers: { host: 'api.example.com' },
      remoteAddress: '127.0.0.1',
    });

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toContain('application/linkset+json');
    const body = getRes.json();
    expect(body.linkset[0].anchor).toBe('http://api.example.com/apis/service-one');
  });

  it('keeps deprecated registerFastifyApiCatalogRoutes for backwards compatibility', async () => {
    const fastify = Fastify();
    registerFastifyApiCatalogRoutes(fastify, config);

    const res = await fastify.inject({
      method: 'GET',
      url: '/.well-known/api-catalog',
      headers: { host: 'api.example.com' },
      remoteAddress: '127.0.0.1',
    });

    expect(res.statusCode).toBe(200);
  });
});
