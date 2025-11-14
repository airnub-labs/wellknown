import { describe, expect, it } from 'vitest';
import { resolveOrigin } from '../src/origin';
import type { OriginStrategy } from '../src/types';
import { createMockRequest } from './test-helpers';

describe('resolveOrigin', () => {
  it('uses the raw host and protocol when trustProxy is disabled', () => {
    const req = createMockRequest({
      headers: { host: 'edge.example.com' },
      encrypted: false,
    });

    const strategy: OriginStrategy = { kind: 'fromRequest', trustProxy: false };
    const result = resolveOrigin({ strategy, req });
    expect(result.origin).toBe('http://edge.example.com');
  });

  it('respects Forwarded headers when the proxy is trusted', () => {
    const req = createMockRequest({
      headers: {
        host: 'internal.local',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'api.example.com',
      },
      remoteAddress: '10.0.0.5',
    });

    const strategy: OriginStrategy = { kind: 'fromRequest', trustProxy: true };
    const result = resolveOrigin({ strategy, req });
    expect(result.origin).toBe('https://api.example.com');
  });

  it('ignores forwarded headers when the proxy is not trusted', () => {
    const req = createMockRequest({
      headers: {
        host: 'edge.example.com',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'api.example.com',
      },
      remoteAddress: '203.0.113.5',
    });

    const strategy: OriginStrategy = {
      kind: 'fromRequest',
      trustProxy: (addr) => addr === '10.0.0.5',
    };
    const result = resolveOrigin({ strategy, req });
    expect(result.origin).toBe('http://edge.example.com');
  });

  it('ignores RFC 7239 Forwarded headers when trustProxy is false', () => {
    const req = createMockRequest({
      headers: {
        host: 'edge.example.com',
        forwarded: 'for=203.0.113.5;proto=https;host=api.example.com',
      },
      remoteAddress: '203.0.113.5',
    });

    const strategy: OriginStrategy = { kind: 'fromRequest', trustProxy: false };
    const result = resolveOrigin({ strategy, req });
    expect(result.origin).toBe('http://edge.example.com');
  });

  it('uses RFC 7239 Forwarded headers when trustProxy is enabled', () => {
    const req = createMockRequest({
      headers: {
        host: 'internal.local',
        forwarded: 'for=10.0.0.2;proto=https;host=api.forwarded.dev',
      },
      remoteAddress: '10.0.0.5',
    });

    const strategy: OriginStrategy = { kind: 'fromRequest', trustProxy: true };
    const result = resolveOrigin({ strategy, req });
    expect(result.origin).toBe('https://api.forwarded.dev');
  });

  it('supports fixed origin strategy', () => {
    const req = createMockRequest({});
    const strategy: OriginStrategy = { kind: 'fixed', origin: 'https://api.airnub.dev' };
    const result = resolveOrigin({ strategy, req });
    expect(result.origin).toBe('https://api.airnub.dev');
  });

  it('supports fixed origin strategy with a basePath', () => {
    const req = createMockRequest({});
    const strategy: OriginStrategy = {
      kind: 'fixed',
      origin: 'https://api.airnub.dev',
      basePath: '/apis',
    };
    const result = resolveOrigin({ strategy, req });
    expect(result.origin).toBe('https://api.airnub.dev');
  });
});
