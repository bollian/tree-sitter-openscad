# tree-sitter-openscad

OpenSCAD grammar for the tree-sitter parsing library

## Developer quickstart

Most development of tree-sitter parsers is done using nodejs and npm. You can find the instructions on how to set that up here: https://tree-sitter.github.io/tree-sitter/creating-parsers

The TLDR would be:

1. Install `npm` (there are many ways, pick your poison)
2. From the source directory, run `npm install` to get all the dependencies
3. `export PATH=$PATH:./node_modules/.bin` to get the `tree-sitter` CLI command
4. `tree-sitter generate` to build your changes
5. `tree-sitter test` to make sure you didn't unintentionally break any of the existing test cases
6. Add a new test case covering your change (instructions here: https://tree-sitter.github.io/tree-sitter/creating-parsers#command-test)

