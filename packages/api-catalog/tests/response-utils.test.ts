import { describe, expect, it } from 'vitest';
import { createGetResponse, createHeadResponse, RFC9727_PROFILE, API_CATALOG_PATH } from '../src/response-utils';
import type { ApiCatalogLinkset } from '../src/linkset';

describe('response-utils', () => {
  const testOrigin = 'https://api.example.com';

  describe('createGetResponse', () => {
    it('creates a GET response with correct headers and body', () => {
      const linkset: ApiCatalogLinkset = {
        linkset: [
          {
            anchor: 'https://api.example.com/api/v1',
            'service-desc': [{ href: '/api/v1/openapi.json' }],
          },
        ],
        'linkset-metadata': [{ profile: RFC9727_PROFILE }],
      };

      const response = createGetResponse(linkset, testOrigin);

      expect(response.status).toBe(200);
      expect(response.headers['Content-Type']).toContain('application/linkset+json');
      expect(response.headers['Content-Type']).toContain(RFC9727_PROFILE);
      expect(response.headers['Link']).toContain('/.well-known/api-catalog');
      expect(response.headers['Link']).toContain('rel="api-catalog"');
      expect(response.body).toBe(JSON.stringify(linkset));
    });
  });

  describe('createHeadResponse', () => {
    it('creates a HEAD response with correct headers and no body', () => {
      const response = createHeadResponse(testOrigin);

      expect(response.status).toBe(200);
      expect(response.headers['Content-Type']).toContain('application/linkset+json');
      expect(response.headers['Content-Type']).toContain(RFC9727_PROFILE);
      expect(response.headers['Link']).toContain('/.well-known/api-catalog');
      expect(response.headers['Link']).toContain('rel="api-catalog"');
      expect(response.body).toBeNull();
    });
  });

  describe('exported constants', () => {
    it('exports RFC9727_PROFILE', () => {
      expect(RFC9727_PROFILE).toBe('https://www.rfc-editor.org/info/rfc9727');
    });

    it('exports API_CATALOG_PATH', () => {
      expect(API_CATALOG_PATH).toBe('/.well-known/api-catalog');
    });
  });
});
