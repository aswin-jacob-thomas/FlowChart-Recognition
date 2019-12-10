import SRLPoint from './point.js';
import utils from './utils.js';

export default class SRLStroke {
    constructor(params) {
        if (params === undefined) {
            params = {};
        }

        if (params.boundingBox !== undefined && params.boundingBox.length === 2 && params.boundingBox[0].constructor === 'SRLPoint' && params.boundingBox[1].constructor === 'SRLPoint') {
            this.boundingBox = params.boundingBox;
        } else {
            this.boundingBox = []; // 1st point is top left (min x and min y). 2nd point is bottom right (max x and max y)
        }

        if (params.points === undefined) {
            this.points = [];
        } else if (params.points.constructor === Array) {
            this.points = params.points;
            for (let i = 0; i < params.points.length; i++) {
                let point = params.points[i];
                if (point.constructor !== SRLPoint) {
                    this.points[i] = new SRLPoint(point);
                }
                this.updateBoundingBox(point);
            }
        }

        if (params.t === undefined) {
            params.t = Date.now();
        }
        if (isNaN(params.t)) {
            throw "Expected a number for time value.";
        }
        this.t = parseInt(params.t);

        this.id = params.id !== undefined ? params.id : utils.generateId();

        this.attributes = params.attributes !== undefined ? params.attributes : {};
    }

    addPoint(point) {
        let lastPoint = this.points[this.points.length - 1];
        if (lastPoint && point.x === lastPoint.x && point.y === lastPoint.y && point.t === lastPoint.t) {
            return;
        }
        this.updateBoundingBox(point);
        this.points.push(point);
    }

    getPoints() {
        return this.points;
    }

    updateBoundingBox(point) {
        if (this.boundingBox.length === 0) {
            this.boundingBox = [new SRLPoint({x: point.x, y: point.y}), new SRLPoint({x: point.x, y: point.y})];
        }
        this.boundingBox[0].x = Math.min(this.boundingBox[0].x, point.x);
        this.boundingBox[0].y = Math.min(this.boundingBox[0].y, point.y);
        this.boundingBox[1].x = Math.max(this.boundingBox[1].x, point.x);
        this.boundingBox[1].y = Math.max(this.boundingBox[1].y, point.y);
    }
}
