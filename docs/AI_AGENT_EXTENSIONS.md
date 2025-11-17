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

### Extension Namespace Convention

We recommend the following namespace prefixes:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `x-ai-` | AI agent hints and metadata | `x-ai-agent-hints` |
| `x-semantic-` | Semantic categorization | `x-semantic-tags` |
| `x-llm-` | LLM-specific context | `x-llm-context` |
| `x-stability-` | API lifecycle information | `x-stability-level` |
| `x-performance-` | Performance characteristics | `x-performance-sla` |

### Suggested Metadata Schema

```typescript
interface AIAgentMetadataExtensions {
  // Authentication and authorization hints
  'x-ai-agent-hints'?: {
    authMethod?: 'none' | 'api-key' | 'oauth2' | 'jwt' | 'custom';
    authLocation?: 'header' | 'query' | 'cookie';
    authDocUrl?: string;
    requiresApproval?: boolean;
  };

  // Rate limiting information
  'x-rate-limit'?: {
    tier?: string;
    requestsPerHour?: number;
    requestsPerMinute?: number;
    burstLimit?: number;
  };

  // Semantic categorization
  'x-semantic-tags'?: string[];

  // LLM context description
  'x-llm-context'?: string;

  // API stability and lifecycle
  'x-stability-level'?: 'experimental' | 'beta' | 'stable' | 'deprecated';
  'x-sunset-date'?: string;  // ISO 8601 date

  // Performance characteristics
  'x-performance-sla'?: {
    avgLatencyMs?: number;
    p99LatencyMs?: number;
    availabilityPercent?: number;
  };

  // Cost information
  'x-cost-info'?: {
    pricingModel?: 'free' | 'freemium' | 'paid' | 'usage-based';
    pricingUrl?: string;
  };

  // Compliance and security
  'x-compliance'?: string[];  // e.g., ['GDPR', 'SOC2', 'HIPAA']
  'x-data-residency'?: string[];  // e.g., ['US', 'EU', 'APAC']
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

// Extend with AI agent metadata
const extendedLinkset: ApiCatalogLinkset = {
  ...baseLinkset,
  'linkset-metadata': [
    {
      ...baseLinkset['linkset-metadata']![0],
      'x-ai-agent-hints': {
        authMethod: 'oauth2',
        authLocation: 'header',
        authDocUrl: 'https://docs.example.com/auth',
        requiresApproval: true
      },
      'x-rate-limit': {
        tier: 'premium',
        requestsPerHour: 10000,
        requestsPerMinute: 200,
        burstLimit: 500
      },
      'x-semantic-tags': [
        'machine-learning',
        'predictions',
        'real-time',
        'high-compute'
      ],
      'x-llm-context': 'High-performance ML inference API providing real-time predictions for image classification, NLP, and time-series forecasting. Requires OAuth2 authentication and has usage quotas.',
      'x-stability-level': 'stable',
      'x-performance-sla': {
        avgLatencyMs: 150,
        p99LatencyMs: 450,
        availabilityPercent: 99.9
      },
      'x-cost-info': {
        pricingModel: 'usage-based',
        pricingUrl: 'https://example.com/pricing'
      },
      'x-compliance': ['SOC2', 'GDPR', 'ISO27001'],
      'x-data-residency': ['US', 'EU']
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
  authMethod?: 'none' | 'api-key' | 'oauth2' | 'jwt';
  authDocUrl?: string;
  requiresApproval?: boolean;
  rateLimitTier?: string;
  requestsPerHour?: number;
  semanticTags?: string[];
  llmContext?: string;
  stabilityLevel?: 'experimental' | 'beta' | 'stable' | 'deprecated';
  sunsetDate?: string;
  avgLatencyMs?: number;
  availabilityPercent?: number;
  pricingModel?: 'free' | 'freemium' | 'paid' | 'usage-based';
  pricingUrl?: string;
  compliance?: string[];
  dataResidency?: string[];
}

export function extendCatalogWithAIMetadata(
  baseLinkset: ApiCatalogLinkset,
  aiOptions: AIMetadataOptions
): ApiCatalogLinkset {
  const baseMetadata = baseLinkset['linkset-metadata']?.[0] || {};

  const extendedMetadata: LinksetMetadata = {
    ...baseMetadata
  };

  // Add AI agent hints
  if (aiOptions.authMethod || aiOptions.authDocUrl || aiOptions.requiresApproval) {
    extendedMetadata['x-ai-agent-hints'] = {
      authMethod: aiOptions.authMethod,
      authDocUrl: aiOptions.authDocUrl,
      requiresApproval: aiOptions.requiresApproval
    };
  }

  // Add rate limit info
  if (aiOptions.rateLimitTier || aiOptions.requestsPerHour) {
    extendedMetadata['x-rate-limit'] = {
      tier: aiOptions.rateLimitTier,
      requestsPerHour: aiOptions.requestsPerHour
    };
  }

  // Add semantic tags
  if (aiOptions.semanticTags && aiOptions.semanticTags.length > 0) {
    extendedMetadata['x-semantic-tags'] = aiOptions.semanticTags;
  }

  // Add LLM context
  if (aiOptions.llmContext) {
    extendedMetadata['x-llm-context'] = aiOptions.llmContext;
  }

  // Add stability level
  if (aiOptions.stabilityLevel) {
    extendedMetadata['x-stability-level'] = aiOptions.stabilityLevel;
  }

  // Add sunset date
  if (aiOptions.sunsetDate) {
    extendedMetadata['x-sunset-date'] = aiOptions.sunsetDate;
  }

  // Add performance SLA
  if (aiOptions.avgLatencyMs || aiOptions.availabilityPercent) {
    extendedMetadata['x-performance-sla'] = {
      avgLatencyMs: aiOptions.avgLatencyMs,
      availabilityPercent: aiOptions.availabilityPercent
    };
  }

  // Add cost info
  if (aiOptions.pricingModel || aiOptions.pricingUrl) {
    extendedMetadata['x-cost-info'] = {
      pricingModel: aiOptions.pricingModel,
      pricingUrl: aiOptions.pricingUrl
    };
  }

  // Add compliance
  if (aiOptions.compliance && aiOptions.compliance.length > 0) {
    extendedMetadata['x-compliance'] = aiOptions.compliance;
  }

  // Add data residency
  if (aiOptions.dataResidency && aiOptions.dataResidency.length > 0) {
    extendedMetadata['x-data-residency'] = aiOptions.dataResidency;
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
    authMethod: 'oauth2',
    authDocUrl: 'https://docs.example.com/auth',
    requiresApproval: true,
    rateLimitTier: 'premium',
    requestsPerHour: 10000,
    semanticTags: ['payments', 'financial', 'pci-compliant'],
    llmContext: 'Secure payment processing API with PCI DSS Level 1 certification',
    stabilityLevel: 'stable',
    avgLatencyMs: 200,
    availabilityPercent: 99.99,
    pricingModel: 'usage-based',
    pricingUrl: 'https://example.com/pricing',
    compliance: ['PCI-DSS', 'SOC2', 'GDPR'],
    dataResidency: ['US', 'EU']
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

### Discovery Flow

```typescript
// 1. Agent fetches the catalog
const catalogResponse = await fetch('https://api.example.com/.well-known/api-catalog');
const catalog = await catalogResponse.json();

// 2. Agent reads AI-specific metadata
const metadata = catalog['linkset-metadata']?.[0];
const aiHints = metadata?.['x-ai-agent-hints'];
const semanticTags = metadata?.['x-semantic-tags'];
const llmContext = metadata?.['x-llm-context'];
const stability = metadata?.['x-stability-level'];

// 3. Agent decides whether to use this API
if (stability === 'deprecated') {
  console.warn('API is deprecated, considering alternatives');
}

if (aiHints?.requiresApproval) {
  console.log('API requires manual approval before use');
}

// 4. Agent uses semantic tags for relevance matching
const isRelevant = semanticTags?.some(tag =>
  ['payments', 'financial'].includes(tag)
);

// 5. Agent reads LLM context for understanding
console.log('API Purpose:', llmContext);

// 6. Agent fetches OpenAPI spec from service-desc link
const apiEntry = catalog.linkset[0];
const openApiLink = apiEntry['service-desc']?.[0];
if (openApiLink?.href) {
  const specResponse = await fetch(new URL(openApiLink.href, 'https://api.example.com'));
  const openApiSpec = await specResponse.json();
  // Agent now has full API schema
}
```

---

## Best Practices

### 1. Keep Extensions Minimal
Only add extensions that provide **actionable value** for AI agents. Avoid duplicating information already in OpenAPI specs.

### 2. Use Semantic Tags Thoughtfully
Tags should help agents **categorize and filter** APIs:
- ✅ Good: `['payments', 'real-time', 'high-security']`
- ❌ Bad: `['api', 'rest', 'json']` (too generic)

### 3. Write Clear LLM Context
The `x-llm-context` should be a **concise, informative description** that helps LLMs understand the API's purpose:
- ✅ Good: "Real-time payment processing with fraud detection and PCI compliance"
- ❌ Bad: "This is our API" (not informative)

### 4. Document Your Extensions
If you add custom extensions beyond these recommendations, document them in your API documentation.

### 5. Version Your Extensions
If you make breaking changes to your extension schema, consider versioning:
```typescript
'x-ai-agent-hints-v2': { ... }
```

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
      "anchor": "https://api.example.com/api/ml",
      "service-desc": [
        {
          "href": "/api/ml/openapi.json",
          "type": "application/vnd.oai.openapi+json",
          "profile": "https://spec.openapis.org/oas/3.1",
          "title": "OpenAPI 3.1 spec"
        }
      ],
      "service-doc": [
        {
          "href": "https://docs.example.com/ml",
          "type": "text/html"
        }
      ],
      "x-ai-playground": [
        {
          "href": "https://playground.example.com/ml",
          "type": "text/html",
          "title": "Interactive ML Playground"
        }
      ]
    }
  ],
  "linkset-metadata": [
    {
      "profile": "https://www.rfc-editor.org/info/rfc9727",
      "publisher": "acme-corp",
      "x-ai-agent-hints": {
        "authMethod": "oauth2",
        "authLocation": "header",
        "authDocUrl": "https://docs.example.com/auth",
        "requiresApproval": true
      },
      "x-rate-limit": {
        "tier": "premium",
        "requestsPerHour": 10000,
        "requestsPerMinute": 200
      },
      "x-semantic-tags": [
        "machine-learning",
        "predictions",
        "real-time"
      ],
      "x-llm-context": "High-performance ML inference API providing real-time predictions for image classification and NLP tasks",
      "x-stability-level": "stable",
      "x-performance-sla": {
        "avgLatencyMs": 150,
        "p99LatencyMs": 450,
        "availabilityPercent": 99.9
      },
      "x-cost-info": {
        "pricingModel": "usage-based",
        "pricingUrl": "https://example.com/pricing"
      },
      "x-compliance": ["SOC2", "GDPR"],
      "x-data-residency": ["US", "EU"]
    }
  ]
}
```

---

## Summary

✅ **Extensions are fully supported** through existing TypeScript index signatures
✅ **RFC 9264 allows** custom properties as long as they don't break standard semantics
✅ **Use the `x-` prefix** to indicate vendor extensions
✅ **Focus on actionable metadata** that helps AI agents make decisions
✅ **Document your extensions** and share patterns with the community

The `@airnub/wellknown-api-catalog` package is **ready for AI agent metadata** without any code changes—you can start adding custom metadata today!
