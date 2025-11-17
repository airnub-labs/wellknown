import { describe, expect, it } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { registerExpressApiCatalog } from '../src/handlers/express';
import type { ApiCatalogConfig } from '../src/types';

describe('registerExpressApiCatalog', () => {
  const config: ApiCatalogConfig = {
    apis: [
      {
        id: 'test-api',
        basePath: '/api/v1',
        specs: [{ href: '/api/v1/openapi.json' }],
      },
    ],
  };

  let app: Express;

  it('automatically registers GET and HEAD routes at /.well-known/api-catalog', async () => {
    app = express();
    registerExpressApiCatalog(app, config);

    // Test GET
    const getResponse = await request(app).get('/.well-known/api-catalog');
    expect(getResponse.status).toBe(200);
    expect(getResponse.headers['content-type']).toContain('application/linkset+json');
    expect(getResponse.headers['link']).toContain('rel="api-catalog"');
    expect(getResponse.body).toHaveProperty('linkset');
    expect(getResponse.body.linkset).toHaveLength(1);

    // Test HEAD
    const headResponse = await request(app).head('/.well-known/api-catalog');
    expect(headResponse.status).toBe(200);
    expect(headResponse.headers['content-type']).toContain('application/linkset+json');
    expect(headResponse.headers['link']).toContain('rel="api-catalog"');
    expect(headResponse.body).toEqual({});
  });

  it('handles publisher and title in config', async () => {
    app = express();
    const configWithMetadata: ApiCatalogConfig = {
      publisher: 'test-publisher',
      apis: [
        {
          id: 'test-api',
          title: 'Test API',
          basePath: '/api/v1',
          specs: [{ href: '/api/v1/openapi.json' }],
        },
      ],
    };

    registerExpressApiCatalog(app, configWithMetadata);

    const response = await request(app).get('/.well-known/api-catalog');
    expect(response.status).toBe(200);
    expect(response.body['linkset-metadata']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ publisher: 'test-publisher' }),
      ])
    );
  });

  it('generates correct anchors from request host', async () => {
    app = express();
    registerExpressApiCatalog(app, config);

    const response = await request(app).get('/.well-known/api-catalog').set('Host', 'api.example.com');
    expect(response.status).toBe(200);
    expect(response.body.linkset[0].anchor).toContain('api.example.com');
  });
});
