import { describe, expect, it } from 'vitest';

describe('package entrypoints', () => {
  it('exposes the documented API from the CommonJS bundle', async () => {
    const mod = await import('../dist/index.cjs');
    expect(typeof mod.buildApiCatalogLinkset).toBe('function');
    expect(typeof mod.createExpressApiCatalogHandler).toBe('function');
  });

  it('exposes the documented API from the ESM bundle', async () => {
    const mod = await import('../dist/index.mjs');
    expect(typeof mod.registerFastifyApiCatalog).toBe('function');
    expect(typeof mod.openApiSpec).toBe('function');
  });
});
