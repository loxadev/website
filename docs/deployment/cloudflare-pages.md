# Cloudflare Pages deployment

This repository deploys a static Next.js export to the Cloudflare Pages project `loxa`.

## Current delivery mode

- Project: `loxa`
- Pages hostname: `loxa.pages.dev`
- Production branch: `main`
- Build command: `pnpm build`
- Build output: `out/`
- Runtime: Node.js 22 and pnpm 11.11.0
- Delivery mode: Direct Upload with Wrangler

Direct Upload projects cannot be converted to Cloudflare Pages Git integration. Creating a Git-integrated project later requires a separate Pages project.

The existing `loxadev.github.io` site and the `loxa.dev` DNS records remain the rollback path until an owner verifies and approves the custom-domain cutover.

## Credentials

Local deployment reads these values from the ignored `.env.local` file:

```dotenv
CLOUDFLARE_API_TOKEN=replace-with-a-scoped-token
CLOUDFLARE_ACCOUNT_ID=replace-with-the-account-id
```

The API token requires only:

```text
Account → Cloudflare Pages → Edit
```

Never commit, print, log, or paste either value into documentation, issues, pull requests, or chat. Do not grant DNS permissions for preview deployments.

If GitHub Actions takes over deployment later, store the same values as repository secrets named `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Release checks

Use the pinned project runtime and verify the complete static export before uploading:

```sh
pnpm install --frozen-lockfile
pnpm check
```

The release gate covers linting, type checking, tests, internal links, the Next.js export, and the exported-route contract.

## Preview deployment

Deploy a non-production branch explicitly:

```sh
pnpm dlx wrangler@4.110.0 pages deploy out \
  --project-name=loxa \
  --branch=feature-fumadocs \
  --commit-hash="$(git rev-parse HEAD)" \
  --commit-dirty=false
```

Cloudflare returns an immutable deployment URL and updates the branch alias. Preview deployments do not update `loxa.pages.dev` or any attached custom domain.

Verify the deployment record:

```sh
pnpm dlx wrangler@4.110.0 pages deployment list --project-name=loxa
```

Review at minimum:

- `/`
- `/docs`
- `/docs/cli`
- `/api/search`
- `/robots.txt`
- `/sitemap.xml`

Cloudflare adds `X-Robots-Tag: noindex` to Pages preview deployments.

## Production deployment

Production deployment is allowed only when:

1. GitHub CI is green.
2. The website pull request is approved and merged into `main`.
3. The local checkout is clean and matches `origin/main`.
4. The static release checks pass from that commit.
5. The current Cloudflare preview has been reviewed.

Deploy the verified `main` export:

```sh
pnpm dlx wrangler@4.110.0 pages deploy out \
  --project-name=loxa \
  --branch=main \
  --commit-hash="$(git rev-parse HEAD)" \
  --commit-dirty=false
```

This updates `loxa.pages.dev`. It does not attach `loxa.dev` by itself.

## Custom-domain cutover

Treat the custom domain as a separate owner-approved operation:

1. Verify `loxa.pages.dev` after the production deployment.
2. Attach `loxa.dev` to the Pages project in Cloudflare.
3. Confirm the apex domain, `/docs`, assets, search, redirects, TLS, and cache behavior.
4. Confirm a documented rollback before removing the legacy GitHub Pages custom-domain claim.
5. Preserve path behavior for `www` and the later `docs.loxa.dev/*` redirect.

Do not change DNS, GitHub Pages settings, or the legacy repository during a preview deployment.

## Rollback

Before custom-domain cutover, rollback is simply leaving the legacy GitHub Pages route unchanged.

After cutover, rebuild and redeploy the last known-good commit, verify `loxa.pages.dev`, and only then update the custom-domain route if required. Never delete deployment history or the legacy site before the replacement is verified.

## References

- [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Cloudflare Pages API](https://developers.cloudflare.com/pages/configuration/api/)
- [Cloudflare Pages preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
- [Deploy a static Next.js site to Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/)
