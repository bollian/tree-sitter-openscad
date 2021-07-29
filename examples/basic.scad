use <other.scad>;
include <ot
her.scad>;

/*[Customizer Description]*/
/* multiline
comment */
// single-line comment
module some_object(hello, another = .4, another2 = "my name is charles") {
    my_variable = 3.4;
    escaped_string = "l
    kjlkj\"lkjlkj";
    my_range = [0.5:-1:20];
    color([0.5, 1, 1]) cylinder(0.5, h=5.0, some_function());
    for (i = [1:2:5]) {
        cylinder(2, r = 0.5);
    }
    for (i = [1, 2, 3]) {
        cylinder(2, r = 0.5);
    }
    if (true) {

    }
}
