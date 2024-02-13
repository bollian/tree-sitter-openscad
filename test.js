const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { describe, test } = require('node:test');
const Parser = require('tree-sitter');
const OpenScad = require('.');
const assert = require('node:assert').strict;

const openscad_tests_root = 'examples/openscad/tests/data/scad';
const expected_failed_parses = [
  '2D/features/text-search-test.scad',
  '3D/features/polyhedron-nonplanar-tests.scad',
  'customizer/allexpressionscomment.scad',
  'functions/assert-expression-fail1-test.scad',
  'functions/assert-expression-fail2-test.scad',
  'functions/assert-expression-tests.scad',
  'functions/echo-expression-tests.scad',
  'functions/expression-precedence-tests.scad',
  'functions/let-tests.scad',
  'functions/trig-tests.scad',
  'issues/issue1851-each-fail-on-scalar.scad',
  'misc/allexpressions.scad',
  'misc/assert-fail5-test.scad',
  'misc/assert-tests.scad',
  'misc/let-module-tests.scad',
  'misc/nbsp-latin1-test.scad',
  'misc/nbsp-utf8-test.scad',
  'misc/no-break-space-test.scad',
  'misc/parser-tests.scad',
  'misc/scope-assignment-tests.scad',
  'misc/tail-recursion-tests.scad',
  'misc/variable-overwrite.scad',
];
const ignored_examples = [
  'issues/issue1890-comment.scad',
  'issues/issue1890-include.scad',
  'issues/issue1890-string.scad',
  'issues/issue1890-use.scad',
];

test('tree-sitter test', async (_t) => {
  const ts_test = spawn('npx', ['tree-sitter', 'test'], {
    windowsHide: true,
  });
  await new Promise(resolve => ts_test.on('exit', code => {
    assert.strictEqual(code, 0);
    resolve();
  }));
});

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
