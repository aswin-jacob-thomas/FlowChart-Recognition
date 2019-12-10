import SRLSubstroke from './substroke.js';
import SRLPoint from './point.js';
import utils from './utils.js';

export default class SRLShape {
    constructor(params) {
        if (params === undefined) {
            params = {};
        }

        if (params.boundingBox !== undefined && params.boundingBox.length === 2 && params.boundingBox[0].constructor === 'SRLPoint' && params.boundingBox[1].constructor === 'SRLPoint') {
            this.boundingBox = params.boundingBox;
        } else if (params.boundingBox && params.boundingBox.length === 2 && params.boundingBox[0].x && params.boundingBox[0].y && params.boundingBox[1].x && params.boundingBox[1].y) {
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

        if (params.strokes !== undefined) {
            this.strokes = params.strokes;
            for (let i = 0; i < params.strokes.length; i++) {
                let stroke = params.strokes[i];
                if (stroke.constructor !== SRLSubstroke) {
                    this.strokes[i] = new SRLSubstroke(stroke);
                }
            }
        }
        this.strokes = params.strokes !== undefined ? params.strokes : [];
        this.interpretation = params.interpretation !== undefined ? params.interpretation : '';
        this.attributes = params.attributes !== undefined ? params.attributes : {};
    }

    setInterpretation(interpretation) {
        this.interpretation = interpretation;
    }

    addSubElement(stroke) {
        this.strokes.push(stroke);
        this.updateBoundingBox(stroke);
    }

    addSubstroke(substroke) {
        this.substrokes.push(substroke);
    }

    getSubstrokes() {
        return this.substrokes;
    }

    getSubstroke(id) {
        for (let substroke of this.strokes) {
            if (substroke.id === id) {
                return substroke;
            }
        }
        return undefined;
    }

    getId() {
        return this.id;
    }

    updateBoundingBox(stroke) {
        if (this.boundingBox.length === 0) {
            this.boundingBox = [new SRLPoint({x: stroke.boundingBox[0].x, y: stroke.boundingBox[0].y}), new SRLPoint({x: stroke.boundingBox[1].x, y: stroke.boundingBox[1].y})];
        }
        if (stroke.boundingBox[0].x < this.boundingBox[0].x) {
            this.boundingBox[0].x = stroke.boundingBox[0].x;
        }
        if (stroke.boundingBox[0].y < this.boundingBox[0].y) {
            this.boundingBox[0].y = stroke.boundingBox[0].y;
        }
        if (stroke.boundingBox[1].x > this.boundingBox[1].x) {
            this.boundingBox[1].x = stroke.boundingBox[1].x;
        }
        if (stroke.boundingBox[1].y > this.boundingBox[1].y) {
            this.boundingBox[1].y = stroke.boundingBox[1].y;
        }
    }
}
