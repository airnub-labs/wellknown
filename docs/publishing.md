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

## First-Time Setup

### Before Publishing for the First Time

**⚠️ IMPORTANT:** If this is the first time publishing the package, follow these steps:

#### 1. Verify npm Organization Access

The package is scoped to `@airnub`. You need to either:

**Option A: Join existing organization**
1. Ask the organization owner to invite you:
   - Go to https://www.npmjs.com/settings/airnub/members
   - Add your npm username as a member with **publish permissions**
2. Accept the invitation in your email

**Option B: Create the organization (if it doesn't exist)**
1. Go to https://www.npmjs.com/org/create
2. Create organization: `airnub`
3. Choose organization type (free for open source)
4. Add other team members as needed

#### 2. Verify Your Access

```bash
# Check if you can access the organization
npm access ls-packages @airnub

# If the package doesn't exist yet, this is expected
# If you see "E404: Not found", verify organization membership
```

#### 3. Test Before Publishing

**ALWAYS run the workflow with `dry_run: true` first:**

1. Go to [GitHub Actions](https://github.com/airnub-labs/wellknown/actions)
2. Select **"Publish @airnub/wellknown-api-catalog"** workflow
3. Click **"Run workflow"**
4. **Set `dry_run` to `true`**
5. Verify the build, tests, and package validation succeed

This validates your package without publishing it to npm.

#### 4. First Publish Checklist

Before your first publish, ensure:

- [ ] You're a member of the `@airnub` npm organization
- [ ] You have publish permissions in the organization
- [ ] `NPM_TOKEN` is configured in GitHub secrets (with publish access)
- [ ] Package name `@airnub/wellknown-api-catalog` is available on npm
- [ ] Dry-run workflow completed successfully
- [ ] Version in `package.json` follows semver (e.g., `0.1.0-alpha.1`)

#### 5. Common First-Time Errors

**Error: `404 Not Found - PUT https://registry.npmjs.org/@airnub%2fwellknown-api-catalog`**

This means either:
- The `@airnub` organization doesn't exist → Create it or verify the name
- You're not a member of the organization → Request access from the owner
- Your npm token doesn't have publish permissions → Regenerate with **Automation** type

**Solution:**
1. Verify organization exists: https://www.npmjs.com/org/airnub
2. Check your membership: `npm access ls-packages @airnub`
3. Ensure `NPM_TOKEN` in GitHub secrets is an **Automation** token (not Classic)

---

## Release Process

### Important: Always Dry-Run First

**⚠️ Before tagging any release version, ALWAYS run the publish workflow with `dry_run: true`**

This prevents wasting time if there are configuration issues. The dry-run will:
- ✅ Validate your build succeeds
- ✅ Run all tests and linters
- ✅ Validate the package structure
- ❌ Skip actual publishing to npm

Only proceed with tagging and publishing after dry-run succeeds.

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

**First: Run with dry-run (REQUIRED)**

1. Go to [GitHub Actions](https://github.com/airnub-labs/wellknown/actions)
2. Select **"Publish @airnub/wellknown-api-catalog"** workflow
3. Click **"Run workflow"**
4. Configure:
   - **Branch:** `main` (or your release branch)
   - **dry_run:** `true` ⚠️ Important: Always test first!
5. Click **"Run workflow"**
6. Wait for the workflow to complete and verify all checks pass

**Then: Publish for real**

1. Go back to the workflow
2. Click **"Run workflow"** again
3. Configure:
   - **Branch:** `main` (or your release branch)
   - **dry_run:** `false` (now ready to publish)
4. Click **"Run workflow"**
5. Wait for the workflow to complete

**The workflow will:**
- Install dependencies
- Run linters (`pnpm lint`)
- Run tests (`pnpm test`)
- Build the package (`pnpm build`)
- Validate package structure (`npm pack --dry-run`)
- Publish to npm with provenance (if dry_run=false)

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

#### First-Time Setup for GitHub Releases

**Prerequisites:**
- You need **write access** to the repository to create releases
- The git tag must already exist and be pushed to GitHub

**Verify your access:**
1. Go to [Releases](https://github.com/airnub-labs/wellknown/releases)
2. You should see a **"Draft a new release"** button
3. If you don't see this button, you don't have sufficient permissions

**If you lack permissions:**
- Ask a repository admin to grant you **write** or **maintain** role
- Go to repository **Settings** → **Collaborators and teams**
- Or ask someone with access to create the release for you

#### Option A: Via GitHub UI (Recommended)

1. Go to [Releases](https://github.com/airnub-labs/wellknown/releases)
2. Click **"Draft a new release"**
3. Configure:
   - **Choose a tag:** Select `api-catalog-v0.1.0` (from dropdown)
   - **Release title:** `@airnub/wellknown-api-catalog v0.1.0`
   - **Description:** Write release notes (see template below)
   - **Set as latest release:** ✅ (if this is the latest stable version)
   - **Set as a pre-release:** ✅ (if version contains -alpha, -beta, -rc)
4. Click **"Publish release"**

**⚠️ Important:** For pre-release versions (e.g., `0.1.0-alpha.1`), always check **"Set as a pre-release"** to avoid marking it as the latest stable version.

#### Option B: Via GitHub CLI

**First-time setup:**
```bash
# Verify gh CLI is installed and authenticated
gh auth status

# If not authenticated, login
gh auth login
```

**For stable releases:**
```bash
gh release create api-catalog-v0.1.0 \
  --title "@airnub/wellknown-api-catalog v0.1.0" \
  --notes "Release notes here" \
  --latest
```

**For pre-releases (alpha, beta, rc):**
```bash
gh release create api-catalog-v0.1.0-alpha.1 \
  --title "@airnub/wellknown-api-catalog v0.1.0-alpha.1" \
  --notes "Release notes here" \
  --prerelease
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

### Error: "404 Not Found" when publishing

```
npm error 404 Not Found - PUT https://registry.npmjs.org/@airnub%2fwellknown-api-catalog
npm error 404 '@airnub/wellknown-api-catalog@x.x.x' is not in this registry.
```

**This is the most common first-time publish error.**

**Root causes:**
1. The `@airnub` npm organization doesn't exist
2. You're not a member of the organization
3. Your npm token lacks publish permissions

**Solution:**
1. **Check organization exists:** Visit https://www.npmjs.com/org/airnub
   - If it doesn't exist, create it at https://www.npmjs.com/org/create
2. **Verify your membership:**
   ```bash
   npm access ls-packages @airnub
   ```
   - If you see an error, request access from the organization owner
3. **Check your token type:**
   - GitHub Secret `NPM_TOKEN` must be an **Automation** token (not Classic)
   - Regenerate at https://www.npmjs.com/settings/tokens if needed
4. **For first-time publish:** See the [First-Time Setup](#first-time-setup) section above

### Error: "You do not have permission to publish"

**Solution:**
1. Verify you're a maintainer on npm: https://www.npmjs.com/package/@airnub/wellknown-api-catalog
2. Check `NPM_TOKEN` is valid and has publish permissions
3. Ensure token is set in GitHub secrets (if using Actions)

### Error: Cannot create GitHub release (403 Forbidden)

**Symptoms:**
- "Draft a new release" button is missing or grayed out
- Error: "Resource not accessible by integration" or "403 Forbidden"

**Root causes:**
1. You don't have write access to the repository
2. The git tag hasn't been pushed to GitHub yet

**Solution:**
1. **Verify repository permissions:**
   ```bash
   # Check your access level
   gh api repos/airnub-labs/wellknown/collaborators/$(gh api user -q .login)/permission
   ```
   - You need `write`, `maintain`, or `admin` permission
   - Ask a repository admin to add you if needed

2. **Verify tag exists on GitHub:**
   ```bash
   # List remote tags
   git ls-remote --tags origin | grep api-catalog

   # If missing, push your tag
   git push origin api-catalog-v0.1.0
   ```

3. **For first-time contributors:** Repository admins need to add you via:
   - **Settings** → **Collaborators and teams** → **Add people**
   - Grant at least **Write** role

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

### Before Creating Release Tag:

- [ ] Version bumped in `packages/api-catalog/package.json`
- [ ] Changelog updated (if applicable)
- [ ] **Dry-run workflow executed successfully** (`dry_run: true`)
- [ ] Tests passing (`pnpm test`)
- [ ] Linters passing (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Package validation passes (`npm pack --dry-run`)
- [ ] You have write access to the GitHub repository (for creating releases)

### After Creating Release Tag:

- [ ] Git tag created (`api-catalog-v<version>`)
- [ ] Tag pushed to GitHub (`git push origin <tag>`)
- [ ] Tag is visible on GitHub (verify via releases page or `git ls-remote`)
- [ ] Publish workflow executed (`dry_run: false`)
- [ ] npm publish completed successfully
- [ ] GitHub release created
  - [ ] Marked as **pre-release** if version contains -alpha, -beta, or -rc
  - [ ] Marked as **latest** only for stable versions
- [ ] Release verified on npm (`npm view @airnub/wellknown-api-catalog`)
- [ ] Release verified on GitHub (check releases page)

---

**Last Updated:** 2025-11-18
