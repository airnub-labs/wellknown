import { describe, expect, it } from 'vitest';
import { createApiCatalogHandler, tryHandleApiCatalog } from '../src/handlers/supabase';
import type { ApiCatalogConfig } from '../src/types';

describe('Supabase/Deno handlers', () => {
  const config: ApiCatalogConfig = {
    apis: [
      {
        id: 'test-api',
        basePath: '/api/v1',
        specs: [{ href: '/api/v1/openapi.json' }],
      },
    ],
  };

  describe('createApiCatalogHandler', () => {
    it('handles GET requests at /.well-known/api-catalog', async () => {
      const handler = createApiCatalogHandler(config);
      const request = new Request('https://api.example.com/.well-known/api-catalog');

      const response = handler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/linkset+json');
      expect(response.headers.get('Link')).toContain('rel="api-catalog"');

      const body = await response.json();
      expect(body).toHaveProperty('linkset');
      expect(body.linkset).toHaveLength(1);
      expect(body.linkset[0].anchor).toBe('https://api.example.com/api/v1');
    });

    it('handles HEAD requests at /.well-known/api-catalog', () => {
      const handler = createApiCatalogHandler(config);
      const request = new Request('https://api.example.com/.well-known/api-catalog', {
        method: 'HEAD',
      });

      const response = handler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/linkset+json');
      expect(response.headers.get('Link')).toContain('rel="api-catalog"');
      expect(response.body).toBeNull();
    });

    it('returns 404 for non-catalog paths', () => {
      const handler = createApiCatalogHandler(config);
      const request = new Request('https://api.example.com/other-path');

      const response = handler(request);

      expect(response.status).toBe(404);
    });

    it('returns 405 for unsupported methods', () => {
      const handler = createApiCatalogHandler(config);
      const request = new Request('https://api.example.com/.well-known/api-catalog', {
        method: 'POST',
      });

      const response = handler(request);

      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET, HEAD');
    });
  });

  describe('tryHandleApiCatalog', () => {
    it('handles catalog requests and returns response', () => {
      const handler = tryHandleApiCatalog(config);
      const request = new Request('https://api.example.com/.well-known/api-catalog');

      const response = handler(request);

      expect(response).not.toBeNull();
      expect(response!.status).toBe(200);
    });

    it('returns null for non-catalog paths', () => {
      const handler = tryHandleApiCatalog(config);
      const request = new Request('https://api.example.com/other-path');

      const response = handler(request);

      expect(response).toBeNull();
    });

    it('allows chaining with other handlers', async () => {
      const catalogHandler = tryHandleApiCatalog(config);

      const mainHandler = (request: Request): Response => {
        const catalogResponse = catalogHandler(request);
        if (catalogResponse) return catalogResponse;

        return new Response('Hello World');
      };

      // Catalog request
      const catalogRequest = new Request('https://api.example.com/.well-known/api-catalog');
      const catalogResponse = mainHandler(catalogRequest);
      expect(catalogResponse.status).toBe(200);
      expect(catalogResponse.headers.get('Content-Type')).toContain('application/linkset+json');

      // Other request
      const otherRequest = new Request('https://api.example.com/hello');
      const otherResponse = mainHandler(otherRequest);
      expect(otherResponse.status).toBe(200);
      expect(await otherResponse.text()).toBe('Hello World');
    });
  });
});
