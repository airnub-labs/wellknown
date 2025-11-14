import { describe, expect, it } from 'vitest';
import { buildApiCatalogLinkset } from '../src/builder';
import type { ApiCatalogConfig } from '../src/types';
import { createMockRequest } from './test-helpers';
import { openApiSpec, graphqlSchemaSpec } from '../src/helpers';

describe('buildApiCatalogLinkset', () => {
  const config: ApiCatalogConfig = {
    publisher: 'airnub-labs',
    apis: [
      {
        id: 'rotation-detector',
        title: 'Rotation Detector API',
        basePath: '/apis/rotation',
        specs: [
          openApiSpec('/apis/rotation/openapi.json'),
          {
            rel: 'service-doc',
            href: 'https://docs.airnub.dev/rotation',
            type: 'text/html',
            title: 'Docs',
          },
        ],
      },
      {
        id: 'whales-proxy',
        basePath: '/apis/unw',
        specs: [graphqlSchemaSpec('/apis/unw/schema.graphql')],
      },
    ],
  };

  it('builds a linkset with anchors derived from the request origin', () => {
    const req = createMockRequest({
      headers: {
        host: 'api.example.com',
      },
    });

    const result = buildApiCatalogLinkset(config, { req });
    expect(result.linkset).toHaveLength(2);
    expect(result.linkset[0].anchor).toBe('http://api.example.com/apis/rotation');
    expect(result.linkset[0]['service-desc']).toHaveLength(1);
    expect(result.linkset[0]['service-doc']).toHaveLength(1);
    expect(result.linkset[1].anchor).toBe('http://api.example.com/apis/unw');
    expect(result.linkset[1]['service-desc']?.[0].type).toBe('application/graphql');
  });

  it('prefers absolute anchors when provided', () => {
    const absoluteConfig: ApiCatalogConfig = {
      apis: [
        {
          id: 'absolute',
          absoluteAnchor: 'https://api.example.com/custom',
          specs: [openApiSpec('https://api.example.com/custom/openapi.json')],
        },
      ],
    };

    const req = createMockRequest({ headers: { host: 'ignored.example' } });
    const result = buildApiCatalogLinkset(absoluteConfig, { req });
    expect(result.linkset[0].anchor).toBe('https://api.example.com/custom');
  });
});
