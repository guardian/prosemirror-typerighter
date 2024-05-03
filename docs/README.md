[@guardian/prosemirror-typerighter](README.md) › [Globals](globals.md)

# @guardian/prosemirror-typerighter

![](https://travis-ci.org/guardian/prosemirror-typerighter.svg?branch=main) [![Coverage Status](https://coveralls.io/repos/github/guardian/prosemirror-typerighter/badge.svg?branch=main)](https://coveralls.io/github/guardian/prosemirror-typerighter?branch=main)

This Prosemirror plugin adds the ability to validate a document by sending it, or some parts of it, to an external service for validation, and providing an interface to review suggestions and apply changes.

## Installation

1. Ensure that you are using the Node version specified in `.nvmrc` – for example, if you are using `nvm`, run `nvm use`.
2. Install dependencies with `./setup.sh` (you may need to enter your password to restart nginx).

## Development

`npm run watch` builds the project locally, watches for file changes, and serves the project locally at https://prosemirror-typerighter.local.dev-gutools.co.uk/ – or http://localhost:5000, if your Typerighter service doesn't require [pan-domain authentication](https://github.com/guardian/pan-domain-authentication).

If your Typerighter service does require pan-domain authentication, you will need to run and visit another .local.dev-gutools application alongside this service to supply an authenticated cookie for that domain.

The plugin must be pointed to the address of a running Typerighter service to submit a document and receive matches. To modify this address, change the address passed to the `TyperighterAdapter` in `pages/index.ts`.

## Testing locally in applications that use `prosemirror-typerighter`

We've found `yalc` useful in testing local changes to prosemirror-typerighter in applications that use it.

Setup: 

1. Install `yalc` globally with `npm i yalc -g` or `yarn global add yalc`.
2. Run `npm run yalc` in your local project from your current branch in prosemirror-typerighter, to build the project and push changes to yalc.
3. Run `yalc add @guardian/prosemirror-typerighter` within the project consuming prosemirror-typerighter locally e.g. in the Composer subdirectory of `flexible-content`.

Note: any changes you make to your local prosemirror-typerighter branch must be republished (step 3). Don't forget to run `npm run yalc` again!

## Updating documentation

To update the project readme, edit the README.md in ./build and run `build:doc`. This runs Typedoc and appends the generated type information to the readme file, which is then published to the ./docs folder.

## Commiting and publishing new versions

This repository uses [semantic-release](https://github.com/semantic-release/semantic-release) to publish new versions of this package when PRs are merged to `main`, and prelease versions when code is pushed to `beta`.

Version numbers are determined by the commit history, and so to trigger a release you'll need to use the [commitizen](https://github.com/commitizen-tools/commitizen) format when writing commits.

A pre-commit githook is installed on `npm i` to launch the commitizen tool, which will help you write a well-formed commit message. You can skip this with `ctrl-c` if necessary, but do bear in mind that commits that aren't in this format cannot trigger releases.
