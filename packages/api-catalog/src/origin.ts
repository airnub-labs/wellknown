import { IncomingMessage as NodeIncomingMessage } from 'http';
import type { IncomingMessage } from 'http';
import type { TLSSocket } from 'tls';
import forwarded from 'forwarded-http';
import proxyaddr from 'proxy-addr';
import type { OriginStrategy, TrustProxySetting } from './types';

export const DEFAULT_ORIGIN_STRATEGY: OriginStrategy = { kind: 'fromRequest', trustProxy: false };

export function normalizeOriginStrategy(strategy?: OriginStrategy): OriginStrategy {
  return strategy ?? DEFAULT_ORIGIN_STRATEGY;
}

export interface OriginResult {
  scheme: 'http' | 'https';
  host: string;
  origin: string;
}

export interface ResolveOriginOptions {
  strategy: OriginStrategy;
  req: IncomingMessage;
}

type TrustFunction = (addr: string, index: number) => boolean;

function getTrustFunction(setting?: TrustProxySetting): TrustFunction | undefined {
  if (setting === undefined) return undefined;
  if (typeof setting === 'boolean') {
    return setting ? () => true : () => false;
  }
  if (typeof setting === 'function') {
    return setting;
  }
  return proxyaddr.compile(setting);
}

function connectionIsTrusted(req: IncomingMessage, trustFn?: TrustFunction): boolean {
  if (!trustFn) return false;
  let addresses: string[] = [];
  try {
    addresses = proxyaddr.all(req);
  } catch {
    return false;
  }
  if (addresses.length === 0) return false;
  return trustFn(addresses[0], 0);
}

function normalizeHost(host: string): string {
  return host.trim().replace(/\/+$/, '');
}

function defaultScheme(req: IncomingMessage): 'http' | 'https' {
  const socket = req.socket as TLSSocket;
  return socket && socket.encrypted ? 'https' : 'http';
}

export function resolveOrigin({ strategy, req }: ResolveOriginOptions): OriginResult {
  if (strategy.kind === 'fixed') {
    const url = new URL(strategy.origin.replace(/\/+$/, ''));
    const scheme = (url.protocol.replace(':', '') || 'https') as 'http' | 'https';
    const host = normalizeHost(url.host);
    return { scheme, host, origin: `${scheme}://${host}` };
  }

  let scheme: 'http' | 'https' = defaultScheme(req);
  let host = normalizeHost(((req.headers['host'] as string | undefined) ?? 'localhost'));

  const trustFn = getTrustFunction(strategy.trustProxy);
  const forwardedTrusted = connectionIsTrusted(req, trustFn);
  const canUseForwarded = forwardedTrusted && req instanceof NodeIncomingMessage;

  if (canUseForwarded) {
    const info = forwarded(req, { allowPrivate: true });
    if (info.proto === 'http' || info.proto === 'https') {
      scheme = info.proto;
    }
    if (info.host) {
      host = normalizeHost(info.host);
    }
  }

  const origin = `${scheme}://${host}`;
  return { scheme, host, origin };
}
