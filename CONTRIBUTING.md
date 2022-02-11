# Contributing

This is a guide for contributors.

## How to dev

- `yarn run build`: Build for production
- `yarn run dev`: Run for development
- `yarn run lint`: Try static-checking
- `yarn run test`: Run tests

## How to release

- Wait for passing CI...
- ```bash
  git switch main && git pull
  ```
- ```bash
  rm -rf dist && yarn run build
  ```
- ```bash
  yarn version
  ```
- ```bash
  npm publish
  ```
- ```bash
  git push --follow-tags
  ```
