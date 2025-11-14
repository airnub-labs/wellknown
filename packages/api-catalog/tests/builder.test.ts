import { describe, expect, it } from 'vitest';
import { buildApiCatalogLinkset } from '../src/builder';
import type { ApiCatalogConfig } from '../src/types';
import { createMockRequest } from './test-helpers';
import { openApiSpec, graphqlSchemaSpec } from '../src/helpers';
import { API_CATALOG_LINK_REL } from '../src/constants';

describe('buildApiCatalogLinkset', () => {
  const config: ApiCatalogConfig = {
    publisher: 'example-publisher',
    apis: [
      {
        id: 'example-service-one',
        title: 'Example Service One API',
        basePath: '/apis/service-one',
        specs: [
          openApiSpec('/apis/service-one/openapi.json'),
          {
            rel: 'service-doc',
            href: 'https://docs.example.com/service-one',
            type: 'text/html',
            title: 'Docs',
          },
        ],
      },
      {
        id: 'example-service-two',
        basePath: '/apis/service-two',
        specs: [graphqlSchemaSpec('/apis/service-two/schema.graphql')],
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
    expect(result.linkset[0].anchor).toBe('http://api.example.com/apis/service-one');
    expect(result.linkset[0]['service-desc']).toHaveLength(1);
    expect(result.linkset[0]['service-doc']).toHaveLength(1);
    expect(result.linkset[1].anchor).toBe('http://api.example.com/apis/service-two');
    expect(result.linkset[1]['service-desc']?.[0].type).toBe('application/graphql');
    expect(result['linkset-metadata']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          profile: expect.stringContaining('rfc9727'),
        }),
      ])
    );
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

  it('applies the originStrategy basePath prefix before each api basePath', () => {
    const req = createMockRequest({ headers: { host: 'api.example.com' } });
    const prefixedConfig: ApiCatalogConfig = {
      originStrategy: { kind: 'fixed', origin: 'https://catalog.example.com', basePath: '/apis' },
      apis: [
        {
          id: 'example-service-one',
          basePath: '/service-one',
          specs: [openApiSpec('/service-one/openapi.json')],
        },
      ],
    };

    const result = buildApiCatalogLinkset(prefixedConfig, { req });
    expect(result.linkset[0].anchor).toBe('https://catalog.example.com/apis/service-one');
  });

  it('defaults to the service-desc relation when rel is omitted', () => {
    const req = createMockRequest({ headers: { host: 'api.example.com' } });
    const result = buildApiCatalogLinkset(
      {
        apis: [
          {
            id: 'example-service-one',
            basePath: '/apis/service-one',
            specs: [{ href: '/apis/service-one/openapi.json' }],
          },
        ],
      },
      { req }
    );

    expect(result.linkset[0]['service-desc']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: '/apis/service-one/openapi.json' }),
      ])
    );
  });

  it('allows custom rel overrides', () => {
    const req = createMockRequest({ headers: { host: 'api.example.com' } });
    const result = buildApiCatalogLinkset(
      {
        apis: [
          {
            id: 'docs-only',
            basePath: '/apis/docs',
            specs: [
              {
                rel: API_CATALOG_LINK_REL,
                href: '/custom/catalog',
              },
            ],
          },
        ],
      },
      { req }
    );

    expect(result.linkset[0][API_CATALOG_LINK_REL]).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: '/custom/catalog' })])
    );
  });
});
