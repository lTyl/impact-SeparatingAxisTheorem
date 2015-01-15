//Separating Axis Theorem: Polygon class
ig.module(
    'plugins.sat.polygon'
)

    .requires('plugins.sat.vector')

    .defines(function(){
        ig.global.Polygon = ig.Class.extend({
            pos: null, // {Vector} representing the origin of the polygon
            points: null, // An array of vectors representing the points in the polygon
            /**
             * Create a polygon objectbbm
             * @param pos {Vector} representing the origin of the polygon. All points are relative to this.
             * @param points {Array} An arrayi of vectors representing the points in the polygon, in clockwise order
             */
            init: function( pos, points ){
                this.pos = pos || new ig.global.Vector;
                this.points = points | [];
                this.recalc();
            },
            /**
             * Recalculate the edges and normals of the polygon. This MUST be called if the points array is modified at all
             */
            recalc: function(){
                var points = this.points,
                    len = points.length;
                this.edges = [];
                this.normals = [];
                for (var i = 0; i < len; i++){
                    var p1 = points[i],
                        p2 = i < len - 1 ? points[i + 1] : points[0],
                        e = new ig.global.Vector.copy(p2).sub(p1),
                        n = new ig.global.Vector.copy(e).perp().normalize();
                    this.edges.push(e);
                    this.normals.push(n);
                }
            }
        })
    });