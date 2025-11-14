import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  createExpressApiCatalogHandler,
  createExpressApiCatalogHeadHandler,
} from '../src/handlers/express';
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

describe('Express handlers', () => {
  it('serves the api catalog as Linkset JSON', async () => {
    const app = express();
    app.get('/.well-known/api-catalog', createExpressApiCatalogHandler(config));

    const res = await request(app)
      .get('/.well-known/api-catalog')
      .set('host', 'api.example.com');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/linkset+json');
    expect(res.body.linkset).toHaveLength(1);
    expect(res.body.linkset[0].anchor).toBe('http://api.example.com/apis/rotation');
    expect(res.headers['link']).toBe('<http://api.example.com/.well-known/api-catalog>; rel="api-catalog"');
  });

  it('returns a Link header for HEAD requests', async () => {
    const app = express();
    app.head('/.well-known/api-catalog', createExpressApiCatalogHeadHandler());

    const res = await request(app).head('/.well-known/api-catalog').set('host', 'api.example.com');

    expect(res.status).toBe(200);
    expect(res.headers['link']).toBe('<http://api.example.com/.well-known/api-catalog>; rel="api-catalog"');
    expect(res.headers['content-type']).toContain('application/linkset+json');
    expect(res.text).toBeUndefined();
  });
});
