/* eslint-disable arrow-parens */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/**
 * Creates a rule to match one or more of the rules separated by the separator
 * and optionally adds a trailing separator (default is false).
 *
 * @param {Rule} rule
 * @param {string} separator - The separator to use.
 * @param {boolean?} trailing_separator - The trailing separator to use.
 *
 * @return {SeqRule}
 *
 */
const listSeq = (rule, separator, trailing_separator = false) =>
  trailing_separator ?
    seq(rule, repeat(seq(separator, rule)), optional(separator)) :
    seq(rule, repeat(seq(separator, rule)));

/**
 * Creates a rule to match one or more of the rules separated by a comma
 * and optionally adds a trailing separator (default is false).
 *
 * @param {Rule} rule
 * @param {boolean?} trailing_separator - The trailing separator to use.
 *
 * @return {SeqRule}
 *
 */
function commaSep1(rule, trailing_separator = false) {
  // return seq(rule, repeat(seq(',', rule)))
  return listSeq(rule, ',', trailing_separator);
}

/**
 * Creates a rule to optionally match one or more of the rules separated
 * by a comma and optionally adds a trailing separator (default is false).
 *
 * @param {Rule} rule
 * @param {boolean?} trailing_separator - The trailing separator to use.
 *
 * @return {ChoiceRule}
 *
 */
function commaSep(rule, trailing_separator = false) {
  return optional(commaSep1(rule, trailing_separator));
}

/**
 * This callback should take a rule and places it in between a group (e.g. parentheses).
 * @callback GroupingCallback
 * @param {Rule} rule
 *
 * @return {SeqRule}
 */

/**
 * Creates a rule that accepts another rule with optional grouping symbols.
 *
 * @param {GroupingCallback} grouping
 * @param {Rule} rule
 *
 * @return {ChoiceRule}
 */
function opt_grouping(grouping, rule) {
  return choice(grouping(rule), rule);
}

/**
 * Creates a rule to match a rule surrounded by parentheses.
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 */
function parens(rule) {
  return seq('(', rule, ')');
}

/**
 * Creates a rule to match a rule surrounded by brackets.
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 */
function brackets(rule) {
  return seq('[', rule, ']');
}

/**
 * Creates a rule to match a rule surrounded by curly brackets.
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 */
function curlies(rule) {
  return seq('{', rule, '}');
}

/**
 * Creates a rule that matches a keyword followed by its "effect",
 * and then a block.
 *
 * @param {String} keyword
 * @param {Rule} effect
 * @param {Rule} block
 *
 * @return {SeqRule}
 */
function bodied_block(keyword, effect, block) {
  return seq(keyword, effect, field('body', block));
}

/**
 * Creates a rule that matches a binary operator in between two rules.
 * The two rules are then assigned field names left and right respectively.
 *
 * @param {String} operator
 * @param {Rule} rule
 *
 * @return {SeqRule}
 */
function binary_operator(operator, rule) {
  return seq(field('left', rule), operator, field('right', rule));
}

module.exports = grammar({
  name: 'openscad',

  extras: $ => [
    $.comment,
    /\s/,
  ],

  supertypes: $ => [
    $.literal,
    $.expression,
    $.number,
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat(choice($.use_statement, $._item)),

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
    // TODO: segment assigment so that parameters can have the LHS highlighted as @parameter
    // and the RHS as either @variable or @constant
    _parameter_declaration: $ => choice(alias($._variable_name, $.parameter), $.assignment),

    // function declarations are slightly different from $.function, which is for
    // function literals
    function_declaration: $ => seq(
      'function',
      field('name', $.identifier),
      field('parameters', $.parameters_declaration),
      '=', $.expression,
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
      $.assert_statement,
      ';',
    ),

    // use/include statements
    // These are called statements, but use statements aren't included in
    // $._statement because they can't be used in all the same places as other
    // statements
    include_statement: $ => seq('include', $.include_path),
    use_statement: $ => seq('use', $.include_path),
    include_path: _ => /<[^>]*>/,
    assignment: $ => seq(
      field('left', $._variable_name),
      '=',
      field('right', $.expression),
    ),
    union_block: $ => curlies(repeat($._item)),

    // control-flow blocks
    for_block: $ => bodied_block(
      'for',
      $.parenthesized_assignments,
      $._statement,
    ),
    intersection_for_block: $ => bodied_block(
      'intersection_for',
      $.parenthesized_assignments,
      $._statement,
    ),
    let_block: $ => bodied_block(
      'let',
      $.parenthesized_assignments,
      $._statement,
    ),
    assign_block: $ => bodied_block(
      'assign',
      $.parenthesized_assignments,
      $._statement,
    ),
    if_block: $ => prec.right(seq(
      'if',
      field('condition', $.parenthesized_expression),
      field('consequence', $._statement),
      optional(field('alternative', seq('else', $._statement))),
    )),

    // function calls
    modifier_chain: $ => seq($.modifier, $._statement),
    modifier: _ => choice('*', '!', '#', '%'),
    transform_chain: $ => seq($.module_call, $._statement),
    module_call: $ => seq(
      field('name', $.identifier),
      field('arguments', $.arguments),
    ),
    arguments: $ => parens(commaSep(choice($.expression, $.assignment), true)),

    parenthesized_assignments: $ => parens(commaSep($.assignment)),
    parenthesized_expression: $ => parens($.expression),
    condition_update_clause: $ => parens(seq(
      field('initializer', commaSep($.assignment)), ';',
      field('condition', $.expression), ';',
      field('update', commaSep($.assignment)),
    )),

    // expressions are syntax trees that result in values (not objects)
    expression: $ => choice(
      $.parenthesized_expression,
      $.unary_expression,
      $.binary_expression,
      $.ternary_expression,
      $.let_expression,
      $.function_call,
      $.index_expression,
      $.dot_index_expression,
      $.assert_expression,
      $.literal,
      $._variable_name,
    ),
    let_expression: $ => bodied_block('let', $.parenthesized_assignments, $.expression),

    // atoms that create immediate values
    literal: $ => choice(
      $.string,
      $.number,
      $.boolean,
      $.undef,
      $.function,
      $.range,
      $.list,
    ),

    // compound atoms that are still literals
    function: $ => seq(
      'function',
      field('parameters', $.parameters_declaration),
      field('body', $.expression),
    ),
    range: $ => brackets(seq(
      field('start', $.expression),
      optional(seq(':', field('increment', $.expression))),
      ':', field('end', $.expression),
    )),

    list: $ => brackets(seq(commaSep($._list_cell, true))),
    _list_cell: $ => choice($.expression, $.each, $.list_comprehension),
    _comprehension_cell: $ => choice(
      $.expression,
      opt_grouping(parens, $.each),
      opt_grouping(parens, $.list_comprehension),
    ),
    each: $ => seq('each', choice($.expression, $.list_comprehension)),

    list_comprehension: $ => seq(
      choice($.for_clause, $.if_clause),
    ),
    for_clause: $ => seq('for',
      choice($.parenthesized_assignments, $.condition_update_clause),
      $._comprehension_cell,
    ),
    if_clause: $ => prec.right(seq(
      'if',
      field('condition', $.parenthesized_expression),
      field('consequence', $._comprehension_cell),
      optional(
        seq('else', field('alternative', $._comprehension_cell)),
      ),
    )),

    // operations on expressions
    function_call: $ => prec(10,
      seq(
        field('function', $.expression),
        field('arguments', $.arguments),
      )),
    index_expression: $ => prec(10, seq(
      field('value', $.expression),
      brackets(field('index', $.expression)),
    )),
    dot_index_expression: $ => prec(10, seq(
      field('value', $.expression), '.',
      field('index', $.identifier),
    )),
    unary_expression: $ => choice(
      prec(9, seq('!', $.expression)),
      prec.left(6, seq('-', $.expression)),
      prec.left(6, seq('+', $.expression)),
    ),
    binary_expression: $ => choice(
      prec.left(2, binary_operator('||', $.expression)),
      prec.left(3, binary_operator('&&', $.expression)),
      prec.left(4, binary_operator('==', $.expression)),
      prec.left(4, binary_operator('!=', $.expression)),
      prec.left(5, binary_operator('<', $.expression)),
      prec.left(5, binary_operator('>', $.expression)),
      prec.left(5, binary_operator('<=', $.expression)),
      prec.left(5, binary_operator('>=', $.expression)),
      prec.left(6, binary_operator('+', $.expression)),
      prec.left(6, binary_operator('-', $.expression)),
      prec.left(7, binary_operator('*', $.expression)),
      prec.left(7, binary_operator('/', $.expression)),
      prec.left(7, binary_operator('%', $.expression)),
      prec.left(8, binary_operator('^', $.expression)),
    ),
    ternary_expression: $ => prec.right(1, seq(
      field('condition', $.expression), '?',
      field('consequence', $.expression), ':',
      field('alternative', $.expression),
    )),

    // Asserts are unusual in that they can be inserted into both statements and
    // expressions. We want to treat these two cases differently: assertions in
    // the middle of a statement can only be followed by a statement, and the
    // same applies to expressions. So, this creates two parsers for the two
    // distinct conditions, but uses a shared parser for the text of the assert
    // clause itself.
    _assert_clause: $ => seq('assert', parens(
      optional(seq(field('condition', $.expression),
        optional(seq(',', field('message', $.expression),
          optional(seq(',', field('trailing_args', commaSep1($.expression)))),
        )),
      )),
    )),
    assert_statement: $ => seq($._assert_clause, $._statement),
    assert_expression: $ => seq($._assert_clause, $.expression),

    // valid names for variables, functions, and modules
    identifier: _ => /[a-zA-Z_]\w*/,
    special_variable: $ => seq('$', $.identifier),
    _variable_name: $ => choice($.identifier, $.special_variable),

    string: _ => token(seq('"', repeat(choice(/[^"]/, '\\"')), '"')),
    number: $ => choice($.decimal, $.float),
    decimal: _ => token(/-?\d+/),
    float: _ => token(/-?(\d+(\.\d+)?|\.\d+)(e-?\d+)?/),
    boolean: _ => choice('true', 'false'),
    undef: _ => 'undef',

    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: _ => token(choice(
      seq('//', /(\\(.|\r?\n)|[^\\\n])*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/',
      ),
    )),
  },
});
