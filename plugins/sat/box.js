ig.module('plugins.sat.box')
    .requires('plugins.sat.vector', 'plugins.sat.polygon')
    .defines(function(){
        ig.global.Box = ig.Class.extend({
            pos: null,
            width: null,
            height: null,
            /**
             * An axis-aligned box, with with and height
             * @param pos A vector representing the top-left of the box
             * @param width The width of the box
             * @param height The height of the box
             */
            init: function( pos, width, height){
                this.pos = pos || new ig.global.Vector();
                this.width = width || 0;
                this.height = height || 0;
            },
            /**
             * Create a polygon that is the same as this box
             * @return {arc.Collision.Polygon} A new polygon that represents this box
             */
            toPolygon: function(){
                var pos = this.pos,
                    w = this.width,
                    h = this.height;
                return new ig.global.Polygon(
                    new ig.global.Vector(pos.x, pos.y),[
                        new ig.global.Vector(),
                        new ig.global.Vector(w, 0),
                        new ig.global.Vector(w, h),
                        new ig.global.Vector(0,h)]
                );
            }
        })
    });