import SRLSubstroke from '../substroke.js';
import SRLPoint from '../point.js';

export default function segment(stroke) {
    // Get points of a stroke
    let points = stroke.getPoints().slice(0);
    if (points.length < 2) {
        return [new SRLSubstroke({parent: stroke, points: points, t: points[0].getTime()})];
    }

    // Resampled points for shortstraw
    let resampled = [];
    let originalIndices = []; // Original indices of points after the resampled point

    // Get bounding box
    let minCorner = stroke.boundingBox[0];
    let maxCorner = stroke.boundingBox[1];
    let diagonalLength = minCorner.distance(maxCorner);

    let spacing = diagonalLength / 40;

    // Do resampling
    let dist = 0;
    resampled.push(points[0]);
    originalIndices.push(0);
    let j = 1;
    while (j < points.length) {
        dist += points[j].distance(points[j - 1]);
        while (dist > spacing) {
            let ratio = (1 - ((dist - spacing) / points[j].distance(points[j - 1]))); // Ratio between point j-1 and j to create the respaced point
            let x = ratio * (points[j].getX() - points[j - 1].getX()) + points[j - 1].getX(); // Ratio from j-1 point to j point * x difference + x initial (x[j-1])
            let y = ratio * (points[j].getY() - points[j - 1].getY()) + points[j - 1].getY(); // Ratio from j-1 point to j point * y difference + y initial (y[j-1])
            let t = ratio * (points[j].t - points[j - 1].t) + points[j - 1].t;
            let newPoint = new SRLPoint({x: x, y: y, t: t});
            resampled.push(newPoint);
            dist = points[j].distance(newPoint); // Reset distance travelled to the rest of the distance from resampled point to the next point.
            originalIndices.push(j); // Index of original point after the resampled point.
        }
        j++;
    }

    let strawLengths = [];
    let w = 3; // Window size 3 points plus/minus
    for (let j = w ; j < resampled.length - w; j++) {
        strawLengths.push(resampled[j - w].distance(resampled[j + w]));
    }

    // Finding median length.
    let median = 0;
    let sortedStraws = strawLengths.slice(0).sort(); // Sort changes the array so clone the array (strawLengths.slice(0)) and then sort the clone.
    if (sortedStraws.length % 2 == 0) { // Even number of points means median is an average of middle 2 values.
        median = (sortedStraws[sortedStraws.length / 2 - 1] + sortedStraws[sortedStraws.length / 2]) / 2; // Average middle 2 values for median.
    } else {
        median = sortedStraws[Math.floor(sortedStraws.length / 2)]; // Median is middle value of sorted array.
    }

    // Finding corners.
    let threshhold = median * 0.85;
    let substrokes = [];
    let cornerIndices = [0]; // Indices of corners in the resampled points array and originalIndices array
    for (let j = 0; j < strawLengths.length; j++) {
        if (strawLengths[j] < threshhold) { // Potentially a corner
            // Local min is less than the 2 surrounding points. Alternatively the 1st point is less than the next point and the last point is less than the previous point.
            if ((strawLengths[j] < strawLengths[j - 1] && strawLengths[j] < strawLengths[j + 1]) || (strawLengths[j] < strawLengths[j + 1] && j == 0) || (strawLengths[j] < strawLengths[j - 1] && j == strawLengths.length - 1)) {
                cornerIndices.push(j + w);
            }
        }
    }
    cornerIndices.push(strawLengths.length - 1 + 2*w); // strawLengths doesn't account for w points before 1st straw and w points after last straw position, so add 2w to get the last point

    let i = 0;
    while (i < cornerIndices.length - 1) { // Search for missed corners in between each pair of corners
        if (!isLine(resampled.slice(cornerIndices[i], cornerIndices[i+1] + 1))) {
            let minIdx = Math.floor(cornerIndices[i] - w + 0.2*(cornerIndices[i+1] - cornerIndices[i])); // Ignore 1st 20% of stroke. Subtract w b/c the indices have w added to account for the 1st 3 straws not existing
            let maxIdx = Math.ceil(cornerIndices[i+1] - w - 0.2*(cornerIndices[i+1] - cornerIndices[i])); // Ignore last 20% of stroke
            let minStrawIdx = minIdx;
            for (let j = minIdx; j <= maxIdx; j++) { // We don't want the
                if (strawLengths[j] < strawLengths[minStrawIdx]) {
                    minStrawIdx = j;
                }
            }
            if (minStrawIdx + w > cornerIndices[i] && minStrawIdx + w < cornerIndices[i+1]) { // Must be between existing corners. Existing already have window size added
                cornerIndices.splice(i+1, 0, minStrawIdx + w); // Add new corner idx between the 2 corners
            } else { // Keep moving if we don't add a corner
                i++;
            }
        } else {
            i++;
        }
    }

    i = 0;
    while (i < cornerIndices.length - 2) {
        if (isLine(resampled.slice(cornerIndices[i], cornerIndices[i+2]))) {
            cornerIndices.splice(i+1, 1); // Delete the corner in the middle of the colinear triplet
        } else {
            i++;
        }
    }

    points = stroke.getPoints();
    for (let i = 0; i < cornerIndices.length - 1; i++) {
        if (cornerIndices[i+1] - cornerIndices[i] < 5) { // Very likely a false positive if there are less than 5 points between corners
            cornerIndices.splice(i, 1);
            i--;
            continue;
        }
        let subPoints = points.slice(originalIndices[cornerIndices[i]], originalIndices[cornerIndices[i + 1]]);
        if (subPoints.length < 5) { continue; }
        let substroke = new SRLSubstroke({parent: stroke, points: subPoints, t: subPoints[0].getTime()});
        substrokes.push(substroke);
    }

    return substrokes;
}

function isLine(points) {
    let ratio = 0.95;
    let pathLen = 0;
    if (!points || points.length < 2) return false;
    let dist = SRLPoint.distance(points[0], points[points.length - 1]);
    for (let i = 0; i < points.length - 1; i++) {
        pathLen += SRLPoint.distance(points[i], points[i+1]);
    }
    return (dist / pathLen) >= ratio;
}