/* global paper */
import { Sketch } from '../sketch/SRL.js';

export default class SketchSurface {
    constructor(canvasId) {
        if (!canvasId) {
            throw 'Need a canvasId to create a sketch surface';
        }

        let canvas = document.querySelector(`canvas#${canvasId}`);
        if (!canvas) {
            throw `Canvas with ID ${canvasId} not found`;
        }

        canvas.dataset.paperIndex = paper.setup(canvasId).project._index;

        this.paperProject = paper.project;
        this.canvasHeight = paper.view.size.height;
        this.canvasWidth = paper.view.size.width;

        this.sketch = new Sketch();
        this.paperProject;
        this.canvasHeight = 0;
        this.canvasWidth = 0;
        this.strokeColor = '#999';
        this.strokeWidth = 2;
        this.strokes = {};
        this.activePaperPath = undefined;
        this.activeSRLStroke = undefined;
        this.paperToSRL = {};
        this.srlToPaper = {};

        this.drawTool = createDrawTool(this);
        this.eraseTool = createEraseTool(this);

        paper.project.sketchSurface = this;
        paper.project.name = canvasId;
    }

    // Clears the canvas of all elements
    clear() {
        for (let i = 0; i < this.paperProject.layers.length; i++) {
            this.paperProject.layers[i].removeChildren();
        }
    }

    // Redraws the given sketch and sets it as the sketch for this sketch surface
    redrawSketch(sketch) {
        this.sketch = sketch;
        for (let id in sketch.strokes) {
            this.redrawStroke(sketch.strokes[id]);
        }
    }

    createPaperPath(style) {
        let path = new paper.Path({ strokeColor: this.strokeColor, strokeWidth: this.strokeWidth, name: 'stroke' });
        if (style) { path.style = style; }

        let highlightPath = new paper.Path({ strokeColor: 'red', strokeWidth: 5, name: 'highlight' });
        highlightPath.strokeColor.alpha = 0.0001; // PaperJS does not trigger onMouseEnter if alpha is 0. This workaround hides the element still while allowing onMouseEnter

        highlightPath.onMouseEnter = function() {
            if (paper.tool.name === 'erase' && this.parent.erasable) {
                this.strokeColor.alpha = 1;
            }
        };

        highlightPath.onMouseLeave = function() {
            if (this.strokeColor.alpha === 1) {
                this.strokeColor.alpha = 0.0001;
            }
        };

        this.activePaperPath = new paper.Group([path, highlightPath]);
        this.activePaperPath.erasable = true;
        return this.activePaperPath;
    }

    createSRLStroke() {
        this.activeSRLStroke = new Sketch.Stroke();
        this.activeSRLStroke.attributes = { color: this.strokeColor, width: this.strokeWidth };
        return this.activeSRLStroke;
    }

    addPaperPoint(x, y) {
        this.activePaperPath.children.stroke.add(x, y);
        this.activePaperPath.children.highlight.add(x, y);
    }

    addSRLPoint(x, y) {
        let newPoint = new Sketch.Point({x: x, y: y, t: Date.now()});
        this.activeSRLStroke.addPoint(newPoint);
    }

    redrawStroke(stroke, style) {
        if (!stroke) return;
        if (!style) style = stroke.attributes;

        let group = this.createPaperPath(style);
        if (stroke.parent === undefined) {
            this.srlToPaper[stroke.id] = group;
            this.paperToSRL[group.id] = stroke.id;
        } else {
            this.srlToPaper[stroke.parent] = group;
            this.paperToSRL[group.id] = stroke.parent;
        }

        for (let point of stroke.points) {
            this.addPaperPoint(point.x, point.y);
        }
        return group;
    }
}

function createDrawTool(sketchSurface) {
    let drawTool = new paper.Tool();
    drawTool.name = 'draw';

    drawTool.onMouseDown = function(event) {
        let paperGroup = sketchSurface.createPaperPath();
        let srlStroke = sketchSurface.createSRLStroke();

        sketchSurface.paperToSRL[paperGroup.id] = srlStroke.id;
        sketchSurface.srlToPaper[srlStroke.id] = paperGroup;

        sketchSurface.addPaperPoint(event.point.x, event.point.y);
        sketchSurface.addSRLPoint(event.point.x, event.point.y);
    };

    drawTool.onMouseDrag = function(event) {
        sketchSurface.addPaperPoint(event.point.x, event.point.y);
        sketchSurface.addSRLPoint(event.point.x, event.point.y);
    };

    drawTool.onMouseUp = function(event) {
        sketchSurface.sketch.addStroke(sketchSurface.activeSRLStroke);
        if (sketchSurface.recognize) sketchSurface.recognize(sketchSurface.sketch);
        sketchSurface.activePaperPath.visible=false;
    };
    return drawTool;
}

function createEraseTool(sketchSurface) {
    let eraseTool = new paper.Tool();
    eraseTool.name = 'erase';
    eraseTool.onMouseDown = erase;
    eraseTool.onMouseDrag = erase;
    return eraseTool;

    function erase(event) {
        let hits = paper.project.hitTestAll(event.point, {
            segments: true,
            fill: true,
            class: paper.Path,
            tolerance: 5,
            stroke: true
        });

        let removedIds = [];
        for (let i = 0; i < hits.length; i++) {
            let hit = hits[i];
            if (!hit.item.parent || !hit.item.parent.erasable) { continue; }
            if (hit.item.parent.constructor !== paper.Group) { continue; }
            hit.item.parent.remove();
            let sketch = sketchSurface.sketch;
            let paperId = hit.item.parent.id;
            let srlId = sketchSurface.paperToSRL[paperId];
            sketch.removeStroke(srlId);
            removedIds.push(srlId);
            delete sketchSurface.srlToPaper[srlId];
            delete sketchSurface.paperToSRL[paperId];
        }

        if (sketchSurface.onErase) sketchSurface.onErase(removedIds);
    }
}
