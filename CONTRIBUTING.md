# Contributing

This is a guide for contributors.

## How to dev

- `yarn run build`: Build for production
- `yarn run dev`: Run for development
- `yarn run lint`: Try static-checking
- `yarn run test`: Run tests

## How to release

```console
$ # Wait for passing CI...
$ git switch main
$ git pull
$ yarn version
$ rm -rf dist && yarn run build
$ npm publish
$ git push --follow-tags
```
