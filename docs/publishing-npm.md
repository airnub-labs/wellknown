# Publishing `@airnub/wellknown-api-catalog` to npm

This repo publishes the `@airnub/wellknown-api-catalog` package to the public npm
registry using a manually triggered GitHub Actions workflow. Always release via
this workflow so builds, tests, and provenance stay reproducible.

## Prerequisites

1. Create or use an npm account on [npmjs.com](https://www.npmjs.com/).
2. Generate an npm automation token with publish access from your npm account's
   **Access Tokens** page.
3. Store that token in the GitHub repo secret `NPM_TOKEN`:
   - GitHub → Repository → **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret** and name it `NPM_TOKEN`
4. Make sure the version in `packages/api-catalog/package.json` is bumped before
   publishing.

## Bumping the version

We currently bump versions manually using SemVer.

```bash
# edit packages/api-catalog/package.json and update the "version" field
# e.g. "0.1.0" -> "0.2.0"
git commit -am "chore(release): @airnub/wellknown-api-catalog v0.2.0"
git push
```

(We may automate this with tools like Changesets in the future, but today it's
explicit.)

## Running the publish workflow

1. Go to GitHub → [`airnub-labs/wellknown`](https://github.com/airnub-labs/wellknown)
   → **Actions**.
2. Select **Publish @airnub/wellknown-api-catalog**.
3. Click **Run workflow**.
4. Choose the branch (usually `main`).
5. Set `dry_run` to `"false"` to publish, or `"true"` to just run build/test.
6. Click **Run workflow** and wait for the job to finish.
7. Verify the published version: `npm view @airnub/wellknown-api-catalog version`.

The workflow installs dependencies, runs lint/test/build, configures npm auth
using the `NPM_TOKEN` secret, and runs `npm publish --access public` from
`packages/api-catalog`.

## Optional local publishing

Publishing from GitHub Actions is the canonical path. Only publish locally when
absolutely necessary (e.g. testing npm access):

```bash
# from repo root, configure npm auth (do NOT commit this file)
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc

cd packages/api-catalog
npm publish --access public
```

Remember to remove `.npmrc` or ensure it stays untracked. Use the GitHub Actions
workflow for official releases.
