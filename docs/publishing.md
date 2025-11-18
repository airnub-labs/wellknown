# Publishing Guide

This guide covers how to publish new versions of `@airnub/wellknown-api-catalog` to npm and create GitHub releases.

---

## Prerequisites

### 1. NPM Access Token

1. Create or use an npm account on [npmjs.com](https://www.npmjs.com/)
2. Generate an **automation token** with publish access:
   - Go to [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
   - Click **Generate New Token** → **Automation**
   - Copy the token (you won't see it again)

3. Add the token to GitHub secrets:
   - Go to repository **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `NPM_TOKEN`
   - Value: `<paste your npm token>`

### 2. GitHub Permissions

You need **write access** to the repository to:
- Push version bump commits
- Create git tags
- Trigger GitHub Actions workflows
- Create GitHub releases

---

## Release Process

### Step 1: Version Bump

**Choose the appropriate version bump based on changes:**

- **Patch** (`0.1.0` → `0.1.1`): Bug fixes, documentation updates
- **Minor** (`0.1.0` → `0.2.0`): New features, backward-compatible changes
- **Major** (`0.1.0` → `1.0.0`): Breaking changes

**Update the version:**

```bash
cd packages/api-catalog

# Edit package.json and update the "version" field
# Example: "0.1.0-next.0" → "0.1.0" (removing pre-release tag)
# or "0.1.0" → "0.2.0" (minor version bump)

# Commit the version bump
git add package.json
git commit -m "chore(release): @airnub/wellknown-api-catalog v0.1.0"
```

### Step 2: Create Git Tag

```bash
# Create an annotated tag
git tag -a api-catalog-v0.1.0 -m "Release @airnub/wellknown-api-catalog v0.1.0"

# Push commits and tags
git push origin main --tags
```

**Tag naming convention:** `api-catalog-v<version>`

### Step 3: Publish to npm

#### Option A: Via GitHub Actions (Recommended)

1. Go to [GitHub Actions](https://github.com/airnub-labs/wellknown/actions)
2. Select **"Publish @airnub/wellknown-api-catalog"** workflow
3. Click **"Run workflow"**
4. Configure:
   - **Branch:** `main` (or your release branch)
   - **dry_run:** `false` (set to `true` for testing)
5. Click **"Run workflow"**
6. Wait for the workflow to complete

**The workflow will:**
- Install dependencies
- Run linters (`pnpm lint`)
- Run tests (`pnpm test`)
- Build the package (`pnpm build`)
- Publish to npm with provenance

#### Option B: Local Publishing (Not Recommended)

Only use this if GitHub Actions is unavailable.

```bash
# Configure npm authentication
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc

# Build and publish
cd packages/api-catalog
pnpm build
npm publish --access public

# Clean up auth token
rm ../../.npmrc
```

**⚠️ Warning:** Local publishing lacks provenance and CI guarantees. Always prefer GitHub Actions.

### Step 4: Create GitHub Release

#### Option A: Via GitHub UI (Recommended)

1. Go to [Releases](https://github.com/airnub-labs/wellknown/releases)
2. Click **"Draft a new release"**
3. Configure:
   - **Choose a tag:** Select `api-catalog-v0.1.0` (from dropdown)
   - **Release title:** `@airnub/wellknown-api-catalog v0.1.0`
   - **Description:** Write release notes (see template below)
   - **Set as latest release:** ✅ (if this is the latest stable version)
4. Click **"Publish release"**

#### Option B: Via GitHub CLI

```bash
gh release create api-catalog-v0.1.0 \
  --title "@airnub/wellknown-api-catalog v0.1.0" \
  --notes "Release notes here" \
  --latest
```

**Release Notes Template:**

```markdown
## What's Changed

### Features
- Add support for custom link relations
- Improved TypeScript type definitions

### Bug Fixes
- Fixed proxy trust validation edge case

### Documentation
- Added AI agent extension guidelines
- Updated API examples

### Breaking Changes (if any)
- Renamed `XYZ` to `ABC` (migration guide: ...)

**Full Changelog**: https://github.com/airnub-labs/wellknown/compare/api-catalog-v0.0.9...api-catalog-v0.1.0
```

### Step 5: Verify Publication

```bash
# Check npm registry
npm view @airnub/wellknown-api-catalog version
npm view @airnub/wellknown-api-catalog

# Install and test
npm install @airnub/wellknown-api-catalog@latest
```

---

## Version Management

### Pre-release Versions

For testing releases before stable:

```json
{
  "version": "0.2.0-alpha.1"
}
```

**Dist tags:**
```bash
# Publish to @next tag (default for pre-releases)
npm publish --tag next

# Install pre-release
npm install @airnub/wellknown-api-catalog@next
```

### Stable Versions

```json
{
  "version": "1.0.0"
}
```

**Dist tags:**
```bash
# Publishes to @latest automatically
npm publish --access public
```

---

## Troubleshooting

### Error: "You do not have permission to publish"

**Solution:**
1. Verify you're a maintainer on npm: https://www.npmjs.com/package/@airnub/wellknown-api-catalog
2. Check `NPM_TOKEN` is valid and has publish permissions
3. Ensure token is set in GitHub secrets (if using Actions)

### Error: "Version already exists"

**Solution:**
1. Check current npm version: `npm view @airnub/wellknown-api-catalog version`
2. Bump version in `package.json` to a higher number
3. Never reuse or overwrite existing versions

### Workflow fails during `npm publish`

**Common causes:**
- Invalid or expired `NPM_TOKEN`
- Network issues
- npm registry downtime

**Solution:**
1. Check workflow logs for specific error
2. Regenerate npm token if expired
3. Re-run workflow or publish locally as fallback

---

## Rollback Procedure

If a published version has critical issues:

### 1. Deprecate the Version

```bash
npm deprecate @airnub/wellknown-api-catalog@0.2.0 "Critical bug, use 0.2.1 instead"
```

### 2. Publish Fixed Version

```bash
# Bump to patch version
# 0.2.0 (broken) → 0.2.1 (fixed)
```

### 3. Update GitHub Release

Add a warning to the release notes:

```markdown
⚠️ **DEPRECATED:** This release has been deprecated due to [issue]. Please use v0.2.1 instead.
```

**⚠️ Never unpublish:** npm policy prevents unpublishing after 24 hours. Use deprecation instead.

---

## Automation (Future)

Potential automation improvements:

- **Changesets:** Automated changelog generation
- **Semantic Release:** Automated version bumps based on commit messages
- **Release Please:** Google's release automation tool

For now, we use manual versioning to maintain explicit control over releases.

---

## Checklist

Before publishing, ensure:

- [ ] Version bumped in `packages/api-catalog/package.json`
- [ ] Changelog updated (if applicable)
- [ ] Tests passing (`pnpm test`)
- [ ] Linters passing (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Git tag created (`api-catalog-v<version>`)
- [ ] Tag pushed to GitHub
- [ ] npm publish completed
- [ ] GitHub release created
- [ ] Release verified (`npm view @airnub/wellknown-api-catalog`)

---

**Last Updated:** 2025-01-17
