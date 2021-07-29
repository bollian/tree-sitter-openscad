function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)))
}

function commaSep(rule) {
  return optional(commaSep1(rule))
}

function parens(rule) {
  return seq('(', rule, ')')
}

function brackets(rule) {
  return seq('[', rule, ']')
}

function curlies(rule) {
  return seq('{', rule, '}')
}

function bodied_block(keyword, effect, block) {
  return seq(keyword, effect, field('body', block))
}

function binary_operator(operator, rule) {
  return seq(field('left', rule), operator, field('right', rule))
}

const identifier_pattern = /[a-zA-Z_]\w*/;

const rules = {
  source_file: $ => repeat(choice($._include_statement, $._item)),

  // comments
  comment: $ => choice($._single_line_comment, $._block_comment),
  _single_line_comment: $ => /\/\/[^\n]*/,
  _block_comment: $ => seq('/*', repeat(choice(/[^*\[]|\*[^/]/, $.customizer_group)), '*/'),
  customizer_group: $ => /\[[^\]]*\]/,

  // use/include statements
  // these are called statements, but aren't included in $._statement because
  // they can't be used in all the same places as other statements
  _include_statement: $ => choice($.use_statement, $.include_statement),
  use_statement: $ => seq('use', $.include_path, ';'),
  include_statement: $ => seq('include', $.include_path, ';'),
  include_path: $ => token(seq('<', repeat(/[^>]/), '>')),

  // modules
  module_declaration: $ => seq(
    'module',
    field('name', $.identifier),
    field('parameters', $.parameters_declaration),
    field('body', $._statement),
  ),
  parameters_declaration: $ => seq('(', commaSep($.parameter_declaration), ')'),
  parameter_declaration: $ => seq($.identifier, optional(seq('=', $._literal))),

  // function declarations
  function_declaration: $ => seq(
    'function',
    field('name', $.identifier),
    field('parameters', $.parameters_declaration),
    '=', $._expression
  ),

  _item: $ => choice(
    ';',
    seq($.assignment, ';'),
    $._statement,
    $.comment,
    $.module_declaration,
    $.function_declaration,
  ),

  // statements are language constructs that can create objects
  _statement: $ => choice(
    $.for_block,
    $.intersection_for_block,
    $.if_block,
    $.let_block,
    $.assign_block,
    $.union_block,
    $.transform_chain,
    seq($.module_call, ';'),
  ),
  assignment: $ => seq(
    field('left', choice($.identifier, $.special_variable)),
    '=',
    field('right', $._expression)
  ),
  union_block: $ => curlies(repeat($._item)),

  // control-flow blocks
  for_block: $ => bodied_block(
    'for',
    $.parenthesized_assignments,
    $._statement
  ),
  intersection_for_block: $ => bodied_block(
    'intersection_for',
    $.parenthesized_assignments,
    $._statement
  ),
  let_block: $ => bodied_block(
    'let',
    $.parenthesized_assignments,
    $._statement
  ),
  assign_block: $ => bodied_block(
    'assign',
    $.parenthesized_assignments,
    $._statement
  ),
  if_block: $ => prec.right(seq(
    'if',
    field('condition', $.parenthesized_expression),
    field('consequence', $._statement),
    optional(field('alternative', seq('else', $._statement)))
  )),

  // function calls
  modifier_chain: $ => seq($.modifier, $._statement),
  modifier: $ => choice('*', '!', '#', '%'),
  transform_chain: $ => seq($.transform, $._statement),
  transform: $ => seq($.identifier, $.arguments),
  module_call: $ => seq($.identifier, $.arguments),
  arguments: $ => parens(commaSep(choice($._expression, $.assignment))),

  parenthesized_assignments: $ => parens(commaSep($.assignment)),
  parenthesized_expression: $ => parens($._expression),
  condition_update_clause: $ => parens(seq(
    field('initializer', commaSep($.assignment)), ';',
    field('condition', $._expression), ';',
    field('update', commaSep($.assignment)),
  )),

  // expressions are syntax trees that result in values (not objects)
  _expression: $ => choice(
    $.parenthesized_expression,
    $.unary_expression,
    $.binary_expression,
    $.ternary_expression,
    $.let_expression,
    $.function_call,
    $.index_expression,
    $.dot_index_expression,
    $._literal,
    $.identifier,
    $.special_variable,
  ),
  let_expression: $ => bodied_block('let', $.parenthesized_assignments, $._expression),

  // valid names for variables, functions, and modules
  identifier: $ => identifier_pattern,
  special_variable: $ => token(seq('$', identifier_pattern)),

  // atoms that create immediate values
  _literal: $ => choice(
    $.string,
    $.number,
    $.boolean,
    $.function,
    $.range,
    $.vector,
    $.list_comprehension,
  ),
  string: $ => token(seq('"', repeat(choice(/[^"]/, '\\"')), '"')),
  number: $ => /\d+\.\d*|\.\d+|\d+/,
  boolean: $ => choice('true', 'false'),

  // compound atoms that are still literals
  function: $ => seq(
    'function',
    field('parameters', $.parameters_declaration),
    field('body', $._expression),
  ),
  range: $ => brackets(seq(
    field('start', $._expression),
    optional(seq(':', field('increment', $._expression))),
    ':', field('end', $._expression),
  )),

  vector: $ => brackets(commaSep($._vector_cell)),
  _vector_cell: $ => choice($._expression, $.each),
  each: $ => seq('each', $._literal),

  list_comprehension: $ => brackets(seq(
    $.for_clause,
    choice($.if_clause, $._vector_cell),
  )),
  for_clause: $ => seq('for', choice($.parenthesized_assignments, $.condition_update_clause)),
  if_clause: $ => seq(
    'if',
    field('condition', $.parenthesized_expression),
    field('consequence', $._vector_cell),
    optional(
      seq('else', field('alternative', choice($._vector_cell, $.if_clause)))
    )
  ),

  // operations on expressions
  function_call: $ => prec(10, seq(field('function', $._expression), field('arguments', $.arguments))),
  index_expression: $ => prec(10, seq(
    field('value', $._expression),
    brackets(field('index', $._expression))
  )),
  dot_index_expression: $ => prec(10, seq($._expression, '.', $.identifier)),
  unary_expression: $ => choice(
    prec(9, seq('!', $._expression)),
    prec.left(6, seq('-', $._expression)),
    prec.left(6, seq('+', $._expression)),
  ),
  binary_expression: $ => choice(
    prec.left(2, binary_operator('||', $._expression)),
    prec.left(3, binary_operator('&&', $._expression)),
    prec.left(4, binary_operator('==', $._expression)),
    prec.left(4, binary_operator('!=', $._expression)),
    prec.left(5, binary_operator('<', $._expression)),
    prec.left(5, binary_operator('>', $._expression)),
    prec.left(5, binary_operator('<=', $._expression)),
    prec.left(5, binary_operator('>=', $._expression)),
    prec.left(6, binary_operator('+', $._expression)),
    prec.left(6, binary_operator('-', $._expression)),
    prec.left(7, binary_operator('*', $._expression)),
    prec.left(7, binary_operator('/', $._expression)),
    prec.left(7, binary_operator('%', $._expression)),
    prec.left(8, binary_operator('^', $._expression)),
  ),
  ternary_expression: $ => prec.right(1, seq(
    field('condition', $._expression), '?',
    field('consequence', $._expression), ':',
    field('alternative', $._expression)
  )),
};

module.exports = grammar({
  name: 'openscad',
  word: $ => $.identifier,
  supertypes: $ => [$._literal, $._expression, $._include_statement],
  rules: rules,
});
