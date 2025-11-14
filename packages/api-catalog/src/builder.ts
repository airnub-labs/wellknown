import type { IncomingMessage } from 'http';
import type { ApiCatalogConfig, ApiEntryConfig, LinkObject, OriginStrategy } from './types';
import type { ApiCatalogLinkset, LinksetContext, LinksetMetadata } from './linkset';
import { resolveOrigin, normalizeOriginStrategy } from './origin';
import type { OriginResult } from './origin';
import { RFC9727_PROFILE } from './constants';

export interface BuildContextOptions {
  req: IncomingMessage;
  originStrategy?: OriginStrategy;
  resolvedOrigin?: OriginResult;
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

function buildMetadata(publisher?: string): LinksetMetadata[] {
  const metadata: LinksetMetadata = { profile: RFC9727_PROFILE };
  if (publisher) {
    metadata.publisher = publisher;
  }
  return [metadata];
}

export function buildApiCatalogLinkset(
  config: ApiCatalogConfig,
  options: BuildContextOptions
): ApiCatalogLinkset {
  const originStrategy = options.originStrategy ?? normalizeOriginStrategy(config.originStrategy);
  const resolvedOrigin = options.resolvedOrigin ?? resolveOrigin({ strategy: originStrategy, req: options.req });
  const basePathPrefix = originStrategy.basePath;

  const linkset: LinksetContext[] = config.apis.map((api) =>
    buildContextForApi(api, resolvedOrigin.origin, basePathPrefix)
  );

  return { linkset, 'linkset-metadata': buildMetadata(config.publisher) };
}
