# wellknown CLI Tool Design Document

## Overview

A command-line interface (CLI) tool for discovering and consuming RFC 9727-compliant API catalogs. This tool serves as the **client-side companion** to the `@airnub/wellknown-api-catalog` package, enabling developers and AI coding agents to easily discover, validate, and consume API specifications from any host that publishes a `/.well-known/api-catalog` endpoint.

**Status:** Proposal
**Created:** 2025-11-18
**Target Package:** `@airnub/wellknown-cli`

---

## Problem Statement

### Current State

The `@airnub/wellknown-api-catalog` package makes it easy for services to **publish** RFC 9727-compliant API catalogs. However, there is no standardized, easy-to-use tool for **consuming** these catalogs, particularly for:

1. **Developers** who want to quickly discover what APIs are available on a host
2. **AI coding agents** that need to programmatically fetch API specs to generate clients, validate requests, or understand available endpoints
3. **DevOps/Platform teams** who want to validate RFC compliance across multiple services
4. **Documentation generators** that need to aggregate API specs from multiple sources

### Gaps

Without a dedicated CLI tool, consumers must:

- Manually construct HTTP requests to `/.well-known/api-catalog`
- Parse Linkset JSON by hand or write custom parsing code
- Understand RFC 9727, RFC 9264, and RFC 8631 specifications
- Handle content negotiation, Link headers, and profile parameters correctly
- Write custom validation logic to ensure spec compliance
- Manually follow `service-desc`, `service-doc`, and other link relations

This creates friction and reduces the adoption of the RFC 9727 standard.

### Target Users

1. **Developers** exploring available APIs on a new service
2. **AI coding agents** (Claude Code, GitHub Copilot, Cursor, etc.) that need to discover and fetch API specs
3. **CI/CD pipelines** validating API catalog compliance
4. **API documentation tools** aggregating specs from multiple services
5. **Platform engineers** auditing API surface area across an organization

---

## Proposed Solution

### Core Concept

A lightweight, zero-dependency CLI tool that:

1. **Discovers** API catalogs from any host via `/.well-known/api-catalog`
2. **Parses** RFC 9264 Linkset JSON responses
3. **Validates** RFC 9727 compliance (content type, profile, link relations)
4. **Fetches** linked API specifications (OpenAPI, GraphQL, AsyncAPI, JSON Schema)
5. **Displays** or **saves** specs in various formats
6. **Provides** machine-readable output for AI agents and toolchains

### Key Features

#### 1. Discovery

```bash
# Discover all APIs on a host
wellknown discover api.example.com

# Output:
# ✓ Found 3 APIs at https://api.example.com/.well-known/api-catalog
#
# 1. payments-api (https://api.example.com/api/payments)
#    OpenAPI 3.1: /api/payments/openapi.json
#    Docs: https://docs.example.com/payments
#    Status: https://api.example.com/api/payments/health
#
# 2. users-api (https://api.example.com/api/users)
#    GraphQL Schema: /api/users/schema.graphql
#    Docs: https://docs.example.com/users
```

#### 2. Spec Fetching

```bash
# Fetch a specific API's OpenAPI spec
wellknown fetch api.example.com/api/payments

# Save all specs from a host
wellknown fetch api.example.com --all --output ./specs/

# Fetch with AI metadata
wellknown fetch api.example.com --include-extensions
```

#### 3. Validation

```bash
# Validate RFC 9727 compliance
wellknown validate api.example.com

# Output:
# ✓ Content-Type: application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"
# ✓ Profile in linkset-metadata
# ✓ All anchors are absolute URIs
# ✗ Missing service-desc link for anchor https://api.example.com/api/old-api
```

#### 4. AI Agent Mode

```bash
# JSON output for AI agents
wellknown discover api.example.com --format json

# Compact output with essential metadata only
wellknown discover api.example.com --format json --compact

# Output includes x-auth, x-description, x-stability, x-environment extensions
```

#### 5. Introspection

```bash
# Show raw Linkset JSON
wellknown inspect api.example.com

# Show HTTP headers
wellknown inspect api.example.com --headers

# Follow all service-desc links and show specs
wellknown inspect api.example.com --follow-specs
```

---

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                   wellknown CLI                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Commands:                                           │
│  ┌──────────────────────────────────────────────┐  │
│  │ discover <host>                               │  │
│  │ fetch <host> [--api <id>] [--all]           │  │
│  │ validate <host>                              │  │
│  │ inspect <host>                               │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  Core Modules:                                       │
│  ┌──────────────────────────────────────────────┐  │
│  │ • CatalogFetcher    (HTTP client)            │  │
│  │ • LinksetParser     (RFC 9264 parser)        │  │
│  │ • SpecFetcher       (follows service-desc)   │  │
│  │ • Validator         (RFC 9727 compliance)    │  │
│  │ • Formatter         (output: human/json)     │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
              ↓
    ┌─────────────────┐
    │  HTTP Requests   │
    └─────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│        Host with /.well-known/api-catalog           │
└─────────────────────────────────────────────────────┘
```

### Command Structure

```
wellknown <command> [options]

Commands:
  discover <host>          Discover APIs from /.well-known/api-catalog
  fetch <host>            Fetch API specifications
  validate <host>         Validate RFC 9727 compliance
  inspect <host>          Show raw catalog and headers

Global Options:
  --version              Show version
  --help                 Show help
  --verbose              Enable verbose logging
  --timeout <ms>         Request timeout (default: 10000)
  --insecure             Skip TLS verification (not recommended)

discover options:
  --format <format>      Output format: human | json | yaml (default: human)
  --compact              Show compact output (excludes docs, status links)
  --include-extensions   Include x-* metadata extensions

fetch options:
  --api <id>            Fetch specific API by ID
  --all                 Fetch all APIs
  --output <dir>        Save specs to directory (default: ./specs/)
  --format <format>     Save format: json | yaml (default: as-is)

validate options:
  --strict              Enable strict validation (fails on warnings)
  --format <format>     Output format: human | json (default: human)

inspect options:
  --headers             Show HTTP response headers
  --follow-specs        Fetch and display all linked specs
  --format <format>     Output format: human | json | raw (default: human)
```

### Core Modules

#### 1. CatalogFetcher

```typescript
interface CatalogFetcher {
  fetch(host: string, options?: FetchOptions): Promise<CatalogResponse>;
}

interface CatalogResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  linkset?: ApiCatalogLinkset;
  error?: string;
}

interface FetchOptions {
  timeout?: number;
  insecure?: boolean;
  headers?: Record<string, string>;
}
```

Responsibilities:
- Construct `/.well-known/api-catalog` URL with proper scheme (https by default)
- Handle HTTP redirects (follow up to 5 redirects)
- Parse JSON response
- Handle network errors, timeouts, DNS failures
- Support custom headers (e.g., Authorization for authenticated catalogs)

#### 2. LinksetParser

```typescript
interface LinksetParser {
  parse(linkset: ApiCatalogLinkset): ParsedCatalog;
  validate(linkset: ApiCatalogLinkset): ValidationResult[];
}

interface ParsedCatalog {
  apis: ParsedApi[];
  metadata: CatalogMetadata;
}

interface ParsedApi {
  id?: string;
  title?: string;
  anchor: string;
  specs: SpecLink[];
  docs: DocLink[];
  statusEndpoints: StatusLink[];
  customLinks: CustomLink[];
  extensions?: Record<string, unknown>; // x-* fields
}

interface SpecLink {
  rel: string; // service-desc, service-meta, etc.
  href: string;
  type?: string; // MIME type
  profile?: string; // e.g., https://spec.openapis.org/oas/3.1
  title?: string;
}
```

Responsibilities:
- Parse RFC 9264 Linkset JSON structure
- Extract anchors, link relations, and metadata
- Resolve relative URLs to absolute URLs using anchor as base
- Extract custom extensions (x-auth, x-description, etc.)
- Validate linkset structure

#### 3. SpecFetcher

```typescript
interface SpecFetcher {
  fetch(specLink: SpecLink, options?: FetchOptions): Promise<SpecResponse>;
  fetchAll(api: ParsedApi, options?: FetchOptions): Promise<SpecResponse[]>;
}

interface SpecResponse {
  link: SpecLink;
  status: number;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  error?: string;
}
```

Responsibilities:
- Fetch specifications via service-desc, service-meta links
- Handle various content types (JSON, YAML, GraphQL SDL)
- Save specs to disk with appropriate file extensions
- Aggregate multiple specs for a single API

#### 4. Validator

```typescript
interface Validator {
  validate(response: CatalogResponse): ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  checks: ValidationCheck[];
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}
```

Validation checks:
- ✓ Content-Type is `application/linkset+json`
- ✓ Profile parameter includes `https://www.rfc-editor.org/info/rfc9727`
- ✓ Link header contains `rel="api-catalog"`
- ✓ Response has `linkset` array
- ✓ Response has `linkset-metadata` with RFC 9727 profile
- ✓ All anchors are absolute URIs
- ✓ All hrefs in links are valid URIs (absolute or relative)
- ⚠ service-desc links have appropriate MIME types
- ⚠ OpenAPI specs include profile with version
- ⚠ Custom extensions follow x-* naming convention

#### 5. Formatter

```typescript
interface Formatter {
  formatDiscovery(catalog: ParsedCatalog, format: 'human' | 'json' | 'yaml'): string;
  formatValidation(result: ValidationResult, format: 'human' | 'json'): string;
  formatInspect(response: CatalogResponse, options: InspectOptions): string;
}
```

Responsibilities:
- Human-readable output with colors and formatting
- JSON output for AI agents (structured, no colors)
- YAML output for configuration files
- Compact vs. verbose modes

### Data Flow

```
1. User runs: wellknown discover api.example.com

2. CatalogFetcher
   ├─ Construct URL: https://api.example.com/.well-known/api-catalog
   ├─ Send GET request with Accept: application/linkset+json
   └─ Return CatalogResponse

3. LinksetParser
   ├─ Parse linkset JSON
   ├─ Extract APIs, anchors, links
   ├─ Resolve relative URLs
   └─ Return ParsedCatalog

4. Formatter
   ├─ Format ParsedCatalog
   └─ Output to stdout

For fetch command:
5. SpecFetcher
   ├─ For each API's service-desc link
   ├─ Fetch spec
   ├─ Save to disk or output
   └─ Return SpecResponse[]
```

### Technology Stack

#### Language: TypeScript / Node.js

**Pros:**
- Same ecosystem as `@airnub/wellknown-api-catalog` (consistency)
- Excellent HTTP client libraries (fetch, axios)
- Rich CLI frameworks (commander, yargs, oclif)
- Easy to publish to npm
- AI agents often have Node.js available

**Cons:**
- Requires Node.js runtime
- Slower startup than compiled binaries

**Alternative: Go**

**Pros:**
- Single binary distribution (no runtime needed)
- Fast startup time
- Excellent HTTP client
- Cross-platform compilation

**Cons:**
- Different ecosystem from existing package
- Harder for TypeScript developers to contribute
- Separate toolchain

**Recommendation:** Start with **TypeScript/Node.js** for consistency. If performance becomes an issue or users request standalone binaries, consider Go rewrite or use tools like `pkg` or `deno compile` to create standalone binaries.

#### CLI Framework: Commander.js

Simple, well-maintained, and widely used.

```typescript
import { Command } from 'commander';

const program = new Command();

program
  .name('wellknown')
  .description('RFC 9727 API catalog discovery tool')
  .version('0.1.0');

program
  .command('discover <host>')
  .description('Discover APIs from /.well-known/api-catalog')
  .option('--format <format>', 'Output format', 'human')
  .option('--compact', 'Compact output', false)
  .action(async (host, options) => {
    // Implementation
  });

program.parse();
```

#### HTTP Client: Native fetch (Node 18+)

Since the package already requires Node.js >=18, we can use native `fetch` without dependencies.

#### Output Formatting: chalk (colors) + cli-table3 (tables)

For human-readable output with colors and tables.

---

## Use Cases

### Use Case 1: Developer Discovery

**Actor:** Developer exploring a new API platform

**Scenario:**
```bash
$ wellknown discover api.stripe.com

✓ Found 2 APIs at https://api.stripe.com/.well-known/api-catalog

1. stripe-core-api (https://api.stripe.com/v1)
   OpenAPI 3.1: /v1/openapi.json
   Docs: https://stripe.com/docs/api
   Status: https://status.stripe.com/api/v2/summary.json

2. stripe-connect-api (https://connect.stripe.com/v1)
   OpenAPI 3.1: /v1/openapi.json
   Docs: https://stripe.com/docs/connect

$ wellknown fetch api.stripe.com/v1
✓ Fetched OpenAPI spec: /v1/openapi.json (1.2 MB)
Saved to: ./specs/stripe-core-api-openapi.json
```

**Value:** Developer discovers available APIs and fetches specs in seconds without reading docs.

### Use Case 2: AI Agent Spec Discovery

**Actor:** AI coding agent (Claude Code, GitHub Copilot, Cursor)

**Scenario:**
```bash
# Agent runs programmatically
$ wellknown discover api.internal.company.com --format json --compact

{
  "host": "api.internal.company.com",
  "catalogUrl": "https://api.internal.company.com/.well-known/api-catalog",
  "apis": [
    {
      "id": "auth-api",
      "anchor": "https://api.internal.company.com/api/auth",
      "specs": [
        {
          "rel": "service-desc",
          "href": "https://api.internal.company.com/api/auth/openapi.json",
          "type": "application/vnd.oai.openapi+json",
          "profile": "https://spec.openapis.org/oas/3.1"
        }
      ],
      "extensions": {
        "x-auth": {
          "method": "bearer",
          "location": "header",
          "headerName": "Authorization"
        },
        "x-description": "Authentication and authorization API",
        "x-stability": "stable",
        "x-environment": "production"
      }
    }
  ]
}

# Agent parses JSON, reads x-auth metadata
# Agent fetches OpenAPI spec
$ wellknown fetch api.internal.company.com/api/auth --format json > openapi.json

# Agent now has structured spec to generate client code
```

**Value:** Agent discovers APIs, understands auth requirements, and fetches specs programmatically without human intervention.

### Use Case 3: CI/CD Compliance Validation

**Actor:** DevOps engineer / CI pipeline

**Scenario:**
```bash
# In CI pipeline (e.g., GitHub Actions)
$ wellknown validate api.staging.company.com

✓ Content-Type: application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"
✓ Link header: </.well-known/api-catalog>; rel="api-catalog"
✓ Profile in linkset-metadata
✓ All anchors are absolute URIs
✓ All service-desc links have MIME types
⚠ API "legacy-api" missing service-doc link (documentation URL)

Validation: PASSED (1 warning)

# Strict mode for production
$ wellknown validate api.production.company.com --strict

✗ Validation FAILED
  Error: API "legacy-api" missing service-doc link

exit code: 1
```

**Value:** Automated compliance checks ensure all services follow RFC 9727 standard before deployment.

### Use Case 4: Documentation Aggregation

**Actor:** Documentation platform (e.g., internal API portal)

**Scenario:**
```bash
# Discover all APIs across multiple services
$ wellknown discover api.service1.com --format json > service1.json
$ wellknown discover api.service2.com --format json > service2.json

# Fetch all OpenAPI specs
$ wellknown fetch api.service1.com --all --output ./specs/service1/
$ wellknown fetch api.service2.com --all --output ./specs/service2/

# Aggregate specs into documentation portal
# Portal reads specs and generates unified API docs
```

**Value:** Automated discovery and aggregation of API specs across microservices architecture.

### Use Case 5: API Surface Area Audit

**Actor:** Security engineer / Platform team

**Scenario:**
```bash
# Discover all APIs in production
$ wellknown discover api.production.company.com

✓ Found 12 APIs

# Check for deprecated APIs
$ wellknown discover api.production.company.com --format json | jq '.apis[] | select(.extensions."x-stability" == "deprecated")'

{
  "id": "legacy-payments-api",
  "anchor": "https://api.production.company.com/api/legacy/payments",
  "extensions": {
    "x-stability": "deprecated"
  }
}

# Audit: Flag deprecated API for removal
```

**Value:** Platform teams can audit API surface area and identify deprecated or experimental APIs.

---

## Value Evaluation

### High Value Indicators ✅

1. **Completes the RFC 9727 ecosystem**
   - The `@airnub/wellknown-api-catalog` package enables publishing catalogs
   - The CLI tool enables consuming catalogs
   - Together, they provide a **complete solution** for RFC 9727 adoption

2. **AI agent enablement** (primary value driver)
   - AI coding agents are increasingly common (Claude Code, GitHub Copilot, Cursor, Aider, etc.)
   - Agents need programmatic API discovery to generate clients and validate requests
   - Structured JSON output makes it easy for agents to consume
   - Extensions (x-auth, x-description, etc.) help agents understand APIs without fetching large specs

3. **Developer experience improvement**
   - Discovering APIs on a new service is currently manual (read docs, find OpenAPI URLs)
   - CLI tool automates discovery in seconds
   - Reduces cognitive load and speeds up onboarding

4. **CI/CD integration**
   - Automated compliance validation ensures RFC adherence across services
   - Prevents non-compliant catalogs from reaching production
   - Enables policy enforcement (e.g., all APIs must have docs)

5. **Low implementation cost**
   - Core functionality is straightforward (HTTP client + JSON parser)
   - Existing TypeScript ecosystem and tooling
   - Can leverage `@airnub/wellknown-api-catalog` types

6. **Adoption catalyst**
   - A good CLI tool makes RFC 9727 more attractive to adopt
   - Demonstrates practical value of the standard
   - Lowers barrier to entry for new users

### Medium Value Indicators ⚠

1. **Market maturity**
   - RFC 9727 is new (2024)
   - Adoption is still limited
   - Value grows as more services publish catalogs

2. **Competition**
   - No direct competitors for RFC 9727 specifically
   - General API discovery tools exist (e.g., `curl` + `jq`)
   - CLI tool must provide significant value over manual approaches

3. **Maintenance burden**
   - Requires ongoing maintenance (dependencies, bug fixes)
   - Must stay aligned with RFC updates
   - Documentation and support overhead

### Low Value Indicators ❌

None identified. The tool addresses a clear gap and aligns with industry trends (API standardization, AI agents).

### Overall Assessment: **HIGH VALUE**

**Reasoning:**
1. **AI agent enablement is a strategic priority** - As AI coding agents become ubiquitous, programmatic API discovery becomes critical. This CLI tool directly addresses that need.

2. **Completes the ecosystem** - Without a consumer-side tool, the RFC 9727 standard is only half-implemented. The CLI makes it practical to adopt.

3. **Developer experience** - Developers want fast, easy API discovery. This tool delivers that.

4. **Low cost, high impact** - Implementation is straightforward, but the value to users is significant.

5. **Future-proof** - As RFC 9727 adoption grows, this tool becomes more valuable over time.

**Recommendation:** **Proceed with implementation.** Start with core functionality (discover, fetch, validate) and iterate based on user feedback.

---

## Implementation Plan

### Phase 1: MVP (Core Functionality)

**Goal:** Deliver minimal but functional CLI tool

**Features:**
- `discover` command (human and JSON output)
- `fetch` command (fetch single or all specs)
- `validate` command (basic RFC 9727 compliance checks)
- HTTP client with timeout and redirect handling
- Linkset JSON parser
- Error handling and user-friendly messages

**Timeline:** 2-3 weeks

**Success Criteria:**
- Can discover APIs from any RFC 9727-compliant host
- Can fetch OpenAPI/GraphQL/AsyncAPI specs
- Can validate basic RFC compliance
- Published to npm as `@airnub/wellknown-cli`

### Phase 2: Enhanced Validation and Extensions

**Goal:** Add advanced features and AI agent support

**Features:**
- Strict validation mode
- Extension parsing (x-auth, x-description, etc.)
- `inspect` command (raw catalog and headers)
- YAML output format
- Compact output mode
- Better error messages and suggestions

**Timeline:** 1-2 weeks

**Success Criteria:**
- AI agents can use JSON output programmatically
- Validation catches common misconfigurations
- Extensions are parsed and displayed correctly

### Phase 3: Advanced Features

**Goal:** Add convenience and power-user features

**Features:**
- Configuration file support (`.wellknownrc`)
- Authentication support (API keys, OAuth tokens)
- Multi-host discovery (discover multiple hosts in parallel)
- Caching (avoid re-fetching catalogs)
- Diff mode (compare catalogs over time)
- Watch mode (monitor catalog changes)

**Timeline:** 2-3 weeks

**Success Criteria:**
- Power users can customize behavior via config
- Tool supports authenticated catalogs
- Tool can monitor catalog changes over time

### Phase 4: Ecosystem Integration

**Goal:** Integrate with popular tools and platforms

**Features:**
- GitHub Action for CI/CD validation
- Pre-built binaries (via `pkg` or `deno compile`)
- Integration examples (Postman, Insomnia, Swagger UI)
- Plugin system for custom validators/formatters

**Timeline:** 2-3 weeks

**Success Criteria:**
- Can be used in GitHub Actions without Node.js install
- Binaries available for Linux, macOS, Windows
- Integration examples documented

---

## Technical Considerations

### Dependencies

**Minimal dependencies for MVP:**
- `commander` - CLI framework
- `chalk` - Terminal colors
- `cli-table3` - Tables
- Node.js built-in `fetch` - HTTP client

**Total dependencies:** ~3 (plus transitive)

### Testing Strategy

1. **Unit tests** - Core modules (parser, validator, formatter)
2. **Integration tests** - HTTP requests against test servers
3. **E2E tests** - Full CLI commands against real/mock catalogs
4. **Snapshot tests** - Output formatting consistency

### Error Handling

Common error scenarios:
- Network errors (DNS failure, timeout, connection refused)
- Invalid JSON responses
- Non-RFC-compliant catalogs
- Missing or malformed links
- Redirect loops
- TLS certificate errors

Each error should provide:
- Clear error message explaining what went wrong
- Suggestions for how to fix (e.g., "Is the host reachable?")
- Exit code indicating error type

### Security Considerations

1. **HTTPS by default** - Always use HTTPS unless user specifies HTTP explicitly
2. **TLS verification** - Verify certificates by default (allow `--insecure` flag for dev/test)
3. **Redirect limits** - Follow max 5 redirects to prevent redirect loops
4. **Timeout** - Default 10s timeout to prevent hanging
5. **Input validation** - Validate host URLs before making requests
6. **No credential storage** - Never store API keys or tokens to disk

### Performance

Expected performance:
- Discovery: <1s for typical catalogs (<100 APIs)
- Fetch: Depends on spec size (1-5s for typical OpenAPI specs)
- Validate: <100ms (local processing only)

Optimization strategies:
- Parallel fetching when using `--all`
- Streaming large specs instead of buffering in memory
- Optional caching to avoid re-fetching unchanged catalogs

---

## Future Considerations

### Potential Enhancements

1. **Interactive mode** - Terminal UI for browsing catalogs
2. **API playground** - Test API endpoints directly from CLI
3. **Spec conversion** - Convert between OpenAPI 3.0 and 3.1, etc.
4. **Spec diffing** - Show changes between spec versions
5. **Code generation** - Generate client SDKs from discovered specs
6. **Registry mode** - Maintain local registry of discovered APIs
7. **Browser extension** - Discover APIs from browser

### Integration Opportunities

1. **Postman/Insomia** - Import discovered APIs into REST clients
2. **Swagger UI** - Launch local Swagger UI for discovered OpenAPI specs
3. **GraphQL Playground** - Launch playground for discovered GraphQL APIs
4. **IDE plugins** - VSCode, IntelliJ plugins for in-editor API discovery
5. **API gateways** - Integrate with Kong, Tyk, Apigee for automatic routing

### Standardization

If the tool gains traction, consider:
- Proposing CLI conventions to IETF for RFC 9727 consumer tools
- Collaborating with other RFC 9727 implementors on common tooling
- Contributing to RFC errata or future revisions based on learnings

---

## Success Metrics

### Adoption Metrics

- npm downloads per week
- GitHub stars and forks
- Community contributions (PRs, issues)
- Mentions in blog posts, tutorials, documentation

### Usage Metrics (opt-in telemetry)

- Most used commands (discover vs. fetch vs. validate)
- Average catalog size (number of APIs per host)
- Common output formats (human vs. json)
- Extension adoption (how many catalogs use x-* fields)

### Quality Metrics

- Test coverage (target: >90%)
- Bug report rate
- Time to fix critical issues
- Documentation completeness

### Impact Metrics

- Number of AI agents using the tool (based on user agent strings)
- Number of CI/CD pipelines using the tool
- Number of services publishing catalogs (inferred from validation usage)

---

## Risks and Mitigations

### Risk 1: Low RFC 9727 Adoption

**Impact:** High
**Probability:** Medium
**Mitigation:**
- Provide clear examples and tutorials showing value
- Integrate with popular tools to increase visibility
- Contribute to IETF discussions and community building
- Works with any compliant catalog, so value grows over time

### Risk 2: Maintenance Burden

**Impact:** Medium
**Probability:** Low
**Mitigation:**
- Keep dependencies minimal
- Write comprehensive tests
- Document architecture clearly for contributors
- Use automated dependency updates (Dependabot)

### Risk 3: Competition from General Tools

**Impact:** Low
**Probability:** Medium
**Mitigation:**
- Focus on RFC 9727-specific features (validation, extensions)
- Provide superior UX over general tools like `curl` + `jq`
- Integrate with AI agents (major differentiator)

### Risk 4: Breaking Changes in RFC

**Impact:** High
**Probability:** Low
**Mitigation:**
- Monitor IETF discussions for RFC updates
- Version CLI tool with semantic versioning
- Support multiple RFC versions if needed
- Graceful fallbacks for non-compliant catalogs

---

## Conclusion

The `@airnub/wellknown-cli` tool is a **high-value addition** to the wellknown toolkit. It:

1. **Completes the RFC 9727 ecosystem** by providing a consumer-side tool to complement the server-side `@airnub/wellknown-api-catalog` package

2. **Enables AI coding agents** to programmatically discover and consume API specs, which is increasingly important as agents become mainstream

3. **Improves developer experience** by automating API discovery and spec fetching

4. **Supports CI/CD workflows** through automated compliance validation

5. **Has low implementation cost** relative to the value it provides

### Recommendation: **Proceed with implementation**

Start with Phase 1 (MVP) focusing on core commands (discover, fetch, validate). Gather user feedback and iterate. The tool aligns with the project's mission to make RFC 9727 practical and accessible.

### Next Steps

1. Create package structure: `packages/cli/`
2. Set up TypeScript project with CLI tooling
3. Implement CatalogFetcher and LinksetParser modules
4. Implement `discover` command
5. Write tests and documentation
6. Publish alpha release to npm
7. Gather feedback from early adopters
8. Iterate and expand features

---

**Document Owner:** Airnub Technologies Limited
**Last Updated:** 2025-11-18
**Status:** Proposal - Pending Review
