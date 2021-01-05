# eslint-interactive

The CLI tool to run `eslint --fix` for each rule

---

[You can see the demo movie here.](https://youtu.be/UKrm4v-jdbw)

[![Watch the video](https://img.youtube.com/vi/UKrm4v-jdbw/maxresdefault.jpg)](https://youtu.be/UKrm4v-jdbw)

## Motivation

TODO

## What's the difference between [IanVS/eslint-nibble](https://github.com/IanVS/eslint-nibble)?

TODO

## Usage

```bash
$ npx @mizdra/eslint-interactive [file.js] [dir]

$ # Examples
$ npx @mizdra/eslint-interactive src
$ npx @mizdra/eslint-interactive src test
$ npx @mizdra/eslint-interactive 'src/**/*.{ts,tsx,vue}'
```

## Future Work

- [ ] Support `-c, --config path::String` option
- [ ] Support `--ext [String]` option
- [ ] Support `--rulesdir` option
- [ ] Support `--no-pager` option
- [ ] Print the url of rule's documentation

## For Contributors

### How to dev

- `yarn run build`: Build for production
- `yarn run dev`: Run for development
- `yarn run check`: Try static-checking
- `yarn run test`: Run tests

## For Maintainers

### How to release

```console
$ # Wait for passing CI...
$ git switch master
$ git pull
$ yarn version
$ rm -rf dist && npm run build
$ npm publish
$ git push --follow-tags
```
