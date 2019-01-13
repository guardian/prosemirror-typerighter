# prosemirror-typerighter ![](https://travis-ci.org/guardian/prosemirror-typerighter.svg?branch=master) [![Coverage Status](https://coveralls.io/repos/github/guardian/prosemirror-typerighter/badge.svg?branch=master)](https://coveralls.io/github/guardian/prosemirror-typerighter?branch=master)
This Prosemirror plugin adds the ability to validate a document by sending it, or some parts of it, to an external service for validation. Once instantiated, it provides a store object that allows consumer code to subscribe to state updates for UI updates etc.

It's still in its early stages - see the 'pages' directory for an example implementation.

Short-term roadmap:
- [Plugin] -- Toggling realtime validation.
- [UI] -- Grouping validations and applying grouped validations simultaneously.


