import type { Request, Response, NextFunction } from 'express';
import type { ApiCatalogConfig } from '../types';
import { buildApiCatalogLinkset } from '../builder';

const RFC9727_PROFILE = 'https://www.rfc-editor.org/info/rfc9727';

export function createExpressApiCatalogHandler(config: ApiCatalogConfig) {
  return function apiCatalogHandler(req: Request, res: Response, _next: NextFunction) {
    const linkset = buildApiCatalogLinkset(config, {
      req,
    });

    res
      .status(200)
      .setHeader('Content-Type', `application/linkset+json; profile="${RFC9727_PROFILE}"`)
      .json(linkset);
  };
}

export function createExpressApiCatalogHeadHandler() {
  return function apiCatalogHeadHandler(req: Request, res: Response, _next: NextFunction) {
    const proto = req.secure ? 'https' : 'http';
    const host = req.get('host') ?? 'localhost';
    const url = `${proto}://${host}/.well-known/api-catalog`;
    res.status(200).setHeader('Link', `<${url}>; rel="api-catalog"`).end();
  };
}
