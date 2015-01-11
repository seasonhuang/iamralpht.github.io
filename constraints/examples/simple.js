"use strict";

function makeScrollingExample(parentElement, bunching) {
    var parentHeight = parentElement.offsetHeight;
    var context = new MotionContext();
    var solver = context.solver();

    // This is the scroll position; it's the variable that the manipulator
    // changes.
    var scrollPosition = new c.Variable({name: 'scroll-position'});


    for (var i = 0; i < 10; i++) {
        var p = new Box('List Item ' + (i+1));
        // Use cassowary to layout the items in a column. Names are for debugging only.
        p.y = new c.Variable({ name: 'list-item-' + i + '-y' });
        p.bottom = new c.Variable({ name: 'list-item-' + i + '-bottom' });

        // Make items 300px wide.
        p.x = 5;
        p.right = 295;

        // If we're bunching and this is the first item then let it get bigger
        // and smaller...
        if (bunching && i == 0 && false) {
            solver.add(eq(p.y, 0, weak));
            solver.add(eq(p.bottom, scrollPosition, weak, 100));
            solver.add(geq(p.bottom, c.plus(p.y, 40), medium));
            solver.add(leq(p.bottom, c.plus(p.y, 80), medium));
        } else {
            // Make the items 40px tall.
            solver.add(eq(p.bottom, c.plus(p.y, 40), medium));
        }

        // Gap of 10 between items.
        if (i > 0)
            solver.add(eq(p.y, c.plus(scrollPosition, i*50), weak, 100));
        else
            solver.add(eq(p.y, scrollPosition, weak, 100));

        // Bunching. Don't let items go off of the top or bottom.
        if (bunching) {
            // XXX: We should express these bunches in terms of
            //      the previous card, rather than as absolute offsets (i*4).
            solver.add(geq(p.y, i*3, weak, 100));
            solver.add(leq(p.bottom, parentHeight + i * 3 - 9*3, weak, 100));
        }

        context.addBox(p);
        p.element().style.zIndex = 10 - i;
        parentElement.appendChild(p.element());
    }
    // Add some constraints to the first and last item. The first item can't move
    // past the top. The last item can't move up beyond the bottom. These are
    // motion constraints enforced by springs.


    var boxes = context.boxes();
    var firstBox = boxes[0];
    var lastBox = boxes[boxes.length - 1];
    // This prefers the list to be "scrolled" to the top.
    if (!bunching) solver.add(leq(firstBox.y, 0, weak));

    context.addMotionConstraint(
        new MotionConstraint(firstBox.y, '<=', 0, { physicsModel: MotionConstraint.criticallyDamped }));
    context.addMotionConstraint(
        new MotionConstraint(lastBox.bottom, '>=', parentHeight, { physicsModel: MotionConstraint.criticallyDamped }));

    var manip = new Manipulator(scrollPosition, parentElement, 'y');
    context.addManipulator(manip);
}

makeScrollingExample(document.getElementById('scrolling-example'));
makeScrollingExample(document.getElementById('android-notifications'), true);

function makeGravityExample(parentElement) {
    var context = new MotionContext();
    var solver = context.solver();

    var parentHeight = parentElement.offsetHeight;

    var b = new Box('Heavy Box');
    b.y = new c.Variable({name: 'box-y'});
    b.bottom = new c.Variable({name: 'box-bottom'});
    b.x = 0; 
    b.right = 300;
    
    context.addBox(b);

    parentElement.appendChild(b.element());

    solver.add(leq(b.bottom, parentHeight, weak));
    solver.add(eq(b.y, c.plus(b.bottom, -50), medium));

    context.addMotionConstraint(new MotionConstraint(b.bottom, '<=', parentHeight, { captive: true }));

    var manip = new Manipulator(b.y, parentElement, 'y');
    manip.createMotion = function(x, v) {
        var motion = new Gravity(5000, 9999999);
        motion.set(x, v);
        return motion;
    }
    context.addManipulator(manip);
}
makeGravityExample(document.getElementById('gravity-example'));
