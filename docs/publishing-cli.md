# Publishing Guide - CLI Tool

This guide covers how to publish new versions of `@airnub/wellknown-cli` to GitHub Packages and create GitHub releases.

---

## Prerequisites

### 1. GitHub Personal Access Token (PAT)

1. Create a GitHub Personal Access Token with package write permissions:
   - Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
   - Click **Generate new token (classic)**
   - Select scopes:
     - `write:packages` - Upload packages to GitHub Package Registry
     - `read:packages` - Download packages from GitHub Package Registry
     - `repo` - Access to repository for automated workflows
   - Copy the token (you won't see it again)

2. Add the token to GitHub secrets:
   - Go to repository **Settings** → **Secrets and variables** → **Actions**
   - The `GITHUB_TOKEN` is automatically available in workflows
   - For additional permissions, add as **New repository secret**:
     - Name: `GH_PACKAGES_TOKEN`
     - Value: `<paste your GitHub token>`

### 2. GitHub Permissions

You need **write access** to the repository to:
- Push version bump commits
- Create git tags
- Trigger GitHub Actions workflows
- Create GitHub releases
- Publish packages to GitHub Packages

---

## GitHub Packages vs npm

The CLI tool will be published to **GitHub Packages** instead of npm:

**Why GitHub Packages?**
- Integrated with GitHub repository (single source of truth)
- Better access control for internal/private packages
- No additional external credentials needed (uses GitHub token)
- Easier integration with GitHub Actions
- Package visibility tied to repository visibility

**Installation from GitHub Packages:**
```bash
# Configure npm to use GitHub Packages for @airnub scope
echo "@airnub:registry=https://npm.pkg.github.com" >> .npmrc

# Install the CLI tool
npm install -g @airnub/wellknown-cli

# Or use npx directly (no installation)
npx --registry=https://npm.pkg.github.com @airnub/wellknown-cli discover api.example.com
```

---

## Release Process

### Step 1: Version Bump

**Choose the appropriate version bump based on changes:**

- **Patch** (`0.1.0` → `0.1.1`): Bug fixes, documentation updates
- **Minor** (`0.1.0` → `0.2.0`): New features, backward-compatible changes
- **Major** (`0.1.0` → `1.0.0`): Breaking changes

**Update the version:**

```bash
cd packages/cli

# Edit package.json and update the "version" field
# Example: "0.1.0-alpha.0" → "0.1.0" (removing pre-release tag)
# or "0.1.0" → "0.2.0" (minor version bump)

# Commit the version bump
git add package.json
git commit -m "chore(release): @airnub/wellknown-cli v0.1.0"
```

### Step 2: Create Git Tag

```bash
# Create an annotated tag
git tag -a cli-v0.1.0 -m "Release @airnub/wellknown-cli v0.1.0"

# Push commits and tags
git push origin main --tags
```

**Tag naming convention:** `cli-v<version>`

### Step 3: Publish to GitHub Packages

#### Option A: Via GitHub Actions (Recommended)

A GitHub Actions workflow should be created to automate publishing. Create `.github/workflows/publish-cli.yml`:

```yaml
name: Publish @airnub/wellknown-cli

on:
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Dry run (skip actual publish)'
        required: false
        default: 'false'
        type: choice
        options:
          - 'true'
          - 'false'
  push:
    tags:
      - 'cli-v*.*.*'

permissions:
  contents: read
  packages: write

jobs:
  publish:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: packages/cli

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@airnub'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build

      - name: Publish to GitHub Packages (Dry Run)
        if: ${{ inputs.dry_run == 'true' }}
        run: |
          echo "Dry run - would publish:"
          npm pack --dry-run
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Publish to GitHub Packages
        if: ${{ inputs.dry_run != 'true' }}
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Summary
        run: |
          echo "### Published @airnub/wellknown-cli 🚀" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "Version: $(node -p "require('./package.json').version")" >> $GITHUB_STEP_SUMMARY
          echo "Package: @airnub/wellknown-cli" >> $GITHUB_STEP_SUMMARY
          echo "Registry: GitHub Packages" >> $GITHUB_STEP_SUMMARY
```

**To publish:**

1. Go to [GitHub Actions](https://github.com/airnub-labs/wellknown/actions)
2. Select **"Publish @airnub/wellknown-cli"** workflow
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
- Publish to GitHub Packages with proper authentication

**Automatic publishing on tag push:**

The workflow is also configured to trigger automatically when you push a tag matching `cli-v*.*.*` pattern. After creating and pushing the tag in Step 2, the publish workflow will run automatically.

#### Option B: Local Publishing (Not Recommended)

Only use this if GitHub Actions is unavailable.

```bash
# Configure npm authentication for GitHub Packages
echo "@airnub:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=${GH_PACKAGES_TOKEN}" >> .npmrc

# Build and publish
cd packages/cli
pnpm build
npm publish --access public

# Clean up auth token
rm ../../.npmrc
```

**⚠️ Warning:** Local publishing lacks CI guarantees. Always prefer GitHub Actions.

### Step 4: Create GitHub Release

#### Option A: Via GitHub UI (Recommended)

1. Go to [Releases](https://github.com/airnub-labs/wellknown/releases)
2. Click **"Draft a new release"**
3. Configure:
   - **Choose a tag:** Select `cli-v0.1.0` (from dropdown)
   - **Release title:** `@airnub/wellknown-cli v0.1.0`
   - **Description:** Write release notes (see template below)
   - **Set as latest release:** ✅ (if this is the latest stable version)
4. Click **"Publish release"**

#### Option B: Via GitHub CLI

```bash
gh release create cli-v0.1.0 \
  --title "@airnub/wellknown-cli v0.1.0" \
  --notes "Release notes here" \
  --latest
```

**Release Notes Template:**

```markdown
## What's Changed

### Features
- Add `discover` command for API catalog discovery
- Add `fetch` command for spec retrieval
- Add `validate` command for RFC 9727 compliance checking

### Bug Fixes
- Fixed host parsing for URLs with ports

### Documentation
- Added usage examples for AI agents
- Updated command reference

### Breaking Changes (if any)
- Renamed `--output-format` to `--format` (migration guide: ...)

## Installation

Install from GitHub Packages:

\`\`\`bash
# Configure npm to use GitHub Packages for @airnub scope
echo "@airnub:registry=https://npm.pkg.github.com" >> .npmrc

# Install globally
npm install -g @airnub/wellknown-cli

# Or use npx
npx --registry=https://npm.pkg.github.com @airnub/wellknown-cli --help
\`\`\`

**Full Changelog**: https://github.com/airnub-labs/wellknown/compare/cli-v0.0.9...cli-v0.1.0
```

### Step 5: Verify Publication

```bash
# Check GitHub Packages (requires authentication)
npm view @airnub/wellknown-cli --registry=https://npm.pkg.github.com

# Install and test
npm install -g @airnub/wellknown-cli --registry=https://npm.pkg.github.com

# Test the CLI
wellknown --version
wellknown --help
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

**Publishing pre-releases:**
```bash
# GitHub Packages doesn't use dist tags like npm
# Use semantic versioning pre-release identifiers
npm publish --access public
```

Users can install specific pre-release versions:
```bash
npm install @airnub/wellknown-cli@0.2.0-alpha.1 --registry=https://npm.pkg.github.com
```

### Stable Versions

```json
{
  "version": "1.0.0"
}
```

```bash
npm publish --access public
```

---

## Troubleshooting

### Error: "You do not have permission to publish"

**Solution:**
1. Verify you have write access to the repository
2. Check `GITHUB_TOKEN` has `write:packages` permission
3. Ensure package name matches repository scope (`@airnub/wellknown-cli`)
4. Verify package.json has correct `repository` field:
   ```json
   {
     "repository": {
       "type": "git",
       "url": "https://github.com/airnub-labs/wellknown.git",
       "directory": "packages/cli"
     }
   }
   ```

### Error: "Version already exists"

**Solution:**
1. Check current version: `npm view @airnub/wellknown-cli version --registry=https://npm.pkg.github.com`
2. Bump version in `package.json` to a higher number
3. Never reuse or overwrite existing versions

### Workflow fails during `npm publish`

**Common causes:**
- Invalid or expired `GITHUB_TOKEN`
- Incorrect package scope or repository configuration
- Network issues

**Solution:**
1. Check workflow logs for specific error
2. Verify token permissions in workflow
3. Check package.json configuration
4. Re-run workflow or publish locally as fallback

### Users can't install the package

**Common issue:** Users need to configure npm to use GitHub Packages for the `@airnub` scope.

**Solution:** Users must add to their `.npmrc`:
```
@airnub:registry=https://npm.pkg.github.com
```

For authentication to install from GitHub Packages, users may need a GitHub token:
```
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

---

## Rollback Procedure

If a published version has critical issues:

### 1. Delete the Package Version (GitHub Packages allows this)

Unlike npm, GitHub Packages allows deletion of specific versions:

1. Go to repository **Packages**
2. Select `@airnub/wellknown-cli`
3. Click on the problematic version
4. Click **Delete version**

**⚠️ Note:** Only delete within first few hours. If users have already installed, publish a fixed version instead.

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

Or delete the GitHub release if the package version was deleted.

---

## Migration to npm Registry (Future)

If the project decides to publish the CLI to npm instead of GitHub Packages:

1. Update workflow to use `NPM_TOKEN` instead of `GITHUB_TOKEN`
2. Change registry-url from `https://npm.pkg.github.com` to `https://registry.npmjs.org`
3. Update installation instructions in documentation
4. Publish initial version to npm
5. Notify users of registry change

---

## Checklist

Before publishing, ensure:

- [ ] Version bumped in `packages/cli/package.json`
- [ ] Changelog updated (if applicable)
- [ ] Tests passing (`pnpm test`)
- [ ] Linters passing (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Git tag created (`cli-v<version>`)
- [ ] Tag pushed to GitHub
- [ ] GitHub Packages publish completed
- [ ] GitHub release created
- [ ] Release verified (`npm view @airnub/wellknown-cli --registry=https://npm.pkg.github.com`)
- [ ] CLI installed and tested (`wellknown --version`)

---

**Last Updated:** 2025-11-18
