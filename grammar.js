function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)))
}

function commaSep(rule) {
  return optional(commaSep1(rule))
}

function opt_grouping(grouping, rule) {
  return choice(grouping(rule), rule)
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
  source_file: $ => repeat(choice($.use_statement, $._item)),

  // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
  comment: $ => token(choice(
    seq('//', /(\\(.|\r?\n)|[^\\\n])*/),
    seq(
      '/*',
      /[^*]*\*+([^/*][^*]*\*+)*/,
      '/'
    )
  )),

  _item: $ => choice(
    seq($.assignment, ';'),
    $._statement,
    $.module_declaration,
    $.function_declaration,
  ),

  // modules
  module_declaration: $ => seq(
    'module',
    field('name', $.identifier),
    field('parameters', $.parameters_declaration),
    field('body', $._statement),
  ),
  parameters_declaration: $ => parens(seq(commaSep($._parameter_declaration), optional(','))),
  _parameter_declaration: $ => choice($._variable_name, $.assignment),

  // function declarations are slightly different from $.function, which is for
  // function literals
  function_declaration: $ => seq(
    'function',
    field('name', $.identifier),
    field('parameters', $.parameters_declaration),
    '=', $._expression
  ),

  // statements are language constructs that can create objects
  _statement: $ => choice(
    $.for_block,
    $.intersection_for_block,
    $.if_block,
    $.let_block,
    $.assign_block,
    $.union_block,
    $.modifier_chain,
    $.transform_chain,
    $.include_statement,
    ';',
  ),
  // use/include statements
  // These are called statements, but use statements aren't included in
  // $._statement because they can't be used in all the same places as other
  // statements
  include_statement: $ => seq('include', $.include_path),
  use_statement: $ => seq('use', $.include_path),
  include_path: $ => /<[^>]*>/,
  assignment: $ => seq(
    field('left', $._variable_name),
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
  transform_chain: $ => seq($.module_call, $._statement),
  module_call: $ => seq(
    field('name', $.identifier),
    field('arguments', $.arguments),
  ),
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
    $._variable_name,
  ),
  let_expression: $ => bodied_block('let', $.parenthesized_assignments, $._expression),

  // valid names for variables, functions, and modules
  identifier: $ => identifier_pattern,
  special_variable: $ => token(seq('$', identifier_pattern)),
  _variable_name: $ => choice($.identifier, $.special_variable),

  // atoms that create immediate values
  _literal: $ => choice(
    $.string,
    $.number,
    $.boolean,
    $.undef,
    $.function,
    $.range,
    $.list,
  ),
  string: $ => token(seq('"', repeat(choice(/[^"]/, '\\"')), '"')),
  number: $ => seq(/\d+\.\d*|\.\d+|\d+/, optional(/e-?\d+/)),
  boolean: $ => choice('true', 'false'),
  undef: $ => 'undef',

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

  list: $ => brackets(seq(commaSep($._list_cell), optional(','))),
  _list_cell: $ => choice($._expression, $.each, $.list_comprehension),
  _comprehension_cell: $ => choice(
    $._expression,
    opt_grouping(parens, $.each),
    opt_grouping(parens, $.list_comprehension)
  ),
  each: $ => seq('each', $._literal),

  list_comprehension: $ => seq(
    choice($.for_clause, $.if_clause)
  ),
  for_clause: $ => seq('for',
    choice($.parenthesized_assignments, $.condition_update_clause),
    $._comprehension_cell
  ),
  if_clause: $ => prec.right(seq(
    'if',
    field('condition', $.parenthesized_expression),
    field('consequence', $._comprehension_cell),
    optional(
      seq('else', field('alternative', $._comprehension_cell))
    )
  )),

  // operations on expressions
  function_call: $ => prec(10, seq(field('function', $._expression), field('arguments', $.arguments))),
  index_expression: $ => prec(10, seq(
    field('value', $._expression),
    brackets(field('index', $._expression))
  )),
  dot_index_expression: $ => prec(10, seq(
    field('value', $._expression), '.',
    field('index', $.identifier)
  )),
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
  supertypes: $ => [$._literal, $._expression],
  extras: $ => [
    /\s|\\\r?\n/,
    $.comment
  ],
  rules: rules,
});
