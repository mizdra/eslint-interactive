# eslint-interactive

The CLI tool to run `eslint --fix` for each rule

---

[You can see the demo movie here.](https://youtu.be/UKrm4v-jdbw)

[![Watch the video](https://img.youtube.com/vi/UKrm4v-jdbw/maxresdefault.jpg)](https://youtu.be/UKrm4v-jdbw)

## Motivation

TODO

## What's the difference between [IanVS/eslint-nibble](https://github.com/IanVS/eslint-nibble)?

TODO

## Installation

```bash
$ npm i -g eslint @mizdra/eslint-interactive
$ eslint-interactive --help

$ # or npx
$ npx -p eslint -p @mizdra/eslint-interactive eslint-interactive --help
```

## Usage

```bash
$ # Show help
$ eslint-interactive --help
eslint-interactive [file.js] [dir]

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --ruledir  Use additional rules from this directory                    [array]
  --ext      Specify JavaScript file extensions                          [array]


$ # Examples
$ eslint-interactive src
$ eslint-interactive src test
$ eslint-interactive 'src/**/*.{ts,tsx,vue}'
$ eslint-interactive src --ext .ts,.tsx,.vue
$ eslint-interactive src --ruledir ./rules
```

## Future Work

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
$ rm -rf dist && yarn run build
$ npm publish
$ git push --follow-tags
```
