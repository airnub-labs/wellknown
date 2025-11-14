/**
 * Copyright 2024-2025 Airnub Technologies Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Next.js App Router handler for API catalog
 *
 * This module provides route handlers for Next.js App Router (app directory).
 * For Pages Router, use the Express handlers with Next.js API routes.
 */

import type { ApiCatalogConfig } from '../types';
import { buildApiCatalogLinksetForOrigin } from '../builder';
import { createGetResponse, createHeadResponse } from '../response-utils';

/**
 * Type definition for Next.js request (compatible with NextRequest)
 */
export interface NextRequestLike {
  url: string;
  method?: string;
}

/**
 * Type definition for Next.js response constructor (compatible with NextResponse)
 */
export interface NextResponseLike {
  json(data: unknown, init?: ResponseInit): Response;
  new (body?: string | null, init?: ResponseInit): Response;
}

/**
 * Creates GET and HEAD handlers for Next.js App Router.
 * Use this in your app/.well-known/api-catalog/route.ts file.
 *
 * @example
 * ```typescript
 * // app/.well-known/api-catalog/route.ts
 * import { NextRequest, NextResponse } from 'next/server';
 * import { createNextApiCatalogRoutes } from '@airnub/wellknown-api-catalog';
 *
 * export const { GET, HEAD } = createNextApiCatalogRoutes({
 *   apis: [
 *     {
 *       id: 'my-api',
 *       basePath: '/api/v1',
 *       specs: [{ href: '/api/v1/openapi.json' }]
 *     }
 *   ]
 * }, NextRequest, NextResponse);
 * ```
 */
export function createNextApiCatalogRoutes<
  TRequest extends NextRequestLike,
  TResponse extends NextResponseLike
>(
  config: ApiCatalogConfig,
  _RequestConstructor: unknown,
  ResponseConstructor: TResponse
): {
  GET: (request: TRequest) => Response;
  HEAD: (request: TRequest) => Response;
} {
  return {
    GET(request: TRequest) {
      const origin = new URL(request.url).origin;
      const linkset = buildApiCatalogLinksetForOrigin(config, origin);
      const response = createGetResponse(linkset, origin);

      return ResponseConstructor.json(JSON.parse(response.body!), {
        status: response.status,
        headers: response.headers,
      });
    },

    HEAD(request: TRequest) {
      const origin = new URL(request.url).origin;
      const response = createHeadResponse(origin);

      return new ResponseConstructor(null, {
        status: response.status,
        headers: response.headers,
      });
    },
  };
}

