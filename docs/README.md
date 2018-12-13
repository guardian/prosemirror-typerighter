
prosemirror-typerighter
=======================

This Prosemirror plugin adds the ability to validate a document by sending it, or some parts of it, to an external service for validation. It provides a store object that allows consumer code to subscribe to state updates for UI updates etc.

It's still in its early stages - [see a demo here](https://guardian.github.io/prosemirror-typerighter/) with an example UI and validation adapter.

Roadmap:

*   ~~Adding a 'debug' flag to turn off debug marks, which currently signify dirty ranges and inflight ranges. This is handy when observing the expansion strategy at work during realtime validation.~~
*   ~~Validating whole documents in one pass via a command.~~
*   Health work - this project was created during a hack week and there are still a few bugs and some technical debt to work out.
*   Toggling realtime validation.
*   Grouping validations and applying grouped validations simultaneously.

## Index

### External modules

* ["index"](modules/_index_.md)

---

