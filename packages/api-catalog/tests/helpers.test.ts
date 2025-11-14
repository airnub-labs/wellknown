import { describe, expect, it } from 'vitest';
import { openApiSpec, graphqlSchemaSpec, asyncApiSpec, jsonSchemaSpec } from '../src/helpers';

describe('Helper Functions', () => {
  describe('openApiSpec', () => {
    it('generates OpenAPI 3.1 spec by default', () => {
      const spec = openApiSpec('/api/openapi.json');
      expect(spec).toEqual({
        rel: 'service-desc',
        kind: 'openapi',
        href: '/api/openapi.json',
        type: 'application/vnd.oai.openapi+json',
        profile: 'https://spec.openapis.org/oas/3.1',
        title: 'OpenAPI 3.1 spec',
      });
    });

    it('generates OpenAPI 3.0 spec when specified', () => {
      const spec = openApiSpec('/api/openapi.json', '3.0');
      expect(spec).toEqual({
        rel: 'service-desc',
        kind: 'openapi',
        href: '/api/openapi.json',
        type: 'application/vnd.oai.openapi+json',
        profile: 'https://spec.openapis.org/oas/3.0',
        title: 'OpenAPI 3.0 spec',
      });
    });
  });

  describe('graphqlSchemaSpec', () => {
    it('generates GraphQL SDL spec by default', () => {
      const spec = graphqlSchemaSpec('/api/schema.graphql');
      expect(spec).toEqual({
        rel: 'service-desc',
        kind: 'graphql',
        href: '/api/schema.graphql',
        type: 'application/graphql',
        profile: undefined,
        title: 'GraphQL schema',
      });
    });

    it('generates GraphQL SDL spec when explicitly specified', () => {
      const spec = graphqlSchemaSpec('/api/schema.graphql', { format: 'sdl' });
      expect(spec).toEqual({
        rel: 'service-desc',
        kind: 'graphql',
        href: '/api/schema.graphql',
        type: 'application/graphql',
        profile: undefined,
        title: 'GraphQL schema',
      });
    });

    it('generates GraphQL introspection spec when specified', () => {
      const spec = graphqlSchemaSpec('/api/introspection', { format: 'introspection' });
      expect(spec).toEqual({
        rel: 'service-desc',
        kind: 'graphql',
        href: '/api/introspection',
        type: 'application/json',
        profile: 'https://spec.graphql.org/introspection',
        title: 'GraphQL introspection result',
      });
    });
  });

  describe('asyncApiSpec', () => {
    it('generates AsyncAPI 3.0 spec by default', () => {
      const spec = asyncApiSpec('/api/asyncapi.json');
      expect(spec).toEqual({
        rel: 'service-desc',
        kind: 'asyncapi',
        href: '/api/asyncapi.json',
        type: 'application/vnd.aai.asyncapi+json',
        profile: 'https://www.asyncapi.com/definitions/3.0',
        title: 'AsyncAPI 3.0 spec',
      });
    });

    it('generates AsyncAPI 2.0 spec when specified', () => {
      const spec = asyncApiSpec('/api/asyncapi.json', '2.0');
      expect(spec).toEqual({
        rel: 'service-desc',
        kind: 'asyncapi',
        href: '/api/asyncapi.json',
        type: 'application/vnd.aai.asyncapi+json',
        profile: 'https://www.asyncapi.com/definitions/2.0',
        title: 'AsyncAPI 2.0 spec',
      });
    });
  });

  describe('jsonSchemaSpec', () => {
    it('generates JSON Schema 2020-12 spec by default', () => {
      const spec = jsonSchemaSpec('/api/schema.json');
      expect(spec).toEqual({
        rel: 'service-desc',
        kind: 'json-schema',
        href: '/api/schema.json',
        type: 'application/schema+json',
        profile: 'https://json-schema.org/draft/2020-12/schema',
        title: 'JSON Schema (draft 2020-12)',
      });
    });

    it('generates JSON Schema 2019-09 spec when specified', () => {
      const spec = jsonSchemaSpec('/api/schema.json', '2019-09');
      expect(spec).toEqual({
        rel: 'service-desc',
        kind: 'json-schema',
        href: '/api/schema.json',
        type: 'application/schema+json',
        profile: 'https://json-schema.org/draft/2019-09/schema',
        title: 'JSON Schema (draft 2019-09)',
      });
    });

    it('generates JSON Schema draft-07 spec when specified', () => {
      const spec = jsonSchemaSpec('/api/schema.json', '07');
      expect(spec).toEqual({
        rel: 'service-desc',
        kind: 'json-schema',
        href: '/api/schema.json',
        type: 'application/schema+json',
        profile: 'https://json-schema.org/draft/07/schema',
        title: 'JSON Schema (draft 07)',
      });
    });
  });
});
