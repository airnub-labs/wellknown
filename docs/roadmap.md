# Roadmap

## Current Status

The `@airnub/wellknown-api-catalog` package is feature-complete and implements the full [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727.html) specification for API catalog discovery via `/.well-known/api-catalog`.

**Status:** ✅ Stable (v0.1.0)

---

## Future Development

At this time, **no additional features are planned** for the `api-catalog` package. The implementation is spec-compliant and production-ready.

### Next Planned Development

**`@airnub/wellknown-cli` - CLI Tool for Well-Known Resource Discovery**

A command-line interface tool for discovering and consuming RFC 9727-compliant API catalogs and other well-known resources. This tool serves as the **client-side companion** to the wellknown toolkit packages.

**Status:** 📋 Planned (See [CLI Tool Design Document](./internal/cli-tool-design.md))

#### Overview

The CLI tool will enable developers and AI coding agents to easily discover, validate, and consume resources from any host that publishes well-known endpoints. Initially focused on API catalog discovery (`/.well-known/api-catalog`), the tool is designed to support additional well-known specifications in the future.

#### Core Features

- **Discovery:** Discover APIs and resources from `/.well-known/*` endpoints
- **Validation:** Validate RFC compliance for published well-known resources
- **Spec Fetching:** Fetch and save API specifications (OpenAPI, GraphQL, AsyncAPI, JSON Schema)
- **AI Agent Support:** JSON output for programmatic consumption by AI coding agents
- **CI/CD Integration:** Automated compliance validation for deployment pipelines

#### How It Supports the Wellknown Ecosystem

The CLI tool is designed with an extensible architecture that can support **all well-known specifications** as new packages are added to the toolkit:

1. **Security & Authentication Discovery**
   - Discover OAuth 2.0 and OpenID Connect configurations
   - Fetch security.txt contact information
   - Validate security metadata compliance

2. **Web & DNS Resource Discovery**
   - Discover host metadata and service capabilities
   - Fetch change-password URLs for password managers
   - Validate ACME challenge configurations

3. **Payment & Commerce Discovery**
   - Discover payment method manifests
   - Validate payment capability metadata

4. **Privacy & Policy Discovery**
   - Fetch DNT policy documents
   - Validate privacy policy disclosures

#### Future Commands

As new well-known packages are added to the toolkit, the CLI can be extended with specialized commands:

```bash
# API Catalog (Phase 1)
wellknown discover api.example.com
wellknown fetch api.example.com --all

# Security (Future)
wellknown security api.example.com
wellknown oauth api.example.com --metadata

# General Discovery (Future)
wellknown list api.example.com  # List all well-known resources
wellknown validate api.example.com --all  # Validate all well-known endpoints
```

#### Implementation Timeline

- **Phase 1 (MVP):** API catalog discovery, fetching, and validation - 2-3 weeks
- **Phase 2:** Enhanced validation and AI agent support - 1-2 weeks
- **Phase 3:** Multi-spec support for additional well-known packages - As packages are developed

#### Value to the Ecosystem

- **Completes the wellknown toolkit** by providing consumer-side tooling
- **Enables AI agents** to programmatically discover and consume well-known resources
- **Improves developer experience** with automated discovery and validation
- **Future-proof architecture** that scales with new well-known spec implementations

---

### Potential New Packages

The `wellknown` toolkit could be extended with additional packages that implement other `/.well-known/` specifications. These are potential future additions:

#### Security & Authentication

**1. `@airnub/wellknown-security-txt`**
- **Spec:** [RFC 9116 - security.txt](https://www.rfc-editor.org/rfc/rfc9116.html)
- **Purpose:** Standardized security contact information for vulnerability reporting
- **Use Case:** Security researchers need to contact organizations about vulnerabilities
- **Well-known URI:** `/.well-known/security.txt`

**2. `@airnub/wellknown-oauth-authorization-server`**
- **Spec:** [RFC 8414 - OAuth 2.0 Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414.html)
- **Purpose:** OAuth 2.0 authorization server metadata discovery
- **Use Case:** Clients discover OAuth endpoints and capabilities
- **Well-known URI:** `/.well-known/oauth-authorization-server`

**3. `@airnub/wellknown-openid-configuration`**
- **Spec:** [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html)
- **Purpose:** OpenID Connect provider configuration discovery
- **Use Case:** OpenID Connect clients discover provider capabilities
- **Well-known URI:** `/.well-known/openid-configuration`

#### Web & DNS

**4. `@airnub/wellknown-change-password`**
- **Spec:** [WICG Change Password URL](https://w3c.github.io/webappsec-change-password-url/)
- **Purpose:** Standardized URL for password change functionality
- **Use Case:** Password managers can direct users to change passwords
- **Well-known URI:** `/.well-known/change-password`

**5. `@airnub/wellknown-host-meta`**
- **Spec:** [RFC 6415 - host-meta](https://www.rfc-editor.org/rfc/rfc6415.html)
- **Purpose:** Host metadata discovery for web services
- **Use Case:** Service discovery and capability advertisement
- **Well-known URI:** `/.well-known/host-meta`

**6. `@airnub/wellknown-acme-challenge`**
- **Spec:** [RFC 8555 - ACME (Let's Encrypt)](https://www.rfc-editor.org/rfc/rfc8555.html)
- **Purpose:** Automated Certificate Management Environment challenges
- **Use Case:** TLS certificate issuance validation
- **Well-known URI:** `/.well-known/acme-challenge/`

#### Payment & Commerce

**7. `@airnub/wellknown-payment-method-manifest`**
- **Spec:** [W3C Payment Method Manifest](https://w3c.github.io/payment-method-manifest/)
- **Purpose:** Payment method capability discovery
- **Use Case:** Web payments API integration
- **Well-known URI:** `/.well-known/payment-method-manifest.json`

#### Privacy & Policy

**8. `@airnub/wellknown-dnt-policy`**
- **Spec:** [W3C Tracking Preference Expression (DNT)](https://www.w3.org/TR/tracking-dnt/)
- **Purpose:** Do Not Track policy disclosure
- **Use Case:** Privacy policy transparency
- **Well-known URI:** `/.well-known/dnt-policy.txt`

---

## Community Contributions

We welcome community contributions for:

1. **Bug fixes** in existing packages
2. **Documentation improvements**
3. **New well-known spec implementations** (as separate packages)
4. **Framework integrations** (e.g., Hono, Koa, NestJS)

### Contributing a New Package

If you'd like to contribute a new `/.well-known/*` implementation:

1. Open an issue proposing the package
2. Include the relevant RFC or spec URL
3. Describe the use case and target audience
4. Follow the existing package structure from `@airnub/wellknown-api-catalog`

---

## Version Strategy

- **api-catalog:** Currently at `0.1.0-next.0` (pre-release)
  - Will move to `1.0.0` after community feedback
  - Follows semantic versioning
  - Breaking changes trigger major version bumps

---

## References

- [IANA Well-Known URIs Registry](https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml)
- [RFC 8615 - Well-Known URIs](https://www.rfc-editor.org/rfc/rfc8615.html)
- [W3C .well-known Resources](https://www.w3.org/.well-known/)

---

**Last Updated:** 2025-01-17
