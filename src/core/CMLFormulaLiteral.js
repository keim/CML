//----------------------------------------------------------------------------------------------------
// Literal class of formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private */
CML.FormulaLiteral = class {
    constructor(opr) {
        const m = opr.match(/\$(.*?)(\d)?$/);
        if (!m) {
            this.idx = 0;
            this.num = parseFloat(opr);
            this.func = (fbr,idx)=>this.num;
            this.isStatic = true;
        } else {
            this.idx = Number(m[2]||0);
            this.num = 0;
            this.func = CML.FormulaLiteral.operators[m[1]] || CML.Formula._globalVariables._mapUsrDefRef[m[1]];
            this.isStatic = false;
            if (!this.func)
                throw Error(opr + " ?");
        }
    }
    calcDynamic(resultStac, fbr) {
        return this.func(fbr);
    }
    calcStatic(resultStac) {
        return this.num;
    }
}
// Refer from CML.Parser._userReferenceRegExp() to sort all reference names.
CML.FormulaLiteral.operators = {
    "": (fbr,idx)=>((idx) ? fbr.getVeriable(idx-1) : fbr.getVeriable(0)),
    "?": (fbr,idx)=>CML.Formula._globalVariables.rand(),
    "??": (fbr,idx)=>(CML.Formula._globalVariables.rand() * 2 - 1),
    "i": (fbr,idx)=>fbr.getInterval(),
    "r": (fbr,idx)=>((idx) ? CML.Formula._globalVariables.getRank(idx) : fbr.object.rank),
    "l": (fbr,idx)=>fbr.getLoopCounter(idx),
    "x": (fbr,idx)=>fbr.object.pos.x,
    "y": (fbr,idx)=>fbr.object.pos.y,
    "z": (fbr,idx)=>fbr.object.pos.z,
    "sx": (fbr,idx)=>((fbr.object.pos.x < 0) ? -1 : 1),
    "sy": (fbr,idx)=>((fbr.object.pos.y < 0) ? -1 : 1),
    "sz": (fbr,idx)=>((fbr.object.pos.z < 0) ? -1 : 1),
    "v": (fbr,idx)=>fbr.object.velocity,
    "vx": (fbr,idx)=>fbr.object.vel.x,
    "vy": (fbr,idx)=>fbr.object.vel.y,
    "vz": (fbr,idx)=>fbr.object.vel.z,
    "ho": (fbr,idx)=>fbr.object.angleOnScreen,
    "td": (fbr,idx)=>fbr.object.getDistance(fbr.target),
    "o": (fbr,idx)=>((idx) ? fbr.object.countIDedChildren(idx) : fbr.object.countAllIDedChildren()),
    "p.x": (fbr,idx)=>fbr.object.parent.pos.x,
    "p.y": (fbr,idx)=>fbr.object.parent.pos.y,
    "p.z": (fbr,idx)=>fbr.object.parent.pos.z,
    "p.sx": (fbr,idx)=>((fbr.object.parent.pos.x < 0) ? -1 : 1),
    "p.sy": (fbr,idx)=>((fbr.object.parent.pos.y < 0) ? -1 : 1),
    "p.sz": (fbr,idx)=>((fbr.object.parent.pos.z < 0) ? -1 : 1),
    "p.v": (fbr,idx)=>fbr.object.parent.velocity,
    "p.vx": (fbr,idx)=>fbr.object.parent.vel.x,
    "p.vy": (fbr,idx)=>fbr.object.parent.vel.y,
    "p.vz": (fbr,idx)=>fbr.object.parent.vel.z,
    "p.ho": (fbr,idx)=>fbr.object.parent.angleOnScreen,
    "p.td": (fbr,idx)=>fbr.object.parent.getDistance(fbr.target),
    "p.o": (fbr,idx)=>((idx) ? fbr.object.parent.countIDedChildren(idx) : fbr.object.parent.countAllIDedChildren()),
    "t.x": (fbr,idx)=>fbr.target.pos.x,
    "t.y": (fbr,idx)=>fbr.target.pos.y,
    "t.z": (fbr,idx)=>fbr.target.pos.z,
    "t.sx": (fbr,idx)=>((fbr.target.pos.x < 0) ? -1 : 1),
    "t.sy": (fbr,idx)=>((fbr.target.pos.y < 0) ? -1 : 1),
    "t.sz": (fbr,idx)=>((fbr.target.pos.z < 0) ? -1 : 1),
    "t.v": (fbr,idx)=>fbr.target.velocity,
    "t.vx": (fbr,idx)=>fbr.target.vel.x,
    "t.vy": (fbr,idx)=>fbr.target.vel.y,
    "t.vz": (fbr,idx)=>fbr.target.vel.z,
    "t.ho": (fbr,idx)=>fbr.target.angleOnScreen,
    "t.td": (fbr,idx)=>0,
    "t.o": (fbr,idx)=>((idx) ? fbr.target.countIDedChildren(idx) : fbr.target.countAllIDedChildren()),
};
