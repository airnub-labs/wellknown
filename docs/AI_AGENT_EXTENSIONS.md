# AI Agent Extension Guidelines

## Overview

The `@airnub/wellknown-api-catalog` package **already supports** custom metadata extensions through TypeScript index signatures. This document provides guidelines and examples for extending the API catalog with AI agent-specific metadata.

## RFC 9264 Extension Policy

Per RFC 9264, custom properties in linkset-metadata:
- ✅ **ARE ALLOWED** but not recommended except for extension target attributes
- ✅ **MUST NOT** change the semantics of standard JSON members
- ✅ **MUST BE** safely ignorable by consumers who don't understand them

**Best Practice:** Prefix custom properties with `x-` to indicate vendor extensions.

---

## Current Extension Support

### 1. Custom Metadata Properties

The `LinksetMetadata` interface includes an index signature:

```typescript
export interface LinksetMetadata {
  profile?: string | string[];
  publisher?: string;
  [key: string]: unknown;  // ✅ Allows any custom property
}
```

### 2. Custom Link Relations

The `LinksetContext` interface supports any link relation:

```typescript
export interface LinksetContext {
  anchor: string;
  'service-desc'?: LinkObject[];
  'service-doc'?: LinkObject[];
  'service-meta'?: LinkObject[];
  status?: LinkObject[];
  [rel: string]: LinkObject[] | string | undefined;  // ✅ Allows custom relations
}
```

---

## Recommended AI Agent Extensions

### Focus: High-Value Metadata to Avoid Reading Full Specs

These extensions provide **essential information** that agents need before fetching and parsing entire OpenAPI documents, saving tokens and reducing latency.

### Core Extension Schema

```typescript
interface AIAgentMetadataExtensions {
  // Authentication requirements (saves parsing security schemes from spec)
  'x-auth'?: {
    method: 'none' | 'api-key' | 'oauth2' | 'bearer' | 'basic' | 'custom';
    location?: 'header' | 'query' | 'cookie';  // Where to send credentials
    headerName?: string;  // e.g., 'X-API-Key', 'Authorization'
    docsUrl?: string;  // Link to auth setup instructions
    scopes?: string[];  // Required OAuth scopes
  };

  // Human-readable description for LLM understanding
  'x-description': string;  // What this API does, in plain language

  // API stability and lifecycle (should agents use this?)
  'x-stability': 'experimental' | 'beta' | 'stable' | 'deprecated';

  // Rate limiting (prevent quota exhaustion)
  'x-rate-limit'?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  };
}
```

---

## Usage Examples

### Example 1: Basic AI Agent Metadata

```typescript
import type { ApiCatalogConfig } from '@airnub/wellknown-api-catalog';
import { openApiSpec } from '@airnub/wellknown-api-catalog';

const config: ApiCatalogConfig = {
  publisher: 'acme-corp',
  apis: [
    {
      id: 'payments-api',
      title: 'Payment Processing API',
      basePath: '/api/payments',
      specs: [openApiSpec('/api/payments/openapi.json', '3.1')]
    }
  ]
};

// To add custom metadata, you'll need to modify the built linkset
// (See Example 3 for a helper function approach)
```

### Example 2: Extended Linkset with AI Metadata

```typescript
import { buildApiCatalogLinksetForOrigin } from '@airnub/wellknown-api-catalog';
import type { ApiCatalogLinkset } from '@airnub/wellknown-api-catalog';

const config: ApiCatalogConfig = {
  publisher: 'acme-corp',
  apis: [
    {
      id: 'ml-predictions',
      title: 'Machine Learning Predictions API',
      basePath: '/api/ml',
      specs: [openApiSpec('/api/ml/openapi.json', '3.1')]
    }
  ]
};

// Build base linkset
const origin = 'https://api.example.com';
const baseLinkset = buildApiCatalogLinksetForOrigin(config, origin);

// Extend with essential AI agent metadata
const extendedLinkset: ApiCatalogLinkset = {
  ...baseLinkset,
  'linkset-metadata': [
    {
      ...baseLinkset['linkset-metadata']![0],
      'x-auth': {
        method: 'bearer',
        location: 'header',
        headerName: 'Authorization',
        docsUrl: 'https://docs.example.com/auth'
      },
      'x-description': 'Real-time ML inference API for image classification, NLP sentiment analysis, and time-series forecasting. Requires authentication and has rate limits.',
      'x-stability': 'stable',
      'x-rate-limit': {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      }
    }
  ]
};

// Return the extended linkset in your handler
```

### Example 3: Helper Function for AI Metadata

Create a reusable helper in your codebase:

```typescript
// lib/ai-catalog-helpers.ts
import type { ApiCatalogLinkset, LinksetMetadata } from '@airnub/wellknown-api-catalog';

interface AIMetadataOptions {
  // Auth info (required for most APIs)
  auth?: {
    method: 'none' | 'api-key' | 'oauth2' | 'bearer' | 'basic' | 'custom';
    location?: 'header' | 'query' | 'cookie';
    headerName?: string;
    docsUrl?: string;
    scopes?: string[];
  };

  // Human-readable description (helps LLMs understand purpose)
  description: string;

  // API stability
  stability: 'experimental' | 'beta' | 'stable' | 'deprecated';

  // Rate limits (prevents quota exhaustion)
  rateLimit?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  };
}

export function extendCatalogWithAIMetadata(
  baseLinkset: ApiCatalogLinkset,
  aiOptions: AIMetadataOptions
): ApiCatalogLinkset {
  const baseMetadata = baseLinkset['linkset-metadata']?.[0] || {};

  const extendedMetadata: LinksetMetadata = {
    ...baseMetadata,
    'x-description': aiOptions.description,
    'x-stability': aiOptions.stability
  };

  if (aiOptions.auth) {
    extendedMetadata['x-auth'] = aiOptions.auth;
  }

  if (aiOptions.rateLimit) {
    extendedMetadata['x-rate-limit'] = aiOptions.rateLimit;
  }

  return {
    ...baseLinkset,
    'linkset-metadata': [extendedMetadata]
  };
}
```

**Usage:**

```typescript
// app/.well-known/api-catalog/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildApiCatalogLinksetForOrigin, openApiSpec } from '@airnub/wellknown-api-catalog';
import { extendCatalogWithAIMetadata } from '@/lib/ai-catalog-helpers';

const config = {
  publisher: 'acme-corp',
  apis: [
    {
      id: 'payments-api',
      basePath: '/api/payments',
      specs: [openApiSpec('/api/payments/openapi.json')]
    }
  ]
};

export function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const baseLinkset = buildApiCatalogLinksetForOrigin(config, origin);

  const extendedLinkset = extendCatalogWithAIMetadata(baseLinkset, {
    auth: {
      method: 'bearer',
      location: 'header',
      headerName: 'Authorization',
      docsUrl: 'https://docs.example.com/auth'
    },
    description: 'Secure payment processing API for credit cards, ACH, and digital wallets. Supports refunds, recurring billing, and fraud detection.',
    stability: 'stable',
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 5000
    }
  });

  return NextResponse.json(extendedLinkset, {
    headers: {
      'Content-Type': 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"'
    }
  });
}
```

### Example 4: Per-API Custom Metadata

For per-API metadata (rather than catalog-level), use custom link relations:

```typescript
const config: ApiCatalogConfig = {
  publisher: 'acme-corp',
  apis: [
    {
      id: 'experimental-ai-api',
      basePath: '/api/ai/experimental',
      specs: [
        openApiSpec('/api/ai/experimental/openapi.json'),
        {
          rel: 'service-doc',
          href: 'https://docs.example.com/ai/experimental',
          type: 'text/html'
        },
        // Custom relation for AI agent playground
        {
          rel: 'x-ai-playground',
          href: 'https://playground.example.com/ai',
          type: 'text/html',
          title: 'Interactive API Playground'
        },
        // Custom relation for code samples
        {
          rel: 'x-code-samples',
          href: 'https://github.com/acme-corp/api-samples',
          type: 'application/json',
          title: 'Code Samples Repository'
        },
        // Custom relation for LLM prompt templates
        {
          rel: 'x-llm-prompt-templates',
          href: '/api/ai/experimental/prompt-templates.json',
          type: 'application/json',
          title: 'LLM Prompt Templates'
        }
      ]
    }
  ]
};
```

---

## AI Agent Consumption Pattern

### Discovery Flow (Token-Efficient)

```typescript
// 1. Agent fetches the catalog (small payload, no full spec yet)
const catalogResponse = await fetch('https://api.example.com/.well-known/api-catalog');
const catalog = await catalogResponse.json();

// 2. Agent reads essential metadata WITHOUT fetching the full OpenAPI spec
const metadata = catalog['linkset-metadata']?.[0];
const auth = metadata?.['x-auth'];
const description = metadata?.['x-description'];
const stability = metadata?.['x-stability'];
const rateLimit = metadata?.['x-rate-limit'];

// 3. Agent makes quick decisions based on metadata alone
if (stability === 'deprecated') {
  console.warn('API is deprecated, skipping');
  return;
}

if (auth?.method === 'oauth2' && !hasOAuthSetup()) {
  console.log('Requires OAuth2, user needs to authorize first');
  return;
}

if (rateLimit && rateLimit.requestsPerMinute < requiredThroughput) {
  console.log('Rate limit too low for this use case');
  return;
}

// 4. Agent understands API purpose from description (saves reading spec)
console.log('API does:', description);
// Agent can now decide if this API matches the task

// 5. Only NOW fetch the full OpenAPI spec (if needed)
const apiEntry = catalog.linkset[0];
const openApiLink = apiEntry['service-desc']?.[0];
if (openApiLink?.href) {
  const specResponse = await fetch(new URL(openApiLink.href, 'https://api.example.com'));
  const openApiSpec = await specResponse.json();
  // Agent now has full API schema for detailed operations
}
```

**Token Savings:** Agent can filter out incompatible APIs based on auth, stability, and description **before** downloading and parsing potentially large OpenAPI specs.

---

## Best Practices

### 1. Focus on Pre-Spec Decisions
Only include metadata that helps agents **decide whether to fetch the full spec**:
- ✅ Auth requirements (agent needs credentials first)
- ✅ Rate limits (agent needs to know quotas)
- ✅ Stability (agent shouldn't use deprecated APIs)
- ✅ Description (agent needs to understand purpose)
- ❌ Don't duplicate detailed info from OpenAPI spec

### 2. Write Clear, Concise Descriptions
The `x-description` should help LLMs understand the API's **purpose and capabilities** in 1-2 sentences:
- ✅ Good: "Payment processing API for credit cards and ACH. Supports refunds, recurring billing, and fraud detection."
- ❌ Bad: "This is our API" (too vague)
- ❌ Bad: "An API that provides access to our payment processing system which allows users to..." (too verbose)

### 3. Be Explicit About Auth
Always include `x-auth` if authentication is required. Agents need to know:
- What method to use (`bearer`, `api-key`, `oauth2`, etc.)
- Where to send credentials (`header`, `query`, `cookie`)
- What header name to use (e.g., `Authorization`, `X-API-Key`)
- Where to get credentials (`docsUrl`)

### 4. Set Realistic Rate Limits
Help agents avoid hitting quotas by being transparent about limits:
```typescript
'x-rate-limit': {
  requestsPerMinute: 60,   // Most common limit
  requestsPerHour: 1000,   // Secondary limit
  requestsPerDay: 10000    // Hard daily cap
}
```

### 5. Keep Stability Current
Update `x-stability` as your API evolves:
- `experimental` → Agent should expect breaking changes
- `beta` → Agent can use but should monitor for changes
- `stable` → Agent can rely on this API
- `deprecated` → Agent should find alternatives

---

## Future Considerations

### Potential Standardization
As AI agent usage grows, some of these extensions may become candidates for standardization. We recommend:

1. Participate in IETF discussions about AI-specific API metadata
2. Share your extension schemas with the community
3. Contribute to emerging standards in this space

### Backward Compatibility
Since extensions are optional and ignorable:
- ✅ Agents that understand extensions get enhanced functionality
- ✅ Agents that don't understand extensions still work normally
- ✅ No breaking changes when adding new extensions

---

## Example Output

Here's what an AI-enriched catalog looks like:

```json
{
  "linkset": [
    {
      "anchor": "https://api.example.com/api/payments",
      "service-desc": [
        {
          "href": "/api/payments/openapi.json",
          "type": "application/vnd.oai.openapi+json",
          "profile": "https://spec.openapis.org/oas/3.1",
          "title": "OpenAPI 3.1 spec"
        }
      ],
      "service-doc": [
        {
          "href": "https://docs.example.com/payments",
          "type": "text/html"
        }
      ]
    }
  ],
  "linkset-metadata": [
    {
      "profile": "https://www.rfc-editor.org/info/rfc9727",
      "publisher": "acme-corp",
      "x-auth": {
        "method": "bearer",
        "location": "header",
        "headerName": "Authorization",
        "docsUrl": "https://docs.example.com/auth"
      },
      "x-description": "Payment processing API for credit cards, ACH, and digital wallets. Supports refunds, recurring billing, and fraud detection.",
      "x-stability": "stable",
      "x-rate-limit": {
        "requestsPerMinute": 100,
        "requestsPerHour": 5000,
        "requestsPerDay": 50000
      }
    }
  ]
}
```

**This compact metadata tells agents:**
- ✅ How to authenticate (Bearer token in Authorization header)
- ✅ What the API does (payment processing with specific features)
- ✅ API stability (production-ready)
- ✅ Rate limits (avoid quota exhaustion)

**All before downloading the potentially large OpenAPI spec!**

---

## Summary

✅ **Extensions are fully supported** through existing TypeScript index signatures
✅ **RFC 9264 allows** custom properties as long as they don't break standard semantics
✅ **Focus on high-value metadata** that saves agents from reading full specs:
   - **`x-auth`** - Authentication method, location, and header name
   - **`x-description`** - Human-readable API purpose (1-2 sentences)
   - **`x-stability`** - API lifecycle status
   - **`x-rate-limit`** - Request quotas to prevent exhaustion

✅ **Token-efficient** - Agents can filter APIs before downloading large OpenAPI specs
✅ **No code changes needed** - Start adding metadata today using the helper patterns above

The `@airnub/wellknown-api-catalog` package is **ready for AI agent metadata** without any code changes—you can start adding custom metadata today!
