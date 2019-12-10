import SRLStroke from './stroke.js';
import SRLPoint from './point.js';
import utils from './utils.js';

export default class SRLSubstroke {
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

        if (params.parent && params.parent.constructor === SRLStroke) {
            this.parent = params.parent.id;
        } else {
            this.parent = params.parent;
        }

        this.id = params.id !== undefined ? params.id : utils.generateId();
    }

    addPoint(point) {
        this.updateBoundingBox(point);
        this.points.push(point);
    }

    getPoints() {
        return this.points;
    }

    getId() {
        return this.id;
    }

    get firstPoint() {
        return this.points[0];
    }

    get lastPoint() {
        return this.points[this.points.length - 1];
    }

    get pathDistance() {
        let totalDist = 0;
        for (let i = 1; i < this.points.length; i++) {
            totalDist += this.points[i].distance(this.points[i - 1]);
        }
        return totalDist;
    }

    // Returns angle in radians
    get angle() {
        // Since y values increase going downwards in computer graphics, the y value difference must be negated to get the correct angle in a regular math coordinate system.
        return Math.atan2(this.firstPoint.y - this.lastPoint.y, this.lastPoint.x - this.firstPoint.x);
    }

    // Can be a Point object or x and y
    withinBoundingBox(x, y) {
        if (x.constructor === SRLPoint) {
            y = x.y;
            x = x.x;
        }
        return (x > this.boundingBox[0].x && x < this.boundingBox[1].x && y > this.boundingBox[0].y && y < this.boundingBox[1].y);
    }

    intersects(sub, threshold) {
        if (!threshold) {
            threshold = 25;
        }

        // Check if the intersection point is in the drawn section of both lines
        let pt = this.getIntersectingPoint(sub);
        if (!pt) { return false; }
        let inLine1 = this.getDistanceFromSubstroke(pt) < threshold;
        let inLine2 = sub.getDistanceFromSubstroke(pt) < threshold;
        // let inLine1 = this.withinBoundingBox(pt) || this.points[0].distance(pt) < threshold || this.points[this.points.length - 1].distance(pt) < threshold;
        // let inLine2 = sub.withinBoundingBox(pt) || sub.points[0].distance(pt) < threshold || sub.points[sub.points.length - 1].distance(pt) < threshold;
        return (inLine1 && inLine2);
    }

    // Checks if the substroke intersects the given substroke (sub) at least threshold distance from sub's endpoints
    intersectsMiddle(sub, threshold) {
        if (!threshold) {
            threshold = 25;
        }
        if (!this.intersects(sub, threshold)) {
            return false;
        }
        let pt = this.getIntersectingPoint(sub);
        return (sub.points[0].distance(pt) > threshold && sub.points[sub.points.length - 1].distance(pt) > threshold);
    }

    getDistanceFromSubstroke(point) {
        let v = pointDiff(this.points[this.points.length - 1], this.points[0]);

        let w = pointDiff(point, this.points[0]);
        let c1 = dot(w, v);
        if (c1 <= 0) {
            let projection = pointDiff(point, this.points[0]);
            return Math.sqrt(dot(projection, projection));
        }

        let c2 = dot(v, v);
        if (c2 <= c1) {
            let projection = pointDiff(point, this.points[this.points.length - 1]);
            return Math.sqrt(dot(projection, projection));
        }

        let b = c1 / c2;
        let x = this.points[0].x + b * v.x;
        let y = this.points[0].y + b * v.y;
        let projection = pointDiff(point, {x: x, y: y});
        return Math.sqrt(dot(projection, projection));
    }

    getIntersectingPoint(sub) {
        if (!sub) return undefined;
        let expectedPoint = this.getExpectedIntersection(sub);
        if (!this.points || !this.points.length > 0 || !expectedPoint) return undefined;
        let minDist = this.points[0].distance(expectedPoint);
        let minIdx = 0;
        for (let i = 1; i < this.points.length; i++) {
            let dist = this.points[i].distance(expectedPoint);
            if (dist < minDist) {
                minDist = dist;
                minIdx = i;
            }
        }
        return this.points[minIdx];
    }

    getExpectedIntersection(sub) {
        if (!sub) { return undefined; }
        let x1 = this.points[0].x, y1 = this.points[0].y;
        let x2 = this.points[this.points.length - 1].x, y2 = this.points[this.points.length - 1].y;
        let x3 = sub.points[0].x, y3 = sub.points[0].y;
        let x4 = sub.points[sub.points.length - 1].x, y4 = sub.points[sub.points.length - 1].y;

        // Calculate slopes
        let m1 = (y2 - y1) / (x2 - x1);
        let m2 = (y4 - y3) / (x4 - x3);
        if (Math.abs(m1) === Infinity) { m1 = Infinity; }
        if (Math.abs(m2) === Infinity) { m2 = Infinity; }
        if (m1 === m2) {
            return undefined;
        }

        // Calculate y-intercepts
        let b1 = y1 - m1*x1;
        let b2 = y3 - m2*x3;

        // Find x and y values
        let x = undefined, y = undefined;
        if (m1 === Infinity) {
            x = x1;
            y = m2 * x + b2;
        } else if (m2 === Infinity) {
            x = x2;
            y = m1 * x + b1;
        } else {
            // Set y = mx+b for each equation equal to each other and solve for x.
            x = (b2 - b1) / (m1 - m2);
            y = m1 * x + b1;
        }
        if (isNaN(x) || isNaN(y)) { return undefined; }
        return new SRLPoint({x: x, y: y});
    }

    updateBoundingBox(point) {
        if (this.boundingBox.length === 0) {
            this.boundingBox = [new SRLPoint({x: point.x, y: point.y}), new SRLPoint({x: point.x, y: point.y})];
        }
        if (point.x < this.boundingBox[0].x) {
            this.boundingBox[0].x = point.x;
        }
        if (point.y < this.boundingBox[0].y) {
            this.boundingBox[0].y = point.y;
        }
        if (point.x > this.boundingBox[1].x) {
            this.boundingBox[1].x = point.x;
        }
        if (point.y > this.boundingBox[1].y) {
            this.boundingBox[1].y = point.y;
        }
    }
}

function dot(a, b) {
    return (a.x * b.x + a.y * b.y);
}

function pointDiff(a, b) {
    return {x: a.x - b.x, y: a.y - b.y};
}
