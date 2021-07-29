empty = function(x) x;
echo(lazy = function(y) empty(y));
echo(eager = (function(z) empty)(4));