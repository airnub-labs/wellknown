# RFC 9727 & RFC 9264 Compliance Analysis

**Date:** 2025-11-17
**Package:** `@airnub/wellknown-api-catalog` v0.1.0-next.0
**Analyzed by:** Claude (Sonnet 4.5)

---

## Executive Summary

**Compliance Status: ✅ 100% COMPLIANT**

The `@airnub/wellknown-api-catalog` implementation is **fully compliant** with RFC 9727 (API Catalog) and RFC 9264 (Linkset) specifications. Additionally, the implementation **already supports extensibility** through the linkset-metadata object's `[key: string]: unknown` index signature, which aligns with RFC 9264's allowance for custom properties.

---

## RFC 9727 Compliance Matrix

### Required Elements (SHALL/MUST)

| Requirement | Status | Implementation Location | Notes |
|------------|--------|------------------------|-------|
| **Resolve HTTPS GET to `/.well-known/api-catalog`** | ✅ | `handlers/express.ts:7-23`<br>`handlers/fastify.ts:27-41` | Both frameworks implement GET handlers |
| **Resolve HTTPS HEAD to `/.well-known/api-catalog`** | ✅ | `handlers/express.ts:26-37`<br>`handlers/fastify.ts:43-51` | Both frameworks implement HEAD handlers with Link header |
| **Publish in `application/linkset+json` format** | ✅ | `constants.ts:3`<br>`handlers/express.ts:20`<br>`handlers/fastify.ts:38` | Content-Type header correctly set |
| **Include RFC 9727 profile parameter** | ✅ | `constants.ts:1-3`<br>`builder.ts:50` | Profile URI: `https://www.rfc-editor.org/info/rfc9727` |
| **Include hyperlinks to API endpoints** | ✅ | `builder.ts:26-46` | Each API generates anchor + link relations |

### Recommended Elements (SHOULD)

| Requirement | Status | Implementation Location | Notes |
|------------|--------|------------------------|-------|
| **Include useful metadata** | ✅ | `types.ts:11-13`<br>`linkset.ts:14-18` | Supports `title`, `description`, `publisher`, custom metadata |
| **Provide OpenAPI/spec definitions** | ✅ | `helpers.ts:1-20` | Helper functions for OpenAPI, GraphQL |
| **Support TLS/HTTPS** | ✅ | N/A (application-level) | Framework handlers work over HTTPS when deployed |
| **Apply rate-limiting** | ⚠️ | Not implemented | **Recommendation:** Document that users should add rate-limiting middleware |

### Optional Elements (MAY)

| Requirement | Status | Implementation Location | Notes |
|------------|--------|------------------------|-------|
| **Support content negotiation** | ⚠️ | Not implemented | Only returns `application/linkset+json` |
| **Nest catalogs with `api-catalog` relation** | ✅ | `linkset.ts:10`<br>`builder.ts:39-44` | Supports any relation type including `api-catalog` |
| **Use RFC 8631 link relations** | ✅ | `types.ts:12`<br>`linkset.ts:5-8` | `service-desc`, `service-doc`, `service-meta`, `status` supported |

---

## RFC 9264 Linkset Compliance Matrix

### Required Structure Elements

| Requirement | Status | Implementation Location | Notes |
|------------|--------|------------------------|-------|
| **`linkset` as sole top-level member** | ✅ | `linkset.ts:20-23`<br>`builder.ts:70` | Correctly structured |
| **Link context objects wrapped in array** | ✅ | `linkset.ts:3-12`<br>`builder.ts:66-68` | `linkset: LinksetContext[]` |
| **`href` member required in link targets** | ✅ | `types.ts:1-7` | `LinkObject` interface enforces `href: string` |
| **Link target objects wrapped in arrays** | ✅ | `builder.ts:41-43` | Each relation bucket is `LinkObject[]` |

### Optional/Extension Support

| Feature | Status | Implementation Location | Notes |
|---------|--------|------------------------|-------|
| **`linkset-metadata` array** | ✅ | `linkset.ts:22`<br>`builder.ts:49-55` | Optional but implemented |
| **Extension target attributes** | ✅ | `types.ts:3-6` | `hreflang`, `title`, `type`, `profile` supported |
| **Custom metadata properties** | ✅ | `linkset.ts:17` | `[key: string]: unknown` index signature |
| **Custom link relations** | ✅ | `linkset.ts:11` | `[rel: string]: LinkObject[] \| string \| undefined` |

---

## Extension Mechanisms Analysis

### 1. Publisher Metadata (Optional but Supported)

**Current Implementation:**
```typescript
export interface LinksetMetadata {
  profile?: string | string[];
  publisher?: string;
  [key: string]: unknown;  // ✅ Extension point
}
```

**Status:** The `publisher` field is **optional** per the implementation, which aligns with RFC 9727 recommendations. The spec states:

> "It is RECOMMENDED that the API catalog also includes useful metadata, such as usage policies, API version information..."

The `publisher` is NOT a hard requirement—it's a best practice.

### 2. Custom Metadata Extensions

**RFC 9264 Guidance:**
- Extension attributes are **allowed but not recommended** except for standard target attributes
- Extensions "MUST NOT change the semantics of the JSON members"
- Consumers "can safely ignore such extensions"

**Current Implementation Support:**
```typescript
// linkset.ts:17
[key: string]: unknown;
```

This index signature **already enables** custom metadata properties that would benefit AI agents, such as:

```typescript
const metadata: LinksetMetadata = {
  profile: 'https://www.rfc-editor.org/info/rfc9727',
  publisher: 'example-corp',

  // ✅ Custom extensions for AI agents (currently supported!)
  'x-ai-agent-hints': {
    preferredAuthMethod: 'oauth2',
    rateLimitTier: 'standard',
    estimatedLatencyMs: 200
  },
  'x-semantic-tags': ['financial', 'realtime', 'public-api'],
  'x-llm-context': 'This API provides financial market data with microsecond precision'
}
```

### 3. Custom Link Relations

**Current Implementation:**
```typescript
// linkset.ts:11
[rel: string]: LinkObject[] | string | undefined;
```

This allows **any** link relation type beyond the standard RFC 8631 relations, enabling:

```typescript
const apiEntry: LinksetContext = {
  anchor: 'https://api.example.com/v1',
  'service-desc': [...],
  'service-doc': [...],

  // ✅ Custom relations (currently supported!)
  'x-ai-playground': [{ href: '/playground', type: 'text/html' }],
  'x-code-samples': [{ href: '/examples', type: 'application/json' }],
  'x-migration-guide': [{ href: '/migrate-v2', type: 'text/markdown' }]
}
```

---

## Recommendations for AI Agent Extensions

### Focus: Token-Efficient Metadata

AI agents should be able to **filter APIs without reading full OpenAPI specs**. The most valuable metadata:

1. **`x-auth`** - Authentication requirements (method, location, header name)
2. **`x-description`** - Human-readable API purpose (1-2 sentences)
3. **`x-stability`** - Lifecycle status (experimental, beta, stable, deprecated)
4. **`x-environment`** - Environment type (production, staging, development, sandbox, test)

**Example Extension:**

```typescript
const extendedMetadata: LinksetMetadata = {
  profile: 'https://www.rfc-editor.org/info/rfc9727',
  publisher: 'acme-corp',
  'x-auth': {
    method: 'bearer',
    location: 'header',
    headerName: 'Authorization',
    docsUrl: 'https://docs.example.com/auth'
  },
  'x-description': 'Payment processing API for credit cards and ACH. Supports refunds, recurring billing, and fraud detection.',
  'x-stability': 'stable',
  'x-environment': 'production'
};
```

**Benefits:**
- ✅ Agent knows auth method before fetching spec
- ✅ Agent understands purpose without reading spec
- ✅ Agent knows environment to prevent accidental production calls
- ✅ Agent avoids deprecated APIs
- ✅ Saves tokens by avoiding unnecessary spec downloads

### 2. **Extension Naming Convention**

Use the `x-` prefix for all custom extensions to indicate vendor-specific metadata:
- ✅ `x-auth` - Authentication metadata
- ✅ `x-description` - Human-readable description
- ✅ `x-stability` - Lifecycle status
- ✅ `x-environment` - Environment type

This follows standard HTTP header convention and makes it clear these are extensions.

### 3. **Implementation Approach**

Users can extend catalogs after building them:

```typescript
// Build base catalog
const baseLinkset = buildApiCatalogLinksetForOrigin(config, origin);

// Extend with AI metadata
const extendedLinkset = {
  ...baseLinkset,
  'linkset-metadata': [{
    ...baseLinkset['linkset-metadata']![0],
    'x-auth': { method: 'bearer', location: 'header', headerName: 'Authorization' },
    'x-description': 'Payment processing API...',
    'x-stability': 'stable',
    'x-environment': 'production'
  }]
};
```

See `docs/AI_AGENT_EXTENSIONS.md` for complete examples and helper function patterns.

---

## Security Considerations

### Current Implementation ✅

| Security Aspect | Status | Implementation |
|----------------|--------|----------------|
| **Proxy trust defaults to `false`** | ✅ | `origin.ts:42` - Safe default prevents header spoofing |
| **Try-catch around proxy parsing** | ✅ | `origin.ts:24-28` - Prevents crashes from malformed headers |
| **IP/CIDR validation** | ✅ | Uses `proxy-addr` library for safe parsing |
| **Origin normalization** | ✅ | `origin.ts:19-21` - Strips trailing slashes, prevents injection |

### Recommendations

1. **Document Rate Limiting:** Add guidance to README about using Express/Fastify rate-limiting middleware
2. **Document CORS:** Provide examples of CORS configuration for public catalogs
3. **Document Authentication:** Show how to add auth middleware before catalog handler (if needed)

---

## Missing Features (Non-Compliance Related)

These are **optional** features that could enhance the library but are not required for RFC compliance:

1. **Content Negotiation:** Support `Accept: text/html` for human-readable catalog view
2. **Caching Headers:** Add `Cache-Control` / `ETag` support for efficient catalog polling
3. **Link Header on GET:** RFC 9727 requires Link header on HEAD; adding it to GET responses would be consistent
4. **Rate Limiting:** Built-in rate limiter (though this is typically application-level)

---

## Conclusion

### Compliance Summary

- ✅ **RFC 9727:** 100% compliant with all MUST/SHALL requirements
- ✅ **RFC 9264:** 100% compliant with Linkset JSON structure
- ✅ **Extensibility:** Already supports custom metadata via index signatures
- ⚠️ **Best Practices:** Consider documenting rate-limiting and adding Link header to GET responses

### Extension Support Summary

**Yes, extensions are allowed and already supported!** The implementation includes:

1. ✅ `LinksetMetadata` with `[key: string]: unknown` for custom metadata
2. ✅ `LinksetContext` with `[rel: string]: LinkObject[]` for custom relations
3. ✅ Type-safe while maintaining flexibility for future extensions

### Recommendations Priority

**High Priority:**
1. ✅ Document extension conventions (`docs/AI_AGENT_EXTENSIONS.md` - COMPLETED)
2. Promote AI metadata extensions in main README
3. Add example showing token savings from using metadata

**Medium Priority:**
4. Add Link header to GET responses (consistency with HEAD)
5. Document rate-limiting best practices in main README
6. Consider adding caching headers (Cache-Control, ETag) for catalog polling

**Low Priority:**
7. Consider content negotiation for HTML catalog view
8. Optional `metadata` field in `ApiCatalogConfig` for simpler extension

---

## Code Quality Assessment

**Strengths:**
- Clean, type-safe implementation
- Comprehensive test coverage
- Framework-agnostic core logic
- Secure defaults (trustProxy: false)
- RFC-compliant structure

**Areas for Enhancement:**
- Document extension mechanisms
- Provide more examples of advanced usage
- Consider adding validation helpers for custom metadata

**Overall Grade: A+**

The implementation is production-ready, spec-compliant, and already extensible for future AI agent use cases.
