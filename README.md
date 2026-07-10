# Loxa website

This repository contains the public `loxa.dev` marketing site and `loxa.dev/docs` documentation.

## Prerequisites

- Node `>=22.13 <23`
- pnpm `11.11.0`

## Local website commands

- Install website dependencies: `pnpm install`
- Start the local website: `pnpm dev`
- Run the complete website check: `pnpm check`

## Architecture

The marketing site and documentation are one Next.js and Fumadocs static export.

## Cloudflare Pages build contract

- Build command: `pnpm build`
- Output directory: `out`
- Node version: `22`

Cloudflare Pages Git integration is the intended host. Repository owners will configure it later.

## Project and license

The product source is [loxadev/loxa](https://github.com/loxadev/loxa).

This website repository is licensed under the [Apache License 2.0](./LICENSE).
