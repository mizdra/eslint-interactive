# Contributing

This is a guide for contributors.

## How to dev

- `pnpm run build`: Build for production
- `pnpm run dev`: Run for development
- `pnpm run lint`: Try static-checking
- `pnpm run test`: Run tests

## How to release

- Wait for passing CI...
- ```bash
  git switch main && git pull
  ```
- ```bash
  rm -rf dist && pnpm run build
  ```
- ```bash
  pnpm version
  ```
- ```bash
  pnpm publish
  ```
- ```bash
  git push --follow-tags
  ```
