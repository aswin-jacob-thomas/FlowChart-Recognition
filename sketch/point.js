import utils from './utils.js';

export default class SRLPoint {
    constructor(params) {
        if (params === undefined) {
            params = {};
        }

        if (params.x === undefined || params.y === undefined) {
            throw "x and y values are required to create a point.";
        }
        if (isNaN(params.x) || isNaN(params.y)) {
            throw "Expected number values for x and y."
        }
        if (params.t === undefined) {
            params.t = Date.now();
        }
        if (isNaN(params.t)) {
            throw "Expected a number for time value.";
        }
        if (params.p !== undefined && isNan(params.p)) {
            throw "Expected a number for presure value.";
        }

        this.x = parseFloat(params.x);
        this.y = parseFloat(params.y);
        this.t = parseInt(params.t);
        if (params.p !== undefined) {
            this.p = parseFloat(params.p);
        }
        this.id = params.id !== undefined ? params.id : utils.generateId();

        var paramsCopy = JSON.parse(JSON.stringify(params));
        delete paramsCopy.x;
        delete paramsCopy.y;
        delete paramsCopy.t;
        delete paramsCopy.p;
        delete paramsCopy.id;
        for (var prop of Object.keys(paramsCopy)) {
            this[prop] = paramsCopy[prop];
        }
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    getTime() {
        return this.t;
    }

    distance(p2) {
        return Math.sqrt((this.x - p2.x)**2 + (this.y - p2.y)**2);
    }

    static distance(p1, p2) {
        if (!p2) { p2 = this; }
        return Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
    }
}
