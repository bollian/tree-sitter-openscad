function side_effect(x) =
    echo(str("side effect ", x));
function truthy(x) =
    side_effect(x) == undef;

var = truthy(0) ? truthy(1) : truthy(2) ? truthy(3) : truthy(4);