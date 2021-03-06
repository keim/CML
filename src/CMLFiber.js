//----------------------------------------------------------------------------------------------------
// CML fiber class
//  Copyright (c) 2007 kei mesuda(keim) ALL RIGHTS RESERVED.
//  This code is under BSD-style(license.txt) licenses.
//----------------------------------------------------------------------------------------------------
//import CML.Sequence from "./CML.Sequence.js";
//import CML.Barrage from "./core/CML.Barrage.js";
//import CML.BarrageElem from "./core/CML.BarrageElem.js";
//import CML.List from "./core/CML.List.js";
//import CML.ListElem from "./core/CML.ListElem.js";
//import CML.State from "./core/CML.State.js";
/** CML.Fiber rewrites parameters of CML.Object according to CML.Sequence (Fiber is called as "micro thread" in some other languages.)
 *  <p>
 *  USAGE<br/>
 *  1) Get the CML.Fiber instance from CML.Object.execute().<br/>
 *  2) CML.Fiber.destroy(); stops this fiber.<br/>
 *  3) CML.Fiber.object; accesses to the CML.Object this fiber controls.<br/>
 *  4) CML.Fiber.target; accesses to the CML.Object this fiber targets to.<br/>
 *  </p>
 * @see CML.Object#execute()
 * @see CML.Fiber#destroy()
 * @see CML.Fiber#object
 * @see CML.Fiber#target
 */
CML.Fiber = class extends CML.ListElem {
    // constructor
    //------------------------------------------------------------
    /** <b>You cannot create new CML.Fiber().</b> You can get CML.Fiber instance only from CML.Object.execute().
     *  @see CML.Object#execute()
     */
    constructor() {
        super();
        // variables
        //------------------------------------------------------------
        this._id = 0; // idstatic
        this._gene = 0; // child generation
        this._object = null; // running object
        this._object_id = 0; // running object id
        this._target = null; // target object
        this._target_id = 0; // target object id
        this._barrage = new CML.Barrage(); // bullet multiplyer
        this._seqWaitDest = null; // sequence to wait for object destruction
        /** @private _cml_fiber_internal */ this._pointer = null; // executing pointer
        /** @private _cml_fiber_internal */ this._access_id = 0; // access id
        // children list
        this._listChild = new CML.List();
        this._firstDest = this._listChild.end; // first destruction fiber
        // setting parameters
        /** @private _cml_fiber_internal */ this.fx = 0; // fiber position
        /** @private _cml_fiber_internal */ this.fy = 0;
        /** @private _cml_fiber_internal */ this.chgt = 0; // pos/vel/rot changing time
        /** @private _cml_fiber_internal */ this.headAngleOption = CML.State.HO_AIM; // head option
        /** @private _cml_fiber_internal */ this.headAngle = 0;  // head angle [degree]
        /** @private _cml_fiber_internal */ this.firedAngle = 0; // previous fired angle (due to the compatiblity with bulletML)
        /** @private _cml_fiber_internal */ this.bul = new CML.BarrageElem(); // primary setting of bullet
        /** @private _cml_fiber_internal */ this.invertFlag = 0; // invertion flag (0=no, 1=x_reverse, 2=y_reverse, 3=xy_reverse)
        /** @private _cml_fiber_internal */ this.wtm1 = 1; // waiting time for "w"
        /** @private _cml_fiber_internal */ this.wtm2 = 1; // waiting time for "~"
        /** @private _cml_fiber_internal */ this.seqFiber = null; // previous calling sequence from "@"
        /** @private _cml_fiber_internal */ this.seqFired = null; // previous calling sequence from "f"
        // runtime parameters
        /** @private _cml_fiber_internal */ this.wcnt = 0; // waiting counter
        /** @private _cml_fiber_internal */ this.lcnt = []; // loop counter
        /** @private _cml_fiber_internal */ this.jstc = []; // sub routine call stac
        /** @private _cml_fiber_internal */ this.istc = []; // invertion flag stac
        /** @private _cml_fiber_internal */ this.vars = []; // fiber variables
    }
    // properties
    //------------------------------------------------------------
    /** Maximum limitation of the executable looping count in 1 frame. @default 1024*/
    static set maxLoopInFrame(lm) { CML.Fiber._loopmax = lm; }
    /** Maximum limitation of the executable gosub nest count. @default 64*/
    static set maxStacCount(sc) { CML.Fiber._stacmax = sc; }
    /** CML.Object that this fiber controls. */
    get object() { return this._object; }
    /** CML.Object that this fiber targets to. */
    get target() { return this._target; }
    /** CML.Barrage that this fiber uses. */
    get barrage() { return this._barrage; }
    /** Angle of this fiber. The value is set by "h*" commands. */
    get angle() { return this._getAngle(0) + CML.Fiber._globalVariables._scrollRadian; }
    /** String argument. <br/>
     *  This property is used in callback function of CML.Sequence.registerUserCommand().<br/>
     *  When the next statement of user command is not '...', this property shows null.
     *  @example
<listing version="3.0">
// Register the user command
CML.Sequence.registerUserCommand("print", callbackPrint);

function callbackPrint(fbr:CML.Fiber) {
    // You can refer the string after user command.
    _drawText(fbr.string);
}

// String comment after the user command in sequence.
// In this sequence, you call _drawText('Hello World !!').
var seq:CML.Sequence = new CML.Sequence("&amp;print'Hello World !!'");
</listing>
     */
    get string() {
        const stateString = this._pointer.next;
        return (stateString != null) ? stateString._string : null;
    }
    /** Sequence argument. <br/>
     *  This property is used in callback function of CML.Sequence.registerUserCommand() with the option 'requireSequence' is true.<br/>
     *  When the next statement of user command is not sequence. outputs parsing error. Or, when the next statement is '{.}', returns null.
     */
    get sequence() {
        const stateRefer = this._pointer.next;
        return (stateRefer != null) ? (stateRefer.jump) : null;
    }
    /** Is active ? When this property shows false, this fiber is already destroyed. */
    get isActive() { return (this._object != null); }
    /** Is sequence executing ? */
    get isExecuting() { return (this._pointer != null); }
    /** Does this fiber have any children ? */
    get isParent() { return (!this._listChild.isEmpty()); }
    /** Does this fiber have any destruction fiber ? */
    get hasDestFiber() { return (this._firstDest != this._listChild.end); }
    /** @private */
    set target(t) { this._setTarget((t == null) ? CML.Fiber._defaultTarget : t); }
    // operations
    //------------------------------------------------------------
    /** Stop the fiber.<br/>
     *  This function stops all child fibers also.
     */
    destroy() {
        if (this.isActive)
            this._finalize();
    }
    // operations to children
    //------------------------------------------------------------
    /** Stop all child fibers. */
    destroyAllChildren() {
        var elem = this._listChild.begin, elem_end = this._listChild.end, elem_next;
        while (elem != elem_end) {
            elem_next = elem.next;
            elem.destroy();
            elem = elem_next;
        }
    }
    /** Stop child fiber with specifyed id. */
    destroyChild(child_id) {
        var fbr = this.findChild(child_id);
        if (fbr != null) {
            fbr.destroy();
            return true;
        }
        return false;
    }
    /** Find child fiber with specifyed id. */
    findChild(child_id) {
        var elem = this._listChild.begin, elem_end = this._firstDest;
        while (elem != elem_end) {
            if (elem._access_id == child_id)
                return elem;
            elem = elem.next;
        }
        return null;
    }
    /** kill destruction fiber with specifyed id. @private */
    _killDestFiber(destructionStatus) {
        if (this.hasDestFiber) {
            var fbr = this._firstDest;
            if (fbr._access_id == destructionStatus) {
                this._firstDest = fbr.next;
                fbr.destroy();
            }
            else {
                var elem = this._firstDest.next, elem_end = this._listChild.end;
                while (elem != elem_end) {
                    if (elem._access_id == destructionStatus) {
                        elem.destroy();
                        return;
                    }
                    elem = elem.next;
                }
            }
        }
    }
    // reference
    //------------------------------------------------------------
    /** Get the variables of the sequence "$1...$9".
     *  @param Index of variable.
     *  @return Value of variable.
     */
    getVeriable(idx) {
        return this.vars[0][idx];
    }
    /** Get the loop counter of this fiber.
     *  @param Nested loop index. The index of 0 means the most inner loop, and 1 means the loop 1 outside.
     *  @return Loop count. Start at 0, and end at [loop_count]-1.
     */
    getLoopCounter(nest = 0) {
        return (nest < this.lcnt.length) ? this.lcnt[nest] : 0;
    }
    /** Get the interval value (specifyed by "i" command) of this fiber.
     *  @return Interval.
     */
    getInterval() {
        return this.chgt;
    }
    // internal functions
    //------------------------------------------------------------
    // initializer (call from CML.State._fiber())
    _initialize(parent, obj, seq, access_id, invertFlag = 0, args_ = null) {
        this._setObject(obj); // set running object
        this._access_id = access_id; // access id
        this._gene = parent._gene + 1; // set generation
        this._clear_param(); // clear parameters
        this.invertFlag = invertFlag; // set invertion flag
        this._pointer = seq.next; // set cml pointer
        this.wcnt = 0; // reset waiting counter
        this.lcnt.length = 0; // clear loop counter stac
        this.jstc.length = 0; // clear sub-routine call stac
        this.istc.length = 0; // clear invertion stac
        this._firstDest = this._listChild.end; // reset last child
        this._pushVariables(args_); // set argument
        return (this._gene < CML.Fiber._stacmax);
    }
    // finalizer 
    _finalize() {
        this.destroyAllChildren();
        this._pointer = null;
        this._object = null;
        this._target = null;
        ++this._id;
        this.remove_from_list();
        CML.Fiber._freeFibers.push(this);
    }
    // set object
    _setObject(obj) { this._object = obj; this._object_id = obj.id; }
    _setTarget(tgt) { this._target = tgt; this._target_id = tgt.id; }
    // clear parameters
    _clear_param() {
        this._setTarget(CML.Fiber._defaultTarget); // set target object
        this.fx = 0; // fiber position
        this.fy = 0;
        this.chgt = 0; // changing time
        this.headAngleOption = CML.State.HO_AIM; // head option
        this.headAngle = 0; // head angle [degree]
        this.firedAngle = 0; // previous fired angle (due to the compatiblity with bulletML)
        this.bul.setSequence(1, 0, 0, 0);
        this._barrage.clear();
        this.invertFlag = 0; // invertion flag
        this.wtm1 = 1; // waiting time for "w"
        this.wtm2 = 1; // waiting time for "~"
        this.vars.length = 0;
        this.seqFiber = CML.Sequence.nop();
        this.seqFired = CML.Sequence.nop();
    }
    // copy parameters
    _copy_param(src) {
        this._setTarget(src.target); // set target object
        this.fx = src.fx; // fiber position
        this.fy = src.fy;
        this.chgt = src.chgt; // changing time
        this.headAngleOption = src.headAngleOption; // head option
        this.headAngle = src.headAngle; // head angle [degree]
        this.firedAngle = src.firedAngle; // previous fired angle (due to the compatiblity with bulletML)
        this.bul.copy(src.bul);
        this._barrage.appendCopyOf(src._barrage);
        this.wtm1 = src.wtm1; // waiting time for "w"
        this.wtm2 = src.wtm2; // waiting time for "~"
        this.seqFiber = src.seqFiber;
        this.seqFired = src.seqFired;
        return this;
    }
    // execution in 1 frame and returns next fiber
    _onUpdate() {
        // next fiber
        let nextElem = this.next;
        // kill fiber, if object was destroyed.
        if (this._object.id != this._object_id) {
            this.destroy();
            return nextElem;
        }
        // set target to default, if target was destroyed.
        if (this._target.id != this._target_id) 
            this._setTarget(CML.Fiber._defaultTarget);
        // execution
        if (--this.wcnt <= 0) { // execute only if waiting counte<=0
            let loopCounter = 0, executeNext = true;
            while (executeNext && this._pointer) {
                executeNext = this._pointer.execute(this); // execute CML.State function
                this._pointer = this._pointer.next; // increment pointer
                // too many loops error, script may has no wait.
                if (++loopCounter == CML.Fiber._loopmax) 
                    throw new Error("CML Exection error. No wait command in the loop ?");
            }
        }
        // run all children
        let elem = this._listChild.begin;
        while (elem != this._listChild.end)
            elem = elem._onUpdate();
        // update next fiber
        nextElem = this.next;
        // destroy if no children and no pointer
        if (this._pointer == null && this._listChild.isEmpty())
            this.destroy();
        // return next fiber
        return nextElem;
    }
    // destroy by object
    _destroyByObject(obj) {
        // check all children
        let elem = this._listChild.begin;
        while (elem != this._listChild.end) 
            elem = elem._destroyByObject(obj);
        elem = this.next;
        if (this._object === obj)
            this.destroy();
        return elem;
    }
    // push arguments
    /** @private _cml_fiber_internal */
    _pushVariables(argArray = null) {
        this.vars.unshift(Object.assign(new Array(9).fill(0), argArray));
    }
    // pop arguments
    /** @private _cml_fiber_internal */
    _popVariables() {
        this.vars.shift();
    }
    // push invertion
    /** @private _cml_fiber_internal */
    _pushInvertion(newFlag) {
        this.istc.unshift(this.invertFlag);
        this.invertFlag = newFlag;
    }
    // pop invertion
    /** @private _cml_fiber_internal */
    _popInvertion() {
        this.invertFlag = this.istc.shift();
    }
    // return fiber's head angle (angle in this game's screen, the scroll direction is 0[deg]).
    /** @private _cml_fiber_internal */
    _getAngle(base, fromCenter=false) {
        switch (this.headAngleOption) {
            case CML.State.HO_AIM:
                if (fromCenter) return this._object.getAimingAngleOnScreen(this._target) + this.headAngle;
                return this._object.getAimingAngleOnScreen(this._target, this.fx, this.fy) + this.headAngle;
            case CML.State.HO_ABS:
                return this.headAngle;
            case CML.State.HO_REL:
                return this._object.angleOnScreen + this.headAngle;
            case CML.State.HO_PAR:
                return this._object.angleParentOnScreen + this.headAngle;
            case CML.State.HO_VEL:
                return this._object.angleVelocity + this.headAngle;
            case CML.State.HO_SEQ:
                return base + this.headAngle;
            default:
                throw new Error("BUG!! unknown error in CML.Fiber._getAngle()"); // ???
        }
        return 0;
    }
    // rotate object in minimum rotation (call from CML.State.r())
    /** @private _cml_fiber_internal */
    _isShortestRotation() {
        return (this.headAngleOption == CML.State.HO_AIM || this.headAngleOption == CML.State.HO_VEL);
    }
    // invertion
    //--------------------------------------------------
    _invertAngle(ang) {
        if (this.invertFlag & 1)
            ang = -ang;
        if (this.invertFlag & 2)
            ang = 3.141592653589793 - ang;
        return ang;
    }
    _invertRotation(rot) {
        return (this.invertFlag == 1 || this.invertFlag == 2) ? -rot : rot;
    }
    _invertX(x) {
        return (this.invertFlag & 2) ? -x : x;
    }
    _invertY(y) {
        return (this.invertFlag & 1) ? -y : y;
    }
    // static function
    //------------------------------------------------------------
    /** @private _cml_fiber_internal destroy all */
    static _destroyAll() {
        var activeFibers = CML.Fiber._rootFiber._listChild;
        if (activeFibers.isEmpty())
            return;
        var elem = activeFibers.begin, elem_end = activeFibers.end, elem_next;
        while (elem != elem_end) {
            elem_next = elem.next;
            elem._finalize();
            elem = elem_next;
        }
    }
    // initialize, call from CannonML first
    /** @private */
    static _initialize(globalVariables_) {
        CML.Fiber._globalVariables = globalVariables_;
        CML.Fiber._destroyAll();
    }
    // 1 frame execution for all fibers
    /** @private _cml_fiber_internal */
    static _updateAll() {
        const activeFibers = CML.Fiber._rootFiber._listChild;
        if (activeFibers.isEmpty())
            return;
        let elem = activeFibers.begin, elem_end = activeFibers.end;
        while (elem != elem_end) {
            elem = elem._onUpdate();
        }
    }
    // new fiber
    /** @private _cml_fiber_internal call only from CML.Object.execute() */
    static _newRootFiber(obj, seq, args_, invertFlag) {
        if (seq.isEmpty)
            return null;
        var fbr = CML.Fiber._freeFibers.pop() || new CML.Fiber();
        fbr.insert_before(CML.Fiber._rootFiber._firstDest); // child of root
        fbr._initialize(CML.Fiber._rootFiber, obj, seq, 0, invertFlag, args_); // the generation is counted from root
        return fbr;
    }
    /** @private _cml_fiber_internal call only from the '&#64;' command (CML.State._fiber()) */
    _newChildFiber(seq, id, invertFlag, args_, copyParam) {
        if (id != CML.Fiber.ID_NOT_SPECIFYED)
            this.destroyChild(id); // destroy old fiber, when id is obtained
        if (seq.isEmpty)
            return null;
        var fbr = CML.Fiber._freeFibers.pop() || new CML.Fiber();
        fbr.insert_before(this._firstDest); // child of this
        if (!fbr._initialize(this, this._object, seq, id, invertFlag, args_)) { // the generation is counted from root
            throw new Error("CML Exection error. The '@' command calls depper than stac limit.");
        }
        if (copyParam)
            fbr._copy_param(this); // copy parameters from parent
        return fbr;
    }
    /** @private _cml_fiber_internal call only from the '&#64;ko' command (CML.State._fiber_destruction()) */
    _newDestFiber(seq, id, invertFlag, args_) {
        this._killDestFiber(id); // destroy old fiber
        if (seq.isEmpty)
            return null;
        var fbr = CML.Fiber._freeFibers.pop() || new CML.Fiber();
        // set destruction sequence
        fbr._seqWaitDest = fbr._seqWaitDest || CML.Sequence.newWaitDestruction();
        fbr._seqWaitDest.next.jump = seq;
        fbr.insert_before(this._firstDest); // child of this
        this._firstDest = fbr; // overwrite first destruction fiber
        if (!fbr._initialize(this, this._object, fbr._seqWaitDest, id, invertFlag, args_)) {
            throw new Error("CML Exection error. The '@ko' command calls deeper than stac limit.");
        }
        return fbr;
    }
    /** @private _cml_fiber_internal call from the 'n', 'f' or '&#64;o' command (search in CML.State) */
    _newObjectFiber(obj, seq, invertFlag, args_) {
        if (seq.isEmpty)
            return null;
        var fbr = CML.Fiber._freeFibers.pop() || new CML.Fiber();
        fbr.insert_before(CML.Fiber._rootFiber._firstDest); // child of root
        if (!fbr._initialize(this, obj, seq, 0, invertFlag, args_)) { // the generation is counted from this
            throw new Error("CML Exection error. The 'n', 'f' or '@o' command calls deeper than stac limit.");
        }
        return fbr;
    }
    // destroy all fibers
    /** @private _cml_fiber_internal call from CML.Object.halt() */
    static _destroyAllFibers(obj) {
        var fibers = CML.Fiber._rootFiber._listChild, elem = fibers.begin, elem_end = fibers.end;
        while (elem != elem_end) {
            elem = elem._destroyByObject(obj);
        }
    }
}
// static variables
//------------------------------------------------------------
/** @private _cml_fiber_internal default target instance */
CML.Fiber._defaultTarget = null;
// executable looping max limitation in 1 frame
/** @private _cml_fiber_internal */ CML.Fiber._loopmax = 1024;
// executable gosub max limitation
/** @private _cml_fiber_internal */ CML.Fiber._stacmax = 64;
// id not specifyed 
/** @private _cml_fiber_internal */ CML.Fiber.ID_NOT_SPECIFYED = 0;
// global variables
CML.Fiber._globalVariables = null;
CML.Fiber._freeFibers = new CML.List(); // free list
CML.Fiber._rootFiber = new CML.Fiber(); // root fiber of active fibers
