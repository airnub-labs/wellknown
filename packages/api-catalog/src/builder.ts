import type { IncomingMessage } from 'http';
import type { ApiCatalogConfig, ApiEntryConfig, LinkObject } from './types';
import type { ApiCatalogLinkset, LinksetContext } from './linkset';
import { resolveOrigin } from './origin';

export interface BuildContextOptions {
  req: IncomingMessage;
}

function joinPaths(origin: string, prefix?: string, basePath?: string): string {
  const parts: string[] = [origin.replace(/\/+$/, '')];
  if (prefix) {
    parts.push(prefix.replace(/^\/+/, '').replace(/\/+$/, ''));
  }
  const base = basePath ?? '/';
  if (base && base !== '/') {
    parts.push(base.replace(/^\/+/, '').replace(/\/+$/, ''));
  }
  return parts.join('/');
}

function buildContextForApi(
  api: ApiEntryConfig,
  origin: string,
  basePathPrefix?: string
): LinksetContext {
  const anchor = (api.absoluteAnchor ?? joinPaths(origin, basePathPrefix, api.basePath ?? '/')).replace(
    /\/+$/,
    ''
  );

  const ctx: LinksetContext = { anchor };

  for (const spec of api.specs) {
    const { rel: relOverride, kind: _kind, ...rest } = spec;
    const rel = relOverride ?? 'service-desc';
    const bucket = ((ctx[rel] as LinkObject[]) ?? []) as LinkObject[];
    bucket.push(rest);
    ctx[rel] = bucket as LinkObject[];
  }

  return ctx;
}

export function buildApiCatalogLinkset(
  config: ApiCatalogConfig,
  options: BuildContextOptions
): ApiCatalogLinkset {
  const originStrategy = config.originStrategy ?? { kind: 'fromRequest', trustProxy: true };
  const { origin } = resolveOrigin({ strategy: originStrategy, req: options.req });
  const basePathPrefix = originStrategy.basePath;

  const linkset: LinksetContext[] = config.apis.map((api) =>
    buildContextForApi(api, origin, basePathPrefix)
  );

  return { linkset };
}
