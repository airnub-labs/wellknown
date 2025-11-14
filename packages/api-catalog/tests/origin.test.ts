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

  it('supports fixed origin strategy', () => {
    const req = createMockRequest({});
    const strategy: OriginStrategy = { kind: 'fixed', origin: 'https://api.airnub.dev' };
    const result = resolveOrigin({ strategy, req });
    expect(result.origin).toBe('https://api.airnub.dev');
  });
});
