ig.module('plugins.sat.response')
    .defines(function(){
        ig.global.Response = ig.Class.extend({
            a: null,
            b: null,
            overlapN: null,
            overlapV: null,
            /**
             * An object representing the result of an intersection. Contains information about:
             *  - The two objects participating in the intersection
             *  - The vector representing the minimum change necessary to extract the first object
             *  - Whether the first object is entirely inside the second, or vice versa
             */
            init: function(){
                this.a = this.a || null;
                this.b = this.b || null;
                this.overlapN = this.overlapN || new ig.global.Vector();
                this.overlapV = this.overlapV || new ig.global.Vector();
            },
            /**
             * Set some values of the response back to their defaults. Call this between tests if you are going
             * to reuse a single response object for multiple intersection tests
             * @return {*} {Response} this for chaining
             */
            clear: function(){
                this.aInB = true;
                this.bInA = true;
                this.overlap = Number.MAX_VALUE;
                return this;
            }
        })
    });