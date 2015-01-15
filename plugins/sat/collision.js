ig.module(
    'plugins.sat.collision')

    .requires(
    'plugins.sat.box',
    'plugins.sat.circle',
    'plugins.sat.polygon',
    'plugins.sat.vector',
    'plugins.sat.response'
)
    .defines(function(){
        ig.global.Collision = ig.Class.extend({
            T_VECTOR: [], // Pool of Vectors used in calculations.
            T_ARRAYS: [], // Pool of Arrays used in calculations
            LEFT_VORNOI_REGION: -1,
            MIDDLE_VORNOI_REGION: 0,
            RIGHT_VORNOI_REGION: 1,
            /**
             * Create the pool of arrays and vector for calculation on creation
             * @param vectorPoolSize <optional> The total size of the vector pool
             * @param arrayPoolSize <optional> the total size of the array pool
             */
            init: function( vectorPoolSize, arrayPoolSize ){
                var v = vectorPoolSize || 10,
                    a = arrayPoolSize || 10;
                for (var i = 0; i < v; i++){
                    this.T_VECTOR.push( new ig.global.Vector());
                }
                for (i = 0; i < a; i++){
                    this.T_ARRAYS.push([]);
                }
            },
            /**
             * Flattens the specified array of points onto a unit vector axis, resulting in a one dimensional range
             * of the minimum and maximum value on that axis
             * @param points (Array.<Vector>) The points to flatten
             * @param normal (Vector) The unit vector axis to flatten on.
             * @param result (Array.<number>) An array. After calling this function,
             *  - result[0] will be the minimum value
             *  - result[1] will be the maximum value
             */
            flattenPointsOn: function( points, normal, result ){
                var min = Number.MAX_VALUE,
                    max = -Number.MAX_VALUE,
                    len = points.length;
                for (var i = 0; i < len; i++){
                    var dot = points[i].dot(normal);
                    if ( dot < min) { min = dot }
                    if (dot > max) { max = dot; }
                }
                result[0] = min; result[1] = max;
            },

            isSeparatingAxis: function( aPos, bPos, aPoints, bPoints, axis, response ){
                var rangeA = this.T_ARRAYS.pop(),
                    rangeB = this.T_ARRAYS.pop(),
                    option1, option2,
                // Get the magnitude of the offset between the two polygons
                    offsetV = this.T_VECTOR.pop().copy(bPos).sub(aPos),
                    projectedOffset = offsetV.dot(axis);
                // Project the polygons onto the axis
                this.flattenPointsOn(aPoints, axis, rangeA);
                this.flattenPointsOn(bPoints, axis, rangeB);
                // Move B's range to its position relative to A.
                rangeB[0] += projectedOffset;
                rangeB[1] += projectedOffset;
                // Check if there is a gap. If there is, this is a separating axis and we can stop
                if (rangeA[0] > rangeB[1] || rangeB[0] > rangeA[1]){
                    this.T_VECTOR.push(offsetV);
                    this.T_ARRAYS.push(rangeA);
                    this.T_ARRAYS.push(rangeB);
                    return true;
                }
                // If we're calculating the response, calculate the overlap
                if ( response ) {
                    var overlap = 0;
                    // A starts further left than B
                    if ( rangeA[0] < rangeB[0]){
                        response.aInB = false;
                        // A ends before B does. We have to pull A out of B
                        if ( rangeA[1] < rangeB[1]){
                            overlap = rangeA[1] - rangeB[0];
                            response.bInA = false;
                        } // B is fully inside A. Pick the shortest way out.
                        else {
                            option1 = rangeA[1] - rangeB[0];
                            option2 = rangeB[1] - rangeA[0];
                            overlap = option1 < option2 ? option1 : -option2;
                        }
                    }  else {
                        // B starts further left than A
                        response.bInA = false;
                        // B ends before A ends. We have to push A out of B
                        if (rangeA[1] > rangeB[1]){
                            overlap = rangeA[0] - rangeB[1];
                            response.aInB = false;
                            // A is fully inside B. Pick the shorest way out.
                        } else {
                            option1 = rangeA[1] - rangeB[0];
                            option2 = rangeB[1] - rangeA[0];
                            overlap = option1 < option2 ? option1 : -option2;
                        }
                    }

                    // If this is the smallest amount of overlap we've seen so far, set it as the minimum overlap
                    var absOverlap = Math.abs(overlap);
                    if (absOverlap < response.overlap){
                        response.overlap = absOverlap;
                        response.overlapN.copy(axis);
                        if (overlap < 0){
                            response.overlapN.reverse();
                        }
                    }
                }
                this.T_VECTOR.push(offsetV);
                this.T_ARRAYS.push(rangeA);
                this.T_ARRAYS.push(rangeB);
                return false;
            },
            /**
             * Calculates which vornoi region a point is on a line segment
             * It is assumed that both the line and the point are relative to (0,0)
             *
             *             |       (0)      |
             *      (-1)  [0]--------------[1]  (1)
             *             |       (0)      |
             * @param line {Vector} The line segment
             * @param point {Vector} The point
             * @return {*} {Number} LEFT_VORNOI_REGION if it is the left region
             *                      RIGHT_VORNOI_REGION if it is the right region
             *                      MIDDLE_VORNOI_REGION if it is the middle region
             */
            vornoiRegion: function( line, point ){
                var len2 = line.len2(),
                    dp = point.dot(line);
                if (dp < 0) { return this.LEFT_VORNOI_REGION; }
                else if (dp > len2) { return this.RIGHT_VORNOI_REGION; }
                else { return this.MIDDLE_VORNOI_REGION; }
            },
            /**
             * Check if two circles intersect
             * @param a {Circle} the first circle
             * @param b {Circle} the second circle
             * @param response {Response=} response object <optional> that will be populated if the circles intersect
             * @return {Boolean} true if circles intersect, false otherwise.
             */
            testCircleCircle: function( a, b, response){
                var differenceV = this.T_VECTOR.pop().copy(b.pos).sub(a.pos),
                    totalRadius = a.r + b.r,
                    totalRadiusSq = totalRadius * totalRadius,
                    distanceSq = differenceV.len2();
                if (distanceSq > totalRadiusSq) {
                    // They do not intersect
                    this.T_VECTOR.push(differenceV);
                    return false
                }
                // They intersect. If we're calculating a response, calculate the overlap.
                if (response){
                    var dist = Math.sqrt(distanceSq);
                    response.a = a;
                    response.b = b;
                    response.overlap = totalRadius - dist;
                    response.overlapN.copy(differenceV.normalize());
                    response.overlapV.copy(differenceV).scale(response.overlap);
                    response.aInB = a.r <= b.r && dist <= b.r - a.r;
                    response.bInA = b.r <= a.r && dist <= a.r - b.r;
                }
                this.T_VECTOR.push(differenceV);
                return true;
            },
            /**
             * Check if a polygon and a circle intersect
             * @param polygon {Polygon} The polygon
             * @param circle {Circle} The circle
             * @param response {Response=} Response object <optional> that will be populated if they intersect
             * @return {Boolean} true if they intersect, false if they don't
             */
            testPolygonCircle: function( polygon, circle, response){
                var circlePos = this.T_VECTOR.pop().copy(circle.pos).sub(polygon.pos),
                    radius = circle.r,
                    radius2 = radius * radius,
                    points = polygon.points,
                    len = points.length,
                    edge = this.T_VECTOR.pop(),
                    point = this.T_VECTOR.pop();
                // For each edge in the polygon
                for (var i = 0; i < len; i++){
                    var next = i === len -1 ? 0: i + 1,
                        prev = i === 0 ? len -1 : i - 1,
                        overlap = 0,
                        overlapN = null;

                    // Get the edge
                    edge.copy(polygon.edges[i]);
                    // Calculate the center of the circle relative to the starting point of the edge
                    point.copy(circlePos).sub(points[i]);
                    // If the distance between the center of the circle and the point is larger than the radius, the polygon is definately not fully in the circle
                    if (response && point.len2() > radius2){
                        response.aInB = false;
                    }

                    // Calculate which Vornoi region the center of the circle is in.
                    var region = this.vornoiRegion(edge, point);
                    if (region === this.LEFT_VORNOI_REGION){
                        // Need to make sure we're in the RIGHT_VORNOI_REGION of the previous edge
                        edge.copy(polygon.edges[prev]);
                        // Calculate the center of the circle relative the starting point of the previous edge
                        var point2 = this.T_VECTOR.pop().copy(circlePos).sub(points[prev]);
                        region = this.vornoiRegion(edge, point2);
                        if (region === this.RIGHT_VORNOI_REGION){
                            // It's in the region we want. Check if the circle intersects the point
                            var dist = point.len();
                            if (dist > radius){
                                // No intersection
                                this.T_VECTOR.push(circlePos);
                                this.T_VECTOR.push(edge);
                                this.T_VECTOR.push(point);
                                this.T_VECTOR.push(point2);
                                return false;
                            } else if (response){
                                // It intersects. Calculate the overlap
                                response.bInA = false;
                                overlapN = point.normalize();
                                overlap = radius - dist;
                            }
                        }
                        this.T_VECTOR.push(point2);
                    } else if (region === this.RIGHT_VORNOI_REGION){
                        // Need to make sure we're in the left region on the next edge
                        edge.copy(polygon.edges[next]);
                        // Calculate the center of the circle relative to the starting point of the next edge
                        point.copy(circlePos).sub(points[next]);
                        region = this.vornoiRegion(edge, point);
                        if (region === this.LEFT_VORNOI_REGION){
                            // It's in the region we want. Check if the circle intersects the point
                            var dist = point.len();
                            if (dist > radius){
                                // No intersection
                                this.T_VECTOR.push(circlePos);
                                this.T_VECTOR.push(edge);
                                this.T_VECTOR.push(point);
                                return false;
                            } else if (response){
                                // It intersects, calculate the overlap
                                response.bInA = false;
                                overlapN = point.normalize();
                                overlap = radius - dist;
                            }
                        }
                        // Middle Vornoi region
                        else {
                            // Need to check if circle is intersecting the edge,
                            // Change the edge into its edge normal
                            var normal = edge.perp().normalize();
                            // Find the perpendicular distance between the center of the circle and the edge
                            var dist = point.dot(normal);
                            var distAbs = Math.abs(dist);
                            // If the circle is on the outside of the edge, there is no intersection
                            if (dist > 0 && distAbs > radius){
                                this.T_VECTOR.push(circlePos);
                                this.T_VECTOR.push(normal);
                                this.T_VECTOR.push(point);
                                return false;
                            } else if (response){
                                // It intersects, calculate the overlap
                                overlapN = normal;
                                overlap = radius - dist;
                                // If the center of the circle is on the outside of the edge, or part of the circle
                                // is on the outside, the circle is not fully inside the polygon
                                if (dist >= 0 || overlap < 2 * radius){
                                    response.bInA = false;
                                }
                            }
                        }
                        // If this is the smallest overlap we've seen, keep it.
                        // OverlapN may be null if the circle was in the wrong Vornoi region
                        if (overlapN && response && Math.abs(overlap) < Math.abs(response.overlap)){
                            response.overlap = overlap;
                            response.overlapN.copy(overlapN);
                        }
                    }
                } // End for loop

                // Calculate the final overlap vector - based on the smallest overlap
                if (response){
                    response.a = polygon;
                    response.b = circle;
                    response.overlapV.copy(response.overlapN).scale(response.overlap);
                }
                this.T_VECTOR.push(circlePos);
                this.T_VECTOR.push(edge);
                this.T_VECTOR.push(point);
                return true;
            },
            /**
             * Check if a circle and a polygon intersect
             *  NOTE: This runs slightly slower than polygonCircle
             * @param circle {Circle} the circle
             * @param polygon {Polygon} The polygon
             * @param response {Response=} Response object <optional> that will be populated if they intersect
             * @return {Boolean} true if they intersect, false if they don't
             */
            testCirclePolygon: function( circle, polygon, response){
                var result = this.testPolygonCircle(circle, polygon, response);
                if (result && response){
                    // Swap A and B in the response
                    var a = response.a;
                    var aInB = response.aInB;
                    response.overlapN.reverse();
                    response.overlapV.reverse();
                    response.a = response.b;
                    response.b = a;
                    response.aInB = response.bInA;
                    response.bInA = aInB;
                }
                return result;
            },
            /**
             * Checks wheather two convex, clockwise polygons intersect
             * @param a The first polygon
             * @param b The second polygon
             * @param response Object that will be populated if they intersect
             * @return {Boolean} True/False
             */
            testPolygonPolygon: function( a, b, response){
                var aPoints = a.points,
                    aLen = aPoints.length,
                    bPoints = b.points,
                    bLen = bPoints.length;
                // If any of the edge normals of A is a separating axis, no intersection
                for (var i = 0; i < aLen; i++){
                    if (this.isSeparatingAxis(a.pos, b.pos, aPoints, bPoints, a.normals[i], response)){
                        return false;
                    }
                }
                // If any of the edge normals of B is a separating axis, no intersection
                for (var i = 0; i < bLen; i++){
                    if (this.isSeparatingAxis(a.pos, b.pos, aPoints, bPoints, b.normals[i], response)){
                        return false;
                    }
                }

                // Since none of the edge normals of A or B are a separating axis, there is an intersection
                // and we've already calculated the smallest overlap. Calculate the final overlap vector.
                if (response){
                    response.a = a;
                    response.b = b;
                    response.overlapV.copy(response.overlapN).scale(response.overlap);
                }
                return true;
            },

            testBoxBox: function(a, b){
                if (a.pos.x >= b.pos.x && a.pos.x <= (b.pos.x + b.width) &&
                    a.pos.y >= b.pos.y &&
                    a.pos.y <= (b.pos.y + b.height)){
                    return true;
                }
                return false;
            }
        })
    });