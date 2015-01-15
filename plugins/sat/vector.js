// Separating Axis Theorem: Vector class
ig.module(
    'plugins.sat.vector'
)

    .defines(function (){
        ig.global.Vector = ig.Class.extend({
            x: 0,
            y: 0,

            init: function( x, y ){
                this.x = x || 0;
                this.y = y || 0;
                return this;
            },
            /***
             * Copy another vector
             * @param other
             */
            copy: function( other ){
                this.x = other.x;
                this.y = other.y;
                return this;
            },
            /**
             * Rotate this vector 90degrees
             */
            perp: function(){
                var x = this.x;
                this.x = this.y;
                this.y = -x;
                return this;
            },
            /***
             * Reverse the X/Y of this vector
             */
            reverse: function(){
                this.x = -this.x;
                this.y = -this.y;
                return this;
            },
            /***
             * Normalize (Make unit length) this vector
             */
            normalize: function(){
                var d = this.len();
                if (d > 0){
                    this.x = this.x / d;
                    this.y = this.y /d;
                }
                return this;
            },
            /***
             * Add another Vector to this one
             * @param other The other vector to add
             */
            add: function( other ){
                this.x += other.x;
                this.y += other.y;
                return this;
            },
            /***
             * ubtract this Vector from another
             * @param other The other Vector
             */
            sub: function( other ){
                this.x -= other.x;
                this.y -= other.y;
                return this;
            },
            /***
             * Scale this Vector
             * @param x Scaling factor on X axis
             * @param y Scaling factor on Y axis
             */
            scale: function( x, y ){
                this.x *= x;
                this.y *= y || x;
                return this;
            },
            /***
             * Project this vector onto another vector
             * @param other The other vector
             */
            project: function( other ){
                var amt = this.dot( other ) / other.len2();
                this.x = amt * other.x;
                this.y = amt * other.y;
                return this;
            },
            /***
             * Project this vector onto a vector of unit length
             * @param other The other Vector
             */
            projectN: function( other ){
                var amt = this.dot( other );
                this.x = amt * other.x;
                this.y = amt * other.y;
                return this;
            },
            /***
             * Reflect this Vector on an arbitrary axis
             * @param axis The axis to reflect on
             */
            reflect: function( axis ){
                var x = this.x,
                    y = this.y;
                this.project(axis).scale(2);
                this.x -= x;
                this.y -= y;
                return this;
            },
            /***
             * Reflect this Vector on an arbitrary axis (Represented by a unit vector)
             * @param axis The unit vector representing the axis
             */
            reflectN: function( axis ){
                var x = this.x,
                    y = this.y;
                this.projectN(axis).scale(2);
                this.x -= x;
                this.y -= y;
                return this;
            },
            /***
             * Get the dot product of this Vector against another
             * @param other The vector to dot this one against
             * @return {*} The dot product
             */
            dot: function( other ){
                return this.x * other.x + this.y * other.y;
            },
            /***
             * Get the length^2 of this vector;
             * @return {*} The length ^2 of this vector
             */
            len2: function(){
                return this.dot(this);
            },
            /***
             * Get the length of this Vector
             * @return {Number} The length of this vector
             */
            len: function(){
                return Math.sqrt(this.len2());
            }

        })
    });