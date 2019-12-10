import Stroke from './stroke.js';
import Substroke from './substroke.js';
import Shape from './shape.js';
import Point from './point.js';
import utils from './utils.js';

export default class Sketch {
    constructor() {
        this.boundingBox = []; // 1st point is top left (min x and min y). 2nd point is bottom right (max x and max y)
        let t = Date.now();
        this.t = parseInt(t);
        this.id = utils.generateId();
        this.strokes = {};
        this.substrokes = {};
        this.shapes = {};
        this.deleted = {strokes: {}, substrokes: {}, shapes: {}};
    }

    addStroke(stroke) {
        this.strokes[stroke.id] = stroke;
        this.updateBoundingBox(stroke);
    }

    addSubstroke(newSub) {
        this.substrokes[newSub.id] = newSub;
        for (let id of Object.keys(this.substrokes)) {
            if (id === newSub.id) { continue; }
            let sub = this.substrokes[id];
            var split = false; // Whether a substroke split occurs
            var splitter = undefined; // Substroke that splits another substroke
            var splitee = undefined; // Substroke to split
            if (newSub && sub && newSub.intersectsMiddle(sub)) { // Newsub intersects the middle of sub, so split sub
                split = true;
                splitter = newSub;
                splitee = sub;
            } else if (newSub && sub && sub.intersectsMiddle(newSub)) {
                split = true;
                splitter = sub;
                splitee = newSub;
            }
            if (split) {
                let pt = splitter.getIntersectingPoint(splitee);
                let dist = splitee.points[0].distance(pt);
                let splitIdx = 0;
                let minDist = dist;
                for (let i = 1; i < splitee.points.length; i++) {
                    let dist = splitee.points[i].distance(pt);
                    if (dist < minDist) {
                        minDist = dist;
                        splitIdx = i;
                    }
                }

                // Both new substrokes will contain the point that they are split on
                if (splitIdx <= Math.ceil(0.2*splitee.points.length) || splitIdx >= Math.floor(0.8*splitee.points.length)) {
                    continue;
                }
                let newSub1 = new Substroke({parent: splitee.parent, points: splitee.points.slice(0, splitIdx + 1), t: splitee.points[0].t});
                let newSub2 = new Substroke({parent: splitee.parent, points: splitee.points.slice(splitIdx, splitee.points.length), t: splitee.points[splitIdx].t});
                delete this.substrokes[splitee.id];
                this.addSubstroke(newSub1);
                this.addSubstroke(newSub2);
                return; // If the for loop continues, duplicate substrokes may occur from multiple intersecting substrokes at the same point.
            }
        }
    }

    addShape(shape) {
        this.shapes[shape.id] = shape;
    }

    // Returns an array with the shapes that have the same interpretation as the parameter
    findShapes(interpretation) {
        let shapes = [];
        for (let id in this.shapes) {
            if (this.shapes[id].interpretation === interpretation) {
                shapes.push(this.shapes[id]);
            }
        }
        return shapes;
    }

    removeStroke(id) {
        if (!this.strokes[id]) { return; }
        for (var subId of Object.keys(this.substrokes)) {
            if (this.substrokes[subId].parent === id) {
                this.deleted.substrokes[subId] = this.substrokes[subId];
                this.deleted.substrokes[subId].deletedTime = Date.now();
                delete this.substrokes[subId];
            }
        }

        for (var shapeId of Object.keys(this.shapes)) {
            for (let substroke of this.shapes[shapeId].strokes) {
                if (substroke.parent === id) { // Shape containing this stroke
                    this.deleted.shapes[shapeId] = JSON.parse(JSON.stringify(this.shapes[shapeId]));
                    this.deleted.shapes[shapeId].deletedTime = Date.now();
                    for (var i = 0; i < this.shapes[shapeId].strokes.length; i++) {
                        let substroke = this.shapes[shapeId].strokes[i];
                        if (substroke.parent !== id) { // Move substrokes from other strokes back to unrecognized substrokes
                            this.addSubstroke(substroke);
                            delete this.shapes[shapeId].strokes[i];
                        }
                    }
                    delete this.shapes[shapeId];
                    break;
                }
            }
        }
        this.deleted.strokes[id] = this.strokes[id];
        this.deleted.strokes[id].deletedTime = Date.now();
        delete this.strokes[id];
    }

    getSubstrokes() {
        return this.substrokes;
    }

    updateBoundingBox(stroke) {
        if (this.boundingBox.length === 0) {
            this.boundingBox = [new Point({x: stroke.boundingBox[0].x, y: stroke.boundingBox[0].y}), new Point({x: stroke.boundingBox[1].x, y: stroke.boundingBox[1].y})];
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

    static deserialize(sketchString) {
        let temp = JSON.parse(sketchString);
        let sketch = new Sketch();
        sketch.id = temp.id;
        sketch.t = temp.t;

        for (let id in temp.shapes) {
            sketch.addShape(new Shape(temp.shapes[id]));
        }

        for (let id in temp.strokes) {
            sketch.addStroke(new Stroke(temp.strokes[id]));
        }

        for (let id in temp.substrokes) {
            sketch.addSubstroke(new Substroke(temp.substrokes[id]));
        }

        return sketch;
    }
}

Sketch.Point = Point;
Sketch.Shape = Shape;
Sketch.Stroke = Stroke;
Sketch.Substroke = Substroke;
