// Separating Axis Theorem: Circle object
ig.module(
    'plugins.sat.circle'
)

    .requires(
    'plugins.sat.vector'
)

    .defines(function(){
        ig.global.Circle = ig.Class.extend({
            pos: null, // {Vector} representing the center of the circle
            r: null, // The radius of the circle
            /**
             * Initialize a circle
             * @param pos A vector representing the position of the center of the circle
             * @param r The radius of the circle
             */
            init: function( pos, r ){
                this.pos = pos || new ig.global.Vector();
                this.r = r || 0;
            }
        })
    });