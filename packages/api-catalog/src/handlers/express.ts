import type { Request, Response, NextFunction } from 'express';
import type { ApiCatalogConfig } from '../types';
import { buildApiCatalogLinkset } from '../builder';
import { resolveOrigin, normalizeOriginStrategy } from '../origin';
import { API_CATALOG_PATH, LINKSET_CONTENT_TYPE, API_CATALOG_LINK_REL } from '../constants';

export function createExpressApiCatalogHandler(config: ApiCatalogConfig) {
  const originStrategy = normalizeOriginStrategy(config.originStrategy);
  return function apiCatalogHandler(req: Request, res: Response, _next: NextFunction) {
    const resolvedOrigin = resolveOrigin({ strategy: originStrategy, req });
    const catalogUrl = `${resolvedOrigin.origin}${API_CATALOG_PATH}`;
    const linkset = buildApiCatalogLinkset(config, {
      req,
      originStrategy,
      resolvedOrigin,
    });

    res
      .status(200)
      .setHeader('Content-Type', LINKSET_CONTENT_TYPE)
      .setHeader('Link', `<${catalogUrl}>; rel="${API_CATALOG_LINK_REL}"`)
      .json(linkset);
  };
}

export function createExpressApiCatalogHeadHandler(config?: ApiCatalogConfig) {
  const originStrategy = normalizeOriginStrategy(config?.originStrategy);
  return function apiCatalogHeadHandler(req: Request, res: Response, _next: NextFunction) {
    const resolvedOrigin = resolveOrigin({ strategy: originStrategy, req });
    const catalogUrl = `${resolvedOrigin.origin}${API_CATALOG_PATH}`;
    res
      .status(200)
      .setHeader('Content-Type', LINKSET_CONTENT_TYPE)
      .setHeader('Link', `<${catalogUrl}>; rel="${API_CATALOG_LINK_REL}"`)
      .end();
  };
}
