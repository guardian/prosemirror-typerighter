![](https://travis-ci.org/guardian/prosemirror-typerighter.svg?branch=main) [![Coverage Status](https://coveralls.io/repos/github/guardian/prosemirror-typerighter/badge.svg?branch=main)](https://coveralls.io/github/guardian/prosemirror-typerighter?branch=main)

This Prosemirror plugin adds the ability to validate a document by sending it, or some parts of it, to an external service for validation. Once instantiated, it provides a store object that allows consumer code to subscribe to state updates for UI updates etc.

It's still in its early stages! [There's a demo here.](https://guardian.github.io/prosemirror-typerighter/) See the 'pages' directory for an example implementation.

## Installation

Install dependencies with `./scripts/setup.sh`.

## Development

`npm run watch` builds the project locally, watches for file changes, and serves the project locally at https://typerighter-client.local.dev-gutools.co.uk/ – or http://localhost:5000, if your Typerighter service doesn't require [pan-domain authentication](https://github.com/guardian/pan-domain-authentication).

If your Typerighter service does require pan-domain authentication, you will need to run and visit another .local.dev-gutools application alongside this service to supply an authenticated cookie for that domain.

The plugin must be pointed to the address of a running Typerighter service to submit a document and receive matches. To modify this address, change the address passed to the `TyperighterAdapter` in `pages/index.ts`.

To test this plugin in applications that use it before publishing a release, use [`npm link`](https://docs.npmjs.com/cli/link) –
- Run `npm link` in the root of this project
- Run `npm link @guardian/prosemirror-typerighter` in the root of the project that's consuming this package.

## Updating documentation

To update the project readme, edit the README.md in ./build and run `build:doc`. This runs Typedoc and appends the generated type information to the readme file, which is then published to the ./docs folder.

## Commiting and publishing new versions

This repository uses [semantic-release](https://github.com/semantic-release/semantic-release) to publish new versions of this package when PRs are merged to `main`, and prelease versions when code is pushed to `beta`.

Version numbers are determined by the commit history, and so to trigger a release you'll need to use the [commitizen](https://github.com/commitizen-tools/commitizen) format when writing commits.

A pre-commit githook is installed on `npm i` to launch the commitizen tool, which will help you write a well-formed commit message. You can skip this with `ctrl-c` if necessary, but do bear in mind that commits that aren't in this format cannot trigger releases.
