# eslint-interactive

The CLI tool to run `eslint --fix` for each rule

---

# :eyes: **[You can see the demo movie here.](https://youtu.be/UKrm4v-jdbw)** :eyes:

[![Watch the video](https://img.youtube.com/vi/UKrm4v-jdbw/maxresdefault.jpg)](https://youtu.be/UKrm4v-jdbw)

## Motivation

The default ESLint output contains a lot of useful information for developers, such as the source of the error and hints for fixing it. While this works for many use cases, it does not work well in situations where many errors are reported. For example, when introducing ESLint into a project, or when making big changes to the `.eslintrc` of a project. In these situations, the output of ESLint can be quite large, making it difficult for developers to analyze the output. It is also difficult for the developer to fix errors because many types of errors are mixed up in the output.

In such an error-prone situation, I think two things are important:

- Show a summary of all errors so that the whole picture can be easily understood
  - Showing the details of each error will confuse developers.
- Provide an efficient way to fix many errors
  - `eslint --fix` is one of the best ways to fix errors efficiently, but it auto-fixes all rule errors at once.
  - Depending on the rule, auto-fix may affect the behavior of the code, so auto-fix should be done with care.
  - Therefore, it is desirable to provide a way to auto-fix in smaller units than `eslint --fix`.

So, I created a tool called `eslint-interactive` which wraps ESLint. This tool groups all errors by rule and outputs the number of errors per rule in a formatted format. In addition to the breakdown of _warnings_ and _errors_ per rule, it also outputs the number of fixable errors and other hints to help developers fix errors. You can also specify a number of rules to display raw ESLint error messages or to auto-fix.

## What's the difference between [eslint-nibble](https://github.com/IanVS/eslint-nibble)?

A tool similar to `eslint-interactive` is [eslint-nibble](https://github.com/IanVS/eslint-nibble). Both tools solve the same problem, but `eslint-interactive` has some features that `eslint-nibble` does not have. For example, `eslint-interactive` prints the number of fixable errors per rule, while `eslint-nibble` does not. Also, `eslint-interactive` has various tricks to speed up the cycle of auto-fixing per-rule, but `eslint-nibble` auto-fixes once and terminates the process every time, so it is not as fast as `eslint- interactive`.

I think these features are very important to solve the aforementioned problem. At first, I thought of implementing these features in `eslint-nibble`, but it required a major rewrite of the code, so I implemented it as a new `eslint-interactive`. Although `eslint-interactive` is a tool independent of `eslint-nibble`, it is influenced by the ideas of `eslint-nibble` and inherits some of its code. That's why you can find the names of [@IanVS](https://github.com/IanVS) and others in [the license of `eslint-interactive`](https://github.com/mizdra/eslint-interactive/blob/master/LICENSE).

Thanks, [@IanVS](https://github.com/IanVS).

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
