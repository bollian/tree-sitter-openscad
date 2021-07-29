$fn = 100;

cylinder();
translate([2, 0, 0]) cylinder();
# translate([4, 0, 0]) cylinder();
% translate([6, 0, 0]) cylinder();
* translate([8, 0, 0]) cylinder();

for (i = [1:3]);