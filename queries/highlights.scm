; Includes

"include" @include

(include_path) @string

; Functions

(function_call function: (identifier) @function (#set! "priority" 105))
(module_call name: (identifier) @function (#set! "priority" 105))

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

; Builtins

((identifier) @function.builtin
			  (#any-of? @function.builtin
			   "union"
			   "difference"
			   "intersection"
			   "circle"
			   "square"
			   "polygon"
			   "text"
			   "import"
			   "projection"
			   "sphere"
			   "cube"
			   "cylinder"
			   "polyhedron"
			   "linear_extrude"
			   "rotate_extrude"
			   "surface"
			   "translate"
			   "rotate"
			   "scale"
			   "resize"
			   "mirror"
			   "multmatrix"
			   "color"
			   "offset"
			   "hull"
			   "minkowski"
			   ))

((identifier) @identifier
			  (#eq? @identifier "PI")) @constant.builtin

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
