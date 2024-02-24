## Version 0.5.1

Bugfixes:
- allow trailing commas in module and function invocations (8af3261)

## Version 0.5.0

Features / Behavior Changes:
- different float and decimal (integer) nodes, now under supertype number
- expressions now have a public supertype node, called expression
- literals now have a public supertype node, called literal
- special variables (e.g. $preview) now use an inner identifier node to store their name
- function parameters now have their own node type to support certain syntax
  highlighting patterns

Bugfixes:
- stopped accepting backslash line continuations
