/**
 * Supabase Edge Functions / Deno handler for API catalog
 *
 * This module provides a handler for Supabase Edge Functions and other
 * Deno-based edge runtimes using the standard Fetch API.
 */

import type { ApiCatalogConfig } from '../types';
import { buildApiCatalogLinksetForOrigin } from '../builder';
import { createGetResponse, createHeadResponse, API_CATALOG_PATH } from '../response-utils';

/**
 * Creates a Fetch API request handler for API catalog.
 * Works with Supabase Edge Functions, Deno Deploy, Cloudflare Workers, and any edge runtime.
 *
 * @example
 * ```typescript
 * // supabase/functions/api-catalog/index.ts
 * import { serve } from 'https://deno.land/std/http/server.ts';
 * import { createApiCatalogHandler } from 'npm:@airnub/wellknown-api-catalog';
 *
 * serve(createApiCatalogHandler({
 *   apis: [
 *     {
 *       id: 'my-api',
 *       basePath: '/api/v1',
 *       specs: [{ href: '/api/v1/openapi.json' }]
 *     }
 *   ]
 * }));
 * ```
 */
export function createApiCatalogHandler(config: ApiCatalogConfig): (request: Request) => Response {
  return (request: Request): Response => {
    const url = new URL(request.url);

    // Only handle /.well-known/api-catalog
    if (url.pathname !== API_CATALOG_PATH) {
      return new Response('Not Found', { status: 404 });
    }

    const origin = url.origin;

    // Handle HEAD requests
    if (request.method === 'HEAD') {
      const response = createHeadResponse(origin);
      return new Response(null, {
        status: response.status,
        headers: response.headers,
      });
    }

    // Handle GET requests
    if (request.method === 'GET') {
      const linkset = buildApiCatalogLinksetForOrigin(config, origin);
      const response = createGetResponse(linkset, origin);
      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }

    // Method not allowed
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        Allow: 'GET, HEAD',
      },
    });
  };
}

/**
 * Alternative handler that allows routing to other endpoints.
 * Returns null if the path is not /.well-known/api-catalog, allowing you to chain handlers.
 *
 * @example
 * ```typescript
 * import { serve } from 'https://deno.land/std/http/server.ts';
 * import { tryHandleApiCatalog } from 'npm:@airnub/wellknown-api-catalog';
 *
 * const catalogHandler = tryHandleApiCatalog({ apis: [...] });
 *
 * serve((request: Request) => {
 *   // Try catalog handler first
 *   const catalogResponse = catalogHandler(request);
 *   if (catalogResponse) return catalogResponse;
 *
 *   // Handle other routes
 *   return new Response('Hello World');
 * });
 * ```
 */
export function tryHandleApiCatalog(
  config: ApiCatalogConfig
): (request: Request) => Response | null {
  return (request: Request): Response | null => {
    const url = new URL(request.url);

    // Only handle /.well-known/api-catalog
    if (url.pathname !== API_CATALOG_PATH) {
      return null;
    }

    const origin = url.origin;

    // Handle HEAD requests
    if (request.method === 'HEAD') {
      const response = createHeadResponse(origin);
      return new Response(null, {
        status: response.status,
        headers: response.headers,
      });
    }

    // Handle GET requests
    if (request.method === 'GET') {
      const linkset = buildApiCatalogLinksetForOrigin(config, origin);
      const response = createGetResponse(linkset, origin);
      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }

    // Method not allowed
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        Allow: 'GET, HEAD',
      },
    });
  };
}
