# eslint-interactive

The CLI tool to run `eslint --fix` for each rule

---

# :eyes: **[You can see the demo movie here.](https://youtu.be/UKrm4v-jdbw)** :eyes:

[![Watch the video](https://img.youtube.com/vi/UKrm4v-jdbw/maxresdefault.jpg)](https://youtu.be/UKrm4v-jdbw)

## Motivation

The default ESLint output contains a lot of useful messages for developers, such as the source of the error and hints for fixing it. While this works for many use cases, it does not work well in situations where many messages are reported. For example, when introducing ESLint into a project, or when making big changes to the `.eslintrc` of a project. In these situations, the output of ESLint can be quite large, making it difficult for developers to analyze the output. It is also difficult for the developer to fix messages mechanically, because messages of many rules are mixed up in the output.

In such the above situation, I think two things are important:

- Show a summary of all problems (called _"warnings"_ or _"errors"_ in ESLint) so that the whole picture can be easily understood
  - Showing the details of each problem will confuse developers.
- Provide an efficient way to fix many problems
  - `eslint --fix` is one of the best ways to fix problems efficiently, but it auto-fixes all rule problems at once.
  - Depending on the rule, auto-fix may affect the behavior of the code, so auto-fix should be done with care.
  - Therefore, it is desirable to provide a way to auto-fix in smaller units than `eslint --fix`.

So, I created a tool called `eslint-interactive` which wraps ESLint. This tool groups all problems by rule and outputs formatted number of problems per rule. In addition to the breakdown of problems per rule, it also outputs the number of fixable problems and other hints to help developers fix problems.

Also, You can perform the following actions for each rule:

- Display raw ESLint problem messages
- Apply auto-fix
- Add disable comment (`// eslint-disable-next-line <rule-name>`)
- Apply suggestion

## Installation

```console
$ npm i -g eslint @mizdra/eslint-interactive
$ eslint-interactive --help

$ # or npx
$ npx -p eslint -p @mizdra/eslint-interactive eslint-interactive --help
```

## Usage

```console
$ # Show help
$ eslint-interactive --help
eslint-interactive [file.js] [dir]

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --ruledir  Use additional rules from this directory                    [array]
  --ext      Specify JavaScript file extensions                          [array]
  --format   Specify the format to be used for the `Display problem messages`
             action                              [string] [default: "codeframe"]


$ # Examples
$ eslint-interactive ./src
$ eslint-interactive ./src ./test
$ eslint-interactive './src/**/*.{ts,tsx,vue}'
$ eslint-interactive ./src --ext .ts,.tsx,.vue
$ eslint-interactive ./src --ruledir ./rules
```

## Differences from related works

### [eslint-nibble](https://github.com/IanVS/eslint-nibble)

A tool similar to `eslint-interactive` is [eslint-nibble](https://github.com/IanVS/eslint-nibble). Both tools solve the same problem, but `eslint-interactive` has some features that `eslint-nibble` does not have. For example, `eslint-interactive` prints the number of fixable problems per rule, while `eslint-nibble` does not. Also, `eslint-interactive` has various tricks to speed up the cycle of auto-fixing per-rule, but `eslint-nibble` auto-fixes once and terminates the process every time, so it is not as fast as `eslint-interactive`.

I think these features are very important to solve the aforementioned problem. At first, I thought of implementing these features in `eslint-nibble`, but it required a major rewrite of the code, so I implemented it as a new tool `eslint-interactive`. Although `eslint-interactive` is a tool independent of `eslint-nibble`, it is influenced by the ideas of `eslint-nibble` and inherits some of its code. That's why you can find the names of [@IanVS](https://github.com/IanVS) and others in [the license of `eslint-interactive`](https://github.com/mizdra/eslint-interactive/blob/master/LICENSE).

Thanks, [@IanVS](https://github.com/IanVS).

### [suppress-eslint-errors](https://github.com/amanda-mitchell/suppress-eslint-errors)

[suppress-eslint-errors](https://github.com/amanda-mitchell/suppress-eslint-errors) is an excellent tool to add comments for disable mechanically. Just like `eslint-interactive`, it allows you to add disable comments for each rule and leave the purpose of disable as a comment. There is no functional difference between the two, but there is a difference in the API used to insert the comments.

`suppress-eslint-errors` uses [`jscodeshift`](https://github.com/facebook/jscodeshift) to insert comments. `jscodeshift` modifies the file in parallel, so `suppress-eslint-errors` has the advantage of being able to insert comments faster. However, `jscodeshift` cannot reuse the AST of ESLint, so you need to reparse the code in `jscodeshift`. This means that you have to pass `jscodeshift` the information it needs to parse your code (parser type, parser options). In fact, `suppress-eslint-errors` requires `--extensions` and `--parser` command line option. Normally, users specify the parsing options in `.eslintrc`, so passing these options may seem cumbersome. Also, due to the difference in the way ESLint and `jscodeshift` parse, it may not be possible to insert comments correctly.

On the other hand, `eslint-interactive` uses [`ESLint.outputFixes`](https://eslint.org/docs/developer-guide/nodejs-api#-eslintoutputfixesresults) to insert comments. It uses ESLint's API to do everything from parsing the code to inserting the comments, so it works as expected in many cases. Also, `eslint-interactive` will parse the code using the parsing options specified in `.eslintrc`. Therefore, comments can be inserted without any additional command line options. By the way, comment insertion is slower than `suppress-eslint-errors` because, unlike `suppress-eslint-errors`, it cannot modify files in parallel. However, this limitation may be improved when ESLint supports parallel processing in the near future.

## For Contributors

### How to dev

- `yarn run build`: Build for production
- `yarn run dev`: Run for development
- `yarn run lint`: Try static-checking
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
