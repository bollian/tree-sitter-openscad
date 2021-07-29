function my_function(x = 1) = x;

module my_cylinder(r = my_function())
    cylinder();

my_cylinder();