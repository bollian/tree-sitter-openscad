const fs = require('node:fs');
const path = require('node:path');
const { describe, test } = require('node:test');
const Parser = require('tree-sitter');
const OpenScad = require('.');
const assert = require('node:assert').strict;

const openscad_tests_root = path.join('examples', 'openscad', 'tests', 'data', 'scad');
const expected_failed_parses = [
  path.join('2D', 'features', 'text-search-test.scad'),
  path.join('3D', 'features', 'polyhedron-nonplanar-tests.scad'),
  path.join('customizer', 'allexpressionscomment.scad'),
  path.join('functions', 'assert-expression-fail1-test.scad'),
  path.join('functions', 'assert-expression-fail2-test.scad'),
  path.join('functions', 'assert-expression-tests.scad'),
  path.join('functions', 'echo-expression-tests.scad'),
  path.join('functions', 'expression-precedence-tests.scad'),
  path.join('functions', 'let-tests.scad'),
  path.join('functions', 'trig-tests.scad'),
  path.join('issues', 'issue1851-each-fail-on-scalar.scad'),
  path.join('misc', 'allexpressions.scad'),
  path.join('misc', 'assert-fail5-test.scad'),
  path.join('misc', 'assert-tests.scad'),
  path.join('misc', 'let-module-tests.scad'),
  path.join('misc', 'nbsp-latin1-test.scad'),
  path.join('misc', 'nbsp-utf8-test.scad'),
  path.join('misc', 'no-break-space-test.scad'),
  path.join('misc', 'parser-tests.scad'),
  path.join('misc', 'scope-assignment-tests.scad'),
  path.join('misc', 'tail-recursion-tests.scad'),
  path.join('misc', 'variable-overwrite.scad'),
];
const ignored_examples = [
  path.join('issues', 'issue1890-comment.scad'),
  path.join('issues', 'issue1890-include.scad'),
  path.join('issues', 'issue1890-string.scad'),
  path.join('issues', 'issue1890-use.scad'),
];

describe('Upstream OpenSCAD test samples', () => {
  const parser = new Parser();
  parser.setLanguage(OpenScad);

  const available_files = fs.readdirSync(openscad_tests_root, { recursive: true })
    .filter(fpath => fpath.endsWith('.scad'));

  for (scad_file of available_files) {
    const full_path = path.join(openscad_tests_root, scad_file);

    const f_index = expected_failed_parses.indexOf(scad_file);
    const i_index = ignored_examples.indexOf(scad_file);
    const failing = f_index > -1;
    const ignored = i_index > -1;

    test('Parse ' + scad_file, { todo: failing, skip: ignored }, _t => {
      const buffer = fs.readFileSync(full_path);
      const tree = parser.parse(buffer.toString());
      assert(!tree.rootNode.hasError());
    });

    // track which ignore/fail rules actually get used
    if (failing) {
      expected_failed_parses.splice(f_index, 1);
    }
    if (ignored) {
      ignored_examples.splice(i_index, 1);
    }
  }

  // Make sure we aren't ignoring any non-existant examples. This will be useful
  // if examples are removed from the openscad repository after updating.
  // Otherwise, our ignore lists might fill up with unneeded ignores over time.
  assert.strictEqual(expected_failed_parses.length, 0);
  assert.strictEqual(ignored_examples.length, 0);
});
