thing = [for () 5];
thing2 = [for (i = [1:2:5]) each [i, i * 2]];
thing3 = [for (i = 1; i <= 5; i = i + 2) each [i, i * 2]];
echo(thing2);
echo(thing3);