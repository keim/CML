//----------------------------------------------------------------------------------------------------
// CML runner class
//  Copyright (c) 2016 kei mesuda(keim) ALL RIGHTS RESERVED.
//  This code is under BSD-style(license.txt) licenses.
//----------------------------------------------------------------------------------------------------
//import CMLObject from "./core/CMLObject.js";
//import CMLFiber from "./CMLFiber.js";
/** CML.Runner provides CML.Object with Fiber and Sequence  */
CML.Runner = class extends CML.Object {
    // constructor
    //------------------------------------------------------------
    /** @private constractor call in CannonML._newCMLRunner() */
    constructor(createdby_, sequence_) {
        super();
        // executing sequence
        this._sequence = sequence_;
        // created by
        this._createdby = createdby_;
        // callback functions
        this._onCreateNewRunner = createdby_ && createdby_._onCreateNewRunner;
        this._onDestroy = createdby_ && createdby_._onDestroy;
        this._onUpdate = createdby_ && createdby_._onUpdate;
        this.scopeEnabled = true;
    }
    // variables
    //------------------------------------------------------------
    /** executing sequence */
    get sequence() { return this._sequence; }
    /** set callback functions
     *  @param hash Hash indludes callback functions 'onCreateNewRunner', 'onDestroy' and 'onUpdate'. The callback functions give the CML.Runnner insatnace to move your object.
     */
    setCallbackFunctions(hash) {
        if (hash.onCreateNewRunner)
            this._onCreateNewRunner = hash.onCreateNewRunner;
        if (hash.onDestroy)
            this._onDestroy = hash.onDestroy;
        if (hash.onUpdate)
            this._onUpdate = hash.onUpdate;
    }
    // operation
    //------------------------------------------------------------
    /** Execute a sequence.
     *  @param seq The sequencye to execute.
     *  @param args The array of arguments to execute sequence.
     *  @param invertFlag The flag to invert execution same as 'm' command.
     *  @return Instance of fiber that execute the sequence.
     */
    execute(seq, args = null, invertFlag = 0) {
        return CML.Fiber._newRootFiber(this, seq, args, invertFlag);
    }
    /** Stop all fibers of object. This function is slow.
     *  If you want to execute faster, keep returned CML.Fiber of CML.Object.execute() and call CML.Fiber.destroy() wherever possible.
     *  @param obj object to halt motion sequence.
     *  @see CML.Runner#execute()
     *  @see CML.Fiber#destroy()
     */
    halt() {
        CML.Fiber._destroyAllFibers(this);
    }
    // callback functions
    //------------------------------------------------------------
    /** @private */
    onCreate() {
        if (this._createdby && this._createdby._onCreateNewRunner) {
            this._createdby._onCreateNewRunner(this);
        }
    }
    /** @private */
    onDestroy() {
        if (this._onDestroy) {
            this._onDestroy(this);
        }
    }
    /** @private */
    onUpdate() {
        if (this._onUpdate) {
            this._onUpdate(this);
        }
        if (this.destructionStatus < 0 && this.scopeEnabled) {
            const hw = CML.Object._globalVariables._halfScreenWidth,
                  hh = CML.Object._globalVariables._halfScreenHeight;
            if (this.pos.x < -hw || hw < this.pos.x || this.pos.y < -hh || hh < this.pos.y) 
                this.destroy(CML.Runner.ESCAPE_STATUS);
        }
    }
    /** @private */
    onFireObject(seq) {
        return new CML.Runner(this, seq);
    }
}

/* destory status for escape */
CML.Runner.ESCAPE_STATUS = 999999;