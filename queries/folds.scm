; Code folding for OpenSCAD
; https://tree-sitter.github.io/tree-sitter/using-parsers#fold-query

; Module declarations
(module_declaration) @fold

; Function declarations  
(function_declaration) @fold

; Control flow blocks
(for_block) @fold
(intersection_for_block) @fold
(if_block) @fold
(let_block) @fold
(assign_block) @fold

; Brace blocks (union)
(union_block) @fold

; Lists and arrays
(list) @fold

; Function expressions
(function) @fold

; Multi-line comments (block comments only)
(comment) @fold

; Arguments and parameters
(arguments) @fold
(parameters_declaration) @fold
