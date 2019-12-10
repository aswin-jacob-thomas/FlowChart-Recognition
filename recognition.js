/* global paper */
import { Sketch, recognizers } from './sketch/SRL.js';
import SketchSurface from './sketchSurface/sketchSurface.js';
import DollarRecognizer from './sketch/recognizers/dollar.js';
import FlowChart from './sketch/recognizers/flowchart.js'
import Figure from './figure.js'
import Metrics from './metrics.js'

/***** Don't edit until the comment saying to edit bleow unless you know what you are doing *****/
let sketchSurface, sketch;

// These make debugging in the console easier.
let unique_label_counter = 64;
window.sketchSurface = sketchSurface;
window.sketch = sketch;
window.figures = []
let ellipse_text = null;
let dollar = new DollarRecognizer();
let flowChart = new FlowChart();
document.getElementById('psuedo').value='';
let metric = {}
metric['ellipse'] = new Metrics('ellipse');
metric['square'] = new Metrics('square');
metric['rectangle'] = new Metrics('rectangle');
metric['diamond'] = new Metrics('diamond');
metric['line'] = new Metrics('line');

document.addEventListener('DOMContentLoaded', function() {
    attachClickHandlers();
    sketchSurface = new SketchSurface('sketchCanvas');
    sketchSurface.recognize = recognize;
    sketchSurface.onErase = onErase;
    sketch = sketchSurface.sketch;
});

function attachClickHandlers() {
    document.getElementById('draw').addEventListener('click', enableDraw);
    document.getElementById('erase').addEventListener('click', enableErase);
    document.getElementById('delete').addEventListener('click', clearCanvases);
    document.getElementById('undo').addEventListener('click', undoLastFigure);
    document.getElementById('generate').addEventListener('click',generatePsuedoCode);
    document.getElementById('isValid').addEventListener('click',isValidFlowChart);
    document.getElementById('metrics').addEventListener('click',generateMetrics);
}

/***** Edit things below this point *****/

// This function is called by sketchSurface on a successful erase. The strokeIds are the already erased strokes
function onErase(strokeIds) {
    strokeIds = new Set(strokeIds);
    for (let shapeId in sketch.deleted.shapes) {
        let shape = sketch.deleted.shapes[shapeId];
        if (shape.interpretation === 'shape') {
            for (let substroke of shape.strokes) {
                if (strokeIds.has(substroke.parent)) {
                    // Do something for removing this type of shape
                    break;
                }
            }
        }
    }
}

function generateMetrics(){
    // console.log($("#line_accuracy").html(123))
    // console.log($("#line_accuracy").html(metric['line'].accuracy()))
    // console.log()
    // $("#line_accuracy").html(metric['line'].accuracy())
    for(let key in metric){
        let accuracy_id = key+"_accuracy";
        let f_id = key+"_f";

        $('#'+accuracy_id).html(metric[key].accuracy());
        $('#'+f_id).html(metric[key].fmeasure());
    }
    $( "#dialog-modal" ).dialog({
        maxHeight: 600,
        // height: 140,
        modal: true,
        width:350
      });
     $( "#dialog-modal" ).show();
}

function printRecursive(head, parent){
    // console.log(head.getToFigures())
    console.log(head.getShape(), " ", head.getLabel().getContent(), " coming from ", parent);
    if(head.getToFigures() == null)
        return;
    for(let fig of head.getToFigures())
        printRecursive(fig, head.getLabel().getContent());
}
let code = '';

function generateCode(head, initialSpace){
    if(head.getShape == 'line')
        return;
    if(head.getShape() != 'ellipse')    
        code += initialSpace + head.getLabel().getContent()+"\n";
    if(head.getToFigures() == null)
        return;
    Array.from(head.getToFigures()).forEach(function(fig, i){
        if(head.getShape() == 'diamond'){
            // console.log(fig,"asdfasdf",i);
            if(i == 0){
                generateCode(fig, ' '+initialSpace);
            }
            else{
                code += initialSpace + 'else\n';
                generateCode(fig, ' '+initialSpace)
            }
        }
        else
            generateCode(fig, initialSpace);
    })
}

function isValidFlowChart(){

}

function generatePsuedoCode(){
   
    code = ''
    
    if(window.figures.length >0){
        code += 'Start\n'
        generateCode(window.figures[0],'');
        code += 'Stop\n';
    }
    
    document.getElementById('psuedo').value = code;
}

let undoDone = false;

function undoLastFigure(){
    console.log("coming inside undo")
    let shape = window.figures[window.figures.length-1].getShape();
    let textFigure = window.figures[window.figures.length-1].getLabel();
    window.figures[window.figures.length-1].getPath().visible = false;
    if(textFigure)
        textFigure.visible = false;
    window.figures.pop();

    if(shape == 'ellipse'){
        if(ellipse_text == 'Stop')
            ellipse_text = 'Start';
        else if(ellipse_text == 'Start')
            ellipse_text = null;
    }

    metric[shape].subtractTP();
    metric[shape].addFP();
    undoDone = true;
}

// This is called every time there is a mouse or pen up event on the canvas
let text;
let new_path;
let rec_shape={};
let center;
let dialog_to_show = createDialog()
function recognize(sketch) {
    let substrokeIds = []
    let lastStroke = sketchSurface.activeSRLStroke;
    // console.log(lastStroke)
    if (lastStroke) { // Segments and places substrokes into sketch.substrokes
        let substrokes = recognizers.Segment(lastStroke);
        for (let i = 0; i < substrokes.length; i++) {
            sketch.addSubstroke(substrokes[i]);
            
        }

    }
    rec_shape={};
    rec_shape['Name'] = flowChart.chartRecognizer(lastStroke, recognizers.Segment(lastStroke));
   
    let BB = lastStroke.boundingBox;
    
    if(rec_shape.Name == 'circle'){
        
        center = new paper.Point((BB[0].x + BB[1].x)/2, (BB[0].y + BB[1].y)/2)
        let radius = (BB[1].x-BB[0].x)/2;
        new_path = new paper.Path.Circle({
            center: center,
            radius: radius,
            strokeColor: 'black',
            fillColor: 'blue',

        })
    }else if(rec_shape.Name == 'rectangle'){
        // let rectangle = new paper.Rectangle(new paper.Point(BB[0].x, BB[1].y), new paper.Size(50,20));
        let rectangle = new paper.Rectangle(new paper.Point(BB[0].x, BB[0].y), new paper.Point(BB[1].x, BB[1].y));
        center = new paper.Point((BB[0].x + BB[1].x)/2, (BB[0].y + BB[1].y)/2)
        new_path = new paper.Path.Rectangle({
            rectangle: rectangle,
            strokeColor: 'black',
            fillColor: 'green'

        });
        document.getElementById("query_label").innerHTML = "Please enter computation statement";
        dialog_to_show.dialog("open")
        
    }else if(rec_shape.Name == 'line'){
        let st_points = lastStroke.points;
        
        let start = new paper.Point(st_points[0].x, st_points[0].y);;
        let headLength = 20;
        let tailLength = 9;
        let headAngle = 35;
        let tailAngle = 110
        let end = new paper.Point(st_points[st_points.length-1].x, st_points[st_points.length-1].y);
        let arrowVec = start.subtract(end);
        let arrowHead = arrowVec.normalize(headLength);
        let arrowTail = arrowHead.normalize(tailLength);

        let p3 = end;                  // arrow point

        let p2 = end.add(arrowHead.rotate(-headAngle));   // leading arrow edge angle
        let p4 = end.add(arrowHead.rotate(headAngle));    // ditto, other side

        let p1 = p2.add(arrowTail.rotate(tailAngle));     // trailing arrow edge angle
        let p5 = p4.add(arrowTail.rotate(-tailAngle));    // ditto

        // specify all but the last segment, closed does that
        new_path = new paper.Path(start, p1, p2, p3, p4, p5);
        new_path.closed = true;
        
        new_path.strokeWidth = 1
        new_path.strokColor = 'black'
        new_path.fillColor = 'black'
        text = 'line';
        doComputations()
        
       
    }else if(rec_shape.Name == 'diamond'){
        center = new paper.Point((BB[0].x + BB[1].x)/2, (BB[0].y + BB[1].y)/2)
        let radius = (BB[1].x - BB[0].x)/2;
        new_path = new paper.Path.RegularPolygon({
            center: center,
            sides: 4, 
            radius: radius,
            fillColor: 'red',
            strokeColor: 'black'});

        new_path.rotate(45);
        // text = prompt("Please enter your condition statement");
        document.getElementById("query_label").innerHTML = "Please enter the condition";
        dialog_to_show.dialog("open")
        
    }else if(rec_shape.Name == 'square'){
        center = new paper.Point((BB[0].x + BB[1].x)/2, (BB[0].y + BB[1].y)/2);
        let radius = (BB[1].x - BB[0].x)*0.7;
        new_path = new paper.Path.RegularPolygon({
            center: center,
            sides: 4, 
            radius: radius,
            fillColor: 'yellow',
            strokeColor: 'black'});
        // text = prompt("Please enter your input/output statement");
        document.getElementById("query_label").innerHTML = "Please enter input/output";
        dialog_to_show.dialog("open")
        $('.ui-dialog-buttonpane > button:last').focus();
        
    }else if(rec_shape.Name == 'ellipse'){
        let rectangle = new paper.Rectangle(new paper.Point(BB[0].x, BB[0].y), new paper.Point(BB[1].x, BB[1].y));
        center = new paper.Point((BB[0].x + BB[1].x)/2, (BB[0].y + BB[1].y)/2)
        let width = BB[1].x - BB[0].x;
        let height = BB[1].y - BB[0].y;
        new_path = new paper.Shape.Ellipse({
            center: center,
            radius: [width/2, height/2],
            strokeColor: 'black',
            fillColor: 'grey'

        });
        // console.log('ellipse_Text',ellipse_text);
        if(ellipse_text == null){
            text = 'Start';
            ellipse_text = 'Start';
        }else if(ellipse_text == 'Start'){
            text = 'Stop';
            ellipse_text = 'Stop';
        }    
        else{
            alert("You cant do that!!! ");
            new_path.visible = false;
            rec_shape.Name = undefined;
            return;
        }

        doComputations()
    }else{
        alert("Unidentified figure!!! Please draw again")
        return;
    }

}

function doComputations(){

    if(dialog_to_show.dialog('isOpen')){
        text = $( "#dialog-form input" ).val();
        console.log("hey i got ", text);
        $( "#dialog-form input" ).val('');
        dialog_to_show.dialog( "close" );
    }
    // console.log("coming here ", (text == null))
    if(text.length == 0){
        new_path.visible = false;
        undoDone = true;
        metric[rec_shape.Name].addFP();
        for(let key in metric){
            if(key!=rec_shape.Name){
                metric[key].addTN();
            }
        }
        return;
    }

    let new_figure;
    // console.log("shape ", rec_shape.Name)
    if(rec_shape.Name!=undefined){
        if(rec_shape.Name!= 'line'){
            let text_node = new paper.PointText(center);
            text_node.fillColor = 'black';
            text_node.fontSize = 18
            text_node.justification = 'center'
            text_node.content = text;
            new_figure = new Figure(new_path, rec_shape.Name, text_node);
        }else
            new_figure = new Figure(new_path, 'line', '')

        
        window.figures.push(new_figure);
        if(undoDone){
            undoDone = false;
            metric[rec_shape.Name].addFN();
            metric[rec_shape.Name].subtractTN();
        }
        metric[rec_shape.Name].addTP();
        for(let key in metric){
            
            if(key!=rec_shape.Name){
                // console.log(key, " recieving TN")
                metric[key].addTN();
            }

            console.log(key," TP ", metric[key].getTP(), " TN ", metric[key].getTN(), " FP ", metric[key].getFP(), " FN ", metric[key].getFN())
        }

        
        
    }
    
    find_connections(window.figures);

}

let divElem = $(this);
function createDialog(text_to_show){
    $( "#dialog-form input" ).val('');
    let dialog = $( "#dialog-form" ).dialog({
        maxHeight: 600,
        modal: true,
        autoOpen : false,
        width:350,
        buttons: {
            Save: function() {
                console.log("from inside ", $( "#dialog-form input" ).val())
                doComputations();
                // divElem.find('.text').text($( "#dialog-form input" ).val()); 
                // dialog.dialog( "close" );
            },
            Cancel: function() {
                text = null;
                doComputations();
                dialog.dialog( "close" );
            }
        }
    });
    return dialog;
    
}

function find_connections(figures){
    let lines = []
    for(let fig of figures)
        if(fig.getShape() == 'line')
            lines.push(fig);
    
    for(let line of lines){
        let fromFound = false;
        for(let fig of figures){
            if(line.getPath().intersects(fig.getPath())){
                if(!fromFound){
                    line.addFromFigures(fig);
                    fromFound = true;
                }
                else
                    line.addToFigures(fig);
            }
        }
    }

    for(let line of lines){
        // console.log("LINE CONNECTS");
        // console.log(line.getFromFigures());
        // console.log("TO");
        // console.log(line.getToFigures());
        let fromFigure = line.getFromFigures().values().next().value;
        let toFigure = line.getToFigures();
        if(toFigure!=null)
            toFigure = toFigure.values().next().value;

        if(toFigure != null)
            fromFigure.addToFigures(toFigure);

        if(toFigure!=null)
            toFigure.addFromFigures(fromFigure);
    }
    console.log("RECURSIVELY PRINTING THE STATES IN THE ORDER");
    console.log(window.figures)
    if(window.figures.length >0)
        printRecursive(window.figures[0], window.figures[0].getLabel().getContent());
}


function setActiveDrawTool(elem) {
    let activeElems = document.querySelectorAll('#drawOptions .active');
    for (let i = 0; i < activeElems.length; i++) {
        activeElems[i].classList.remove('active');
    }
    elem.classList.add('active');
}

function enableDraw() {
    setActiveDrawTool(this);
    sketchSurface.drawTool.activate();
    document.getElementById('sketchCanvas').classList.remove('erase');
    document.getElementById('sketchCanvas').classList.add('draw');
}

function enableErase() {
    setActiveDrawTool(this);
    sketchSurface.eraseTool.activate();
    document.getElementById('sketchCanvas').classList.add('erase');
    document.getElementById('sketchCanvas').classList.remove('draw');
}

function clearCanvases() {
    if (window.confirm('Do you want to clear the entire sketch and your work?')) {
        clearPaperCanvases();
        clearSketchData();
    }

    document.getElementById('psuedo').value='';
}

function clearSketchData() {
    for (let shapeId of Object.keys(sketch.shapes)) {
        sketch.deleted.shapes[shapeId] = JSON.parse(JSON.stringify(sketch.shapes[shapeId]));
        delete sketch.shapes[shapeId];
    }
    
    for (let strokeId of Object.keys(sketch.strokes)) {
        sketch.deleted.strokes[strokeId] = JSON.parse(JSON.stringify(sketch.strokes[strokeId]));
        delete sketch.strokes[strokeId];
    }
    
    for (let substrokeId of Object.keys(sketch.substrokes)) {
        sketch.deleted.substrokes[substrokeId] = JSON.parse(JSON.stringify(sketch.substrokes[substrokeId]));
        delete sketch.substrokes[substrokeId];
    }
}

function clearPaperCanvases() {
    sketchSurface.clear();
}
