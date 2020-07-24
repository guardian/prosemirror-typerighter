# prosemirror-typerighter ![](https://travis-ci.org/guardian/prosemirror-typerighter.svg?branch=master) [![Coverage Status](https://coveralls.io/repos/github/guardian/prosemirror-typerighter/badge.svg?branch=master)](https://coveralls.io/github/guardian/prosemirror-typerighter?branch=master)
This Prosemirror plugin adds the ability to validate a document by sending it, or some parts of it, to an external service for validation. Once instantiated, it provides a store object that allows consumer code to subscribe to state updates for UI updates etc.

It's still in its early stages! [There's a demo here.](https://guardian.github.io/prosemirror-typerighter/) See the 'pages' directory for an example implementation.

## Installation

`npm i` will install dependencies.

## Development

`npm run watch` builds the project locally, watches for file changes, and serves the project locally at http://localhost:5000.

The plugin must be pointed to the address of a running Typerighter service to submit a document and receive matches. To modify, change the address passed to the `TyperighterAdapter` in `pages/index.ts`.

## Publishing new versions

To publish, you'll need to have an account on [NPM](https://www.npmjs.com/) and be a member of the [Guardian organisation](https://www.npmjs.com/org/guardian).

Before publishing, ensure your feature branch has been tagged with the [correct new version number](https://semver.org/) and merged to master. One easy way to achieve this is with npm via `npm version major | minor | patch`.

Once you're ready to publish a new release, running `npm publish` will build the application, generate its type declarations, and publish.


