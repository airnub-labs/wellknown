# RFC Compliance Review Report
## wellknown-api-catalog Package

**Review Date:** 2025-11-17
**Package Version:** 0.1.0-next.0
**Reviewer:** Automated RFC Compliance Analysis

---

## Executive Summary

The `@airnub/wellknown-api-catalog` package demonstrates **FULL COMPLIANCE** with all four target RFC specifications:

- ✅ **RFC 9727** - API Catalog Well-Known Location
- ✅ **RFC 9264** - Linkset JSON Format
- ✅ **RFC 8631** - Service Link Relations
- ✅ **RFC 7239** - Forwarded HTTP Header

### Overall Assessment: **COMPLIANT**

The implementation correctly follows all MUST/REQUIRED specifications and implements most SHOULD/RECOMMENDED practices. No breaking compliance issues were identified.

---

## Detailed Compliance Analysis

### 1. RFC 9727: API Catalog Well-Known Location

**Status:** ✅ **FULLY COMPLIANT**

#### Requirements Checklist

| Requirement | Status | Evidence | Location |
|------------|--------|----------|----------|
| Path at `/.well-known/api-catalog` | ✅ PASS | `API_CATALOG_PATH = '/.well-known/api-catalog'` | `src/constants.ts:2` |
| Content-Type: `application/linkset+json` | ✅ PASS | Correct media type used | `src/constants.ts:3` |
| Profile parameter in Content-Type | ✅ PASS | `profile="https://www.rfc-editor.org/info/rfc9727"` | `src/constants.ts:3` |
| Profile URI value | ✅ PASS | `RFC9727_PROFILE = 'https://www.rfc-editor.org/info/rfc9727'` | `src/constants.ts:1` |
| Link header with `rel="api-catalog"` | ✅ PASS | Implemented in all handlers | `src/handlers/express.ts:21`, `src/handlers/fastify.ts:39` |
| GET request support | ✅ PASS | Returns linkset document | All handlers |
| HEAD request support | ✅ PASS | Returns same headers without body | `src/handlers/express.ts:26-37`, `src/handlers/fastify.ts:43-51` |
| Profile in linkset-metadata | ✅ PASS | Included in metadata array | `src/builder.ts:50` |
| Publisher in linkset-metadata | ✅ PASS | Optional, correctly implemented | `src/builder.ts:51-52` |

#### Compliance Notes

**Strengths:**
- Perfect implementation of the well-known URI pattern
- Correct use of the RFC 9727 profile in both Content-Type header and linkset-metadata
- HEAD handler properly mirrors GET handler headers
- Link header correctly advertises the catalog location with proper relation type

**Architecture:**
The implementation uses each API as an anchor with service relations (service-desc, service-doc, etc.), which is a valid RFC 9727 pattern. While RFC 9727 also mentions using "item" relations from the catalog root, the anchor-per-API approach is equally valid and more commonly used in practice.

---

### 2. RFC 9264: Linkset JSON Format

**Status:** ✅ **FULLY COMPLIANT**

#### Requirements Checklist

| Requirement | Status | Evidence | Location |
|------------|--------|----------|----------|
| Top-level "linkset" member | ✅ PASS | `{ linkset: [...] }` | `src/linkset.ts:21` |
| Linkset value is an array | ✅ PASS | Always returns array | `src/builder.ts:66-68` |
| Link context objects have "anchor" | ✅ PASS | `anchor: string` required | `src/linkset.ts:4` |
| Link target objects have "href" | ✅ PASS | `href: string` required | `src/types.ts:2` |
| Relation type members use arrays | ✅ PASS | Targets wrapped in arrays | `src/builder.ts:41-43` |
| Content-Type header | ✅ PASS | `application/linkset+json` | `src/constants.ts:3` |
| UTF-8 encoding | ✅ PASS | JSON.stringify default encoding | Implicit |
| Optional linkset-metadata array | ✅ PASS | Correctly implemented | `src/linkset.ts:22`, `src/builder.ts:49-54` |
| Profile parameter support | ✅ PASS | Included in both places | `src/constants.ts:3`, `src/builder.ts:50` |

#### Compliance Notes

**Strengths:**
- Correct JSON structure with "linkset" as the sole top-level member
- Proper array wrapping for both contexts and link targets (even single items)
- Link objects include all standard attributes: href, type, title, hreflang, profile
- Linkset-metadata correctly formatted as an array of objects
- Profile appears in both Content-Type parameter and linkset-metadata (best practice)

**Code Quality:**
```typescript
// Correct array wrapping for link targets (builder.ts:38-44)
const bucket = ((ctx[rel] as LinkObject[]) ?? []) as LinkObject[];
bucket.push(rest);
ctx[rel] = bucket as LinkObject[];
```

This ensures RFC 9264 compliance: "Even if there is only one link target object, it MUST be wrapped in an array."

---

### 3. RFC 8631: Service Link Relations

**Status:** ✅ **FULLY COMPLIANT**

#### Requirements Checklist

| Requirement | Status | Evidence | Location |
|------------|--------|----------|----------|
| `service-desc` support | ✅ PASS | Defined in types and used | `src/types.ts:12`, `src/helpers.ts:5,17` |
| `service-doc` support | ✅ PASS | Defined in types and used | `src/types.ts:12` |
| `service-meta` support | ✅ PASS | Defined in types and used | `src/types.ts:12` |
| `status` support | ✅ PASS | Defined in types and used | `src/types.ts:12` |
| Default to `service-desc` | ✅ PASS | When rel is omitted | `src/builder.ts:40` |
| Helper functions for common specs | ✅ PASS | OpenAPI and GraphQL helpers | `src/helpers.ts:3-23` |

#### Compliance Notes

**Strengths:**
- All four service link relations from RFC 8631 are fully supported
- Correct default behavior (service-desc when rel is omitted)
- Well-designed helper functions for common API specification formats
- Proper MIME types for OpenAPI (`application/vnd.oai.openapi+json`) and GraphQL (`application/graphql`)
- OpenAPI helpers include version-specific profile URIs (3.0 vs 3.1)

**Helper Function Quality:**
```typescript
export function openApiSpec(path: string, version: '3.0' | '3.1' = '3.1'): ApiSpecRef {
  return {
    rel: 'service-desc',
    kind: 'openapi',
    href: path,
    type: 'application/vnd.oai.openapi+json',
    profile: version === '3.1'
      ? 'https://spec.openapis.org/oas/3.1'
      : 'https://spec.openapis.org/oas/3.0',
    title: `OpenAPI ${version} spec`,
  };
}
```

This demonstrates excellent understanding of both RFC 8631 and OpenAPI standards.

---

### 4. RFC 7239: Forwarded HTTP Header

**Status:** ✅ **FULLY COMPLIANT**

#### Requirements Checklist

| Requirement | Status | Evidence | Location |
|------------|--------|----------|----------|
| Forwarded header parsing | ✅ PASS | Uses `forwarded-http` library | `src/origin.ts:4,75` |
| `proto` parameter support | ✅ PASS | Scheme detection | `src/origin.ts:76-77` |
| `host` parameter support | ✅ PASS | Host extraction | `src/origin.ts:79-80` |
| Proxy trust validation | ✅ PASS | Trust function implementation | `src/origin.ts:27-48` |
| Default untrusted proxy | ✅ PASS | `trustProxy: false` default | `src/origin.ts:8` |
| X-Forwarded-* fallback | ✅ PASS | Library handles this | `forwarded-http` |
| Security: Trust whitelist | ✅ PASS | Supports IP/CIDR/function | `src/types.ts:16-20` |
| TLS detection | ✅ PASS | Socket encryption check | `src/origin.ts:54-56` |

#### Compliance Notes

**Strengths:**
- Excellent security-first design with `trustProxy: false` as the default
- Flexible trust configuration: boolean, string, array, or custom function
- Uses battle-tested libraries: `forwarded-http` (RFC 7239 parsing) and `proxy-addr` (trust validation)
- Proper fallback to direct connection info when proxies are untrusted
- TLS detection for default scheme determination

**Security Implementation:**
```typescript
export const DEFAULT_ORIGIN_STRATEGY: OriginStrategy = {
  kind: 'fromRequest',
  trustProxy: false  // Secure by default!
};

function connectionIsTrusted(req: IncomingMessage, trustFn?: TrustFunction): boolean {
  if (!trustFn) return false;  // Deny by default
  // ... validation logic
}
```

This matches RFC 7239 Section 6 security considerations: "The Forwarded HTTP header field cannot be relied upon to be correct."

**Proxy Trust Options:**
```typescript
export type TrustProxySetting =
  | boolean              // Simple on/off
  | string               // Single IP/CIDR
  | string[]             // Multiple IPs/CIDRs
  | ((addr: string, index: number) => boolean);  // Custom logic
```

This provides Express-compatible semantics while remaining framework-agnostic.

---

## Additional Quality Findings

### Strengths Beyond RFC Compliance

1. **Framework Flexibility**
   - Core functions (`buildApiCatalogLinksetForOrigin`) are completely framework-agnostic
   - Works in Node.js, Edge runtimes, and Deno
   - No dependency on Express/Fastify in the core library

2. **Developer Experience**
   - Helper functions (`openApiSpec`, `graphqlSchemaSpec`) reduce boilerplate
   - TypeScript types provide excellent IntelliSense and compile-time safety
   - Clear separation of concerns (builder, linkset, origin, handlers)

3. **Testing**
   - Comprehensive test coverage of RFC requirements
   - Tests verify both happy paths and edge cases
   - Mock request factory for testing without real servers

4. **Documentation**
   - Excellent README with practical examples
   - Clear explanation of origin strategies
   - Security considerations prominently documented
   - Framework-specific integration guides (Express, Fastify, Next.js, Supabase)

### Architecture Patterns

**Separation of Concerns:**
```
constants.ts    → RFC constants (immutable, single source of truth)
types.ts        → TypeScript contracts (type safety)
linkset.ts      → RFC 9264 data structures
builder.ts      → Core linkset generation logic (framework-agnostic)
origin.ts       → RFC 7239 origin resolution (security-critical)
helpers.ts      → Convenience functions for common specs
handlers/       → Framework-specific adapters (Express, Fastify)
```

This architecture makes the library:
- Easy to test (each module has a single responsibility)
- Easy to extend (add new frameworks by creating new handlers)
- Easy to maintain (changes are localized)

---

## Identified Issues and Recommendations

### Critical Issues
**NONE** - No breaking compliance issues found.

### Minor Recommendations

#### 1. Consider Supporting Additional Link Relations
**Impact:** Low
**Priority:** Optional

While RFC 8631 service relations are fully supported, consider documenting support for other common relations:
- `item` (RFC 6573) - for catalogs of catalogs
- `alternate` (RFC 5988) - for alternative representations
- `deprecation` (RFC draft) - for deprecated APIs

**Current Status:** These can already be used via the flexible `rel` field, but adding helper functions would improve discoverability.

#### 2. Enhanced GraphQL Support
**Impact:** Low
**Priority:** Optional

The current GraphQL helper uses `application/graphql`, which is correct. Consider adding an option for GraphQL over HTTP with the newer `application/graphql-response+json` type.

**Current Code:**
```typescript
export function graphqlSchemaSpec(path: string): ApiSpecRef {
  return {
    rel: 'service-desc',
    kind: 'graphql',
    href: path,
    type: 'application/graphql',  // SDL schema
    title: 'GraphQL schema',
  };
}
```

**Potential Enhancement:**
```typescript
export function graphqlSchemaSpec(path: string, format: 'sdl' | 'introspection' = 'sdl'): ApiSpecRef {
  return {
    rel: 'service-desc',
    kind: 'graphql',
    href: path,
    type: format === 'sdl' ? 'application/graphql' : 'application/json',
    profile: format === 'introspection' ? 'https://spec.graphql.org/introspection' : undefined,
    title: format === 'sdl' ? 'GraphQL schema' : 'GraphQL introspection result',
  };
}
```

#### 3. AsyncAPI Support
**Impact:** Low
**Priority:** Optional

Add a helper function for AsyncAPI specifications (similar to `openApiSpec`):

```typescript
export function asyncApiSpec(path: string, version: '2.0' | '3.0' = '3.0'): ApiSpecRef {
  return {
    rel: 'service-desc',
    kind: 'asyncapi',
    href: path,
    type: 'application/vnd.aai.asyncapi+json',
    profile: `https://www.asyncapi.com/definitions/${version}`,
    title: `AsyncAPI ${version} spec`,
  };
}
```

#### 4. CORS Headers Documentation
**Impact:** Low
**Priority:** Documentation

RFC 9727 mentions CORS policies for catalog access. Consider adding documentation about CORS configuration for the handlers, especially for public catalogs.

**Example Addition to README:**
```typescript
// Express with CORS
import cors from 'cors';
app.use('/.well-known/api-catalog', cors());
app.get('/.well-known/api-catalog', createExpressApiCatalogHandler(config));

// Fastify with CORS
await fastify.register(import('@fastify/cors'), {
  origin: '*',  // or specific origins
});
```

---

## Testing Recommendations

### Current Test Coverage
Based on review of `tests/` directory:
- ✅ Builder logic (anchor construction, metadata, relation types)
- ✅ Origin resolution (proxy trust, Forwarded headers)
- ✅ Express handler (GET/HEAD requests, headers)
- ✅ Fastify plugin (route registration, responses)
- ✅ Public API exports (CJS/ESM compatibility)

### Additional Test Scenarios to Consider

1. **RFC 9264 Edge Cases**
   - Empty linkset array (valid but uncommon)
   - Multiple profiles in linkset-metadata
   - Unicode characters in titles/hrefs

2. **RFC 7239 Security**
   - Spoofed Forwarded headers when trustProxy=false
   - Multiple Forwarded headers in single request
   - Mixed Forwarded and X-Forwarded-* headers

3. **Integration Tests**
   - Full HTTP server tests (not just handler unit tests)
   - Content negotiation (future format support)
   - Large catalogs (performance testing)

---

## Compliance Verification Commands

To verify RFC compliance in CI/CD:

```bash
# Run all tests
pnpm test

# Type checking
pnpm run lint

# Build verification
pnpm build

# Check exports (CJS/ESM compatibility)
node -e "const pkg = require('./packages/api-catalog'); console.log(Object.keys(pkg));"
node -e "import('./packages/api-catalog/dist/index.mjs').then(pkg => console.log(Object.keys(pkg)));"
```

---

## Conclusion

The `@airnub/wellknown-api-catalog` package is **FULLY COMPLIANT** with all four target RFCs:

- **RFC 9727:** Correctly implements `/.well-known/api-catalog` with proper profile and link relations
- **RFC 9264:** Emits valid Linkset JSON with correct structure and Content-Type
- **RFC 8631:** Supports all service link relations with sensible defaults
- **RFC 7239:** Safely handles Forwarded headers with security-first design

The implementation demonstrates:
- ✅ Strong understanding of web standards
- ✅ Security-conscious defaults
- ✅ Excellent developer experience
- ✅ Framework-agnostic core design
- ✅ Comprehensive test coverage
- ✅ Clear, maintainable code architecture

**Recommendation:** Ready for production use. The minor enhancement suggestions are purely optional and do not affect RFC compliance.

---

## Appendix A: RFC Reference Matrix

| RFC | Title | Status | Key Sections Verified |
|-----|-------|--------|----------------------|
| RFC 9727 | The "api-catalog" Well-Known URI | ✅ PASS | §2 (well-known URI), §3 (link relation), §4 (format) |
| RFC 9264 | Linkset: Media Types and a Link Relation Type for Link Sets | ✅ PASS | §2 (linkset JSON), §3 (media types) |
| RFC 8631 | Link Relation Types for Web Services | ✅ PASS | §2 (service-desc), §3 (service-doc), §4 (service-meta), §5 (status) |
| RFC 7239 | Forwarded HTTP Extension | ✅ PASS | §4 (header syntax), §5 (parameters), §6 (security) |

## Appendix B: File Compliance Map

| File | Primary RFCs | Compliance |
|------|-------------|------------|
| `src/constants.ts` | RFC 9727, RFC 9264 | ✅ PASS |
| `src/types.ts` | RFC 8631, RFC 9264 | ✅ PASS |
| `src/linkset.ts` | RFC 9264 | ✅ PASS |
| `src/builder.ts` | RFC 9264, RFC 9727 | ✅ PASS |
| `src/origin.ts` | RFC 7239 | ✅ PASS |
| `src/helpers.ts` | RFC 8631 | ✅ PASS |
| `src/handlers/express.ts` | RFC 9727, RFC 9264 | ✅ PASS |
| `src/handlers/fastify.ts` | RFC 9727, RFC 9264 | ✅ PASS |

---

**Document Version:** 1.0
**Last Updated:** 2025-11-17
