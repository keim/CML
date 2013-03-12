//----------------------------------------------------------------------------------------------------
// Scope Limited CMLObject
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.extensions {
    import org.si.cml.*;
    import org.si.cml.namespaces._cml_internal;
    
    
    /** Extension of CMLObject that implements scope limitation. <br/>
     *  You have to call ScopeLimitObject.initialize() first, and you have to call CMLObject.update() for each frame.<br/>
     *  ScopeLimitObject.initialize() registers some user define commands as below,
     *  <ul>
     *  <li>&scon; Enables the available scope.</li>
     *  <li>&scoff; Disables the available scope.</li>
     *  </ul>
     */
    public class ScopeLimitObject extends CMLObject
    {
    // namespace
    //------------------------------------------------------------
        use namespace _cml_internal;
        
        
        
        
    // public variables
    //----------------------------------------
        // rectangle of available scope
        /** Minimum x value of the available scope. @default Actor.defaultScopeXmin */
        public var scopeXmin:Number;
        /** Maxmum x value of the available scope. @default Actor.defaultScopeXmax */
        public var scopeXmax:Number;
        /** Minimum y value of the available scope. @default Actor.defaultScopeYmin */
        public var scopeYmin:Number;
        /** Maximum y value of the available scope. @default Actor.defaultScopeYmax */
        public var scopeYmax:Number;
        /** The availabirity of scope check */
        public var scopeEnabled:Boolean = true;

        /** default value of the available scopes range */
        static public var defaultScopeXmin:Number = -160;
        /** default value of the available scopes range */
        static public var defaultScopeXmax:Number = 160;
        /** default value of the available scopes range */
        static public var defaultScopeYmin:Number = -240;
        /** default value of the available scopes range */
        static public var defaultScopeYmax:Number = 240;
        
        
        
        
    // public properties
    //----------------------------------------
        /** Scope width @default ScopeLimitObject.defaultScopeWidth */
        public function get scopeWidth() : Number { return scopeXmax - scopeXmin; }
        public function set scopeWidth(w:Number) : void
        {
            scopeXmax = w * 0.5;
            scopeXmin = -scopeXmax;
        }
        
        
        /** Scope height @default Actor.defaultScopeHeight */
        public function get scopeHeight() : Number { return scopeYmax - scopeYmin; }
        public function set scopeHeight(h:Number) : void
        {
            scopeYmax = h * 0.5;
            scopeYmin = -scopeYmax;
        }


        /** Did this object escape from the scope ? */
        public function get isEscaped() : Boolean
        {
            return (scopeEnabled && (y<scopeYmin || x<scopeXmin || y>scopeYmax || x>scopeXmax));
        }
        
        
        /** default scope width. @default 320 */
        static public function get defaultScopeWidth() : Number { return defaultScopeXmax - defaultScopeXmin; }
        static public function set defaultScopeWidth(w:Number) : void
        {
            defaultScopeXmax = w * 0.5;
            defaultScopeXmin = -defaultScopeXmax;
        }
        
        
        /** default scope height. @default 480  */
        static public function get defaultScopeHeight() : Number { return defaultScopeYmax - defaultScopeYmin; }
        static public function set defaultScopeHeight(h:Number) : void
        {
            defaultScopeYmax = h * 0.5;
            defaultScopeYmin = -defaultScopeYmax;
        }
        
        
        
        
    // constructor
    //----------------------------------------
        /** Constructor */
        public function ScopeLimitObject()
        {
        }
        
        
        
        
    // operations
    //----------------------------------------
        /** set default scope rectangle. @default Rectangle(-160, -240, 320, 480)  */
        static public function setDefaultScope(x:Number, y:Number, width:Number, height:Number) : void
        {
            defaultScopeXmin = x;
            defaultScopeXmax = x + width;
            defaultScopeYmin = y;
            defaultScopeYmax = y + height;
        }
        
        
        /** Expand scope size from defaultScope. */
        public function expandScope(x:Number, y:Number) : void
        {
            scopeXmin = defaultScopeXmin - x;
            scopeXmax = defaultScopeXmax + x;
            scopeYmin = defaultScopeYmin - y;
            scopeYmax = defaultScopeYmax + y;
        }
        
        
        /** Check scope and call destroy(0) when escaped. 
         *  @return flag escaped
         */
        public function checkScope() : Boolean
        {
            if (isEscaped) {
                destroy(0);
                return true;
            }
            return false;
        }
        
        
        /** Check scope and stay inside of scope.
         *  @return flag limited
         */
        public function limitScope() : Boolean
        {
            var ret:Boolean = false;
            if (x<scopeXmin) {
                x = scopeXmin; 
                ret = true;
            } else if (x>scopeXmax) {
                x = scopeXmax;
                ret = true;
            }
            if (y<scopeYmin) {
                y = scopeYmin; 
                ret = true;
            } else if (y>scopeYmax) {
                y = scopeYmax;
                ret = true;
            }
            return ret;
        }
        
        
        
        
        
    // override
    //----------------------------------------
        /**
         * Callback function from CMLObject.update(). This function destroys objects that have escaped from scope. It is called after updating position.
         * Override this to update own parameters, and remember to call super.onUpdate() or handle scope escape yourself.
         */
        override public function onUpdate() : void
        {
            // basic operation to check escaping
            if (isEscaped) destroy(0);
        }


        /** @private */
        override public function _initialize(parent_:CMLObject, isParts_:Boolean, access_id_:int, x_:Number, y_:Number, vx_:Number, vy_:Number, head_:Number) : CMLObject
        {
            scopeXmin = defaultScopeXmin;
            scopeXmax = defaultScopeXmax;
            scopeYmin = defaultScopeYmin;
            scopeYmax = defaultScopeYmax;
            return super._initialize(parent_, isParts_, access_id_, x_, y_, vx_, vy_, head_);
        }
        
        
        
        
    // operation for Actor list
    //----------------------------------------
        /** <b>Call this function first of all</b> instead of CMLObject.initialize(). 
         *  @param vertical_ Flag of scrolling direction
         *  @return The root object.
         *  @see Actor#onPreCreate()
         */
        static public function initialize(vertical_:Boolean=true) : CMLObject
        {
            if (CMLObject.root == null) {
                CMLSequence.registerUserCommand("scon",  function(f:CMLFiber, a:Array) : void   { Actor(f.object).scopeEnabled = true; });
                CMLSequence.registerUserCommand("scoff", function(f:CMLFiber, a:Array) : void   { Actor(f.object).scopeEnabled = false; });
            }
            return CMLObject.initialize(vertical_);
        }
    }
}

