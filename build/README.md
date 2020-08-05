![](https://travis-ci.org/guardian/prosemirror-typerighter.svg?branch=master) [![Coverage Status](https://coveralls.io/repos/github/guardian/prosemirror-typerighter/badge.svg?branch=master)](https://coveralls.io/github/guardian/prosemirror-typerighter?branch=master)

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

## Publishing new versions

To publish, you'll need to have an account on [NPM](https://www.npmjs.com/) and be a member of the [Guardian organisation](https://www.npmjs.com/org/guardian).

Before publishing, ensure your feature branch has been tagged with the [correct new version number](https://semver.org/) and merged to master. One easy way to achieve this is with npm via `npm version major | minor | patch`.

Once you're ready to publish a new release, running `npm publish` will build the application, generate its type declarations, and publish.


