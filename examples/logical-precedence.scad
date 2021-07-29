function side_effect(x) =
    echo(str("side effect ", x));
function truthy_effect(x) =
    side_effect(x) == undef;

bool = true;
int1 = 4;
int2 = 5;
echo(int1 + int2 && bool);
echo(bool && int1 + int2);
echo(side_effect(1) && side_effect(2) || side_effect(3));
echo(truthy_effect(1) || side_effect(2) && side_effect(3));