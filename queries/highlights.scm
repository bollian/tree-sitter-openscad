; Includes

"include" @include

(include_path) @string

; Functions

(function_call function: (identifier) @function)
(module_call name: (identifier) @function)

; Variables

(identifier) @variable

(special_variable) @variable.builtin

; TODO: Types/Properties/

; Keywords

[
  "module"
  "function"
  "let"
  "assign"
  "use"
  "each"
] @keyword

; Operators

[
  "||"
  "&&"
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "+"
  "-"
  "*"
  "/"
  "%"
  "^"
  "!"
  ":"
] @operator

; Conditionals

[
  "if"
  "else"
] @conditional

(ternary_expression
  ["?" ":"] @conditional.ternary)

; Repeats

[
  "for"
  "intersection_for"
] @repeat

; Literals

(decimal) @number

(float) @float

(string) @string

(boolean) @boolean

; Misc

[
  "#"
] @punctuation.special

["{" "}"] @punctuation.bracket

["(" ")"] @punctuation.bracket

["[" "]"] @punctuation.bracket

[
  ";"
  ","
  "."
] @punctuation.delimiter

; Comments

(comment) @comment @spell
