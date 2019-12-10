import Rubine from './rubine.js'

function FlowChart(stroke) // constructor
{
    let rubine = new Rubine();

	this.chartRecognizer = function(stroke, segments) //points, boundingbox
	{   
        
        if(this.line(stroke)){
            console.log("Our recognizer shows line");
            return 'line';
        }
        
        // else if(this.circle(stroke, segments)){
        //     console.log("Our recognizer shows circle");
        //     return 'circle';

        // }
        else if(this.diamond(stroke, segments)){
            console.log("Our recognizer shows diamond");
            return 'diamond';
        }else if(this.square(stroke, segments)){
            
            console.log("Our recognizer shows square");
            return 'square';

        }else if(this.ellipse(stroke, segments)){
            console.log("Our recognizer shows ellipse");
            return 'ellipse';
        }else if(this.rectangle(stroke, segments)){
            console.log("Our recognizer shows rectangle");
            return 'rectangle';
        }
        
    }

    this.rotate = function(points, center, angle){
        let rotated_points = {}
        rotated_points['points'] = [];
        for(let point of points){
            // console.log("piont!!",point);
            point.x -= center.x;
            point.y -= center.y;
            let new_x = point.x * Math.cos(angle) - point.y*Math.sin(angle);
            let new_y = point.x*Math.sin(angle) + point.y * Math.cos(angle);
            new_x += center.x;
            new_y += center.y;
            let new_point = {};
            new_point['x'] = new_x;
            new_point['y'] = new_y;
            rotated_points['points'].push(new_point);
        }

        return rotated_points;
    }

    this.rectangle = function(stroke, segments){
        let BB = stroke.boundingBox
        let perimeter = (BB[1].x - BB[0].x + BB[1].y - BB[0].y) * 2;
        let f8 = rubine.f8(stroke.points);
        let f5 = rubine.f5(stroke.points);
        let perimeter_strokelength_ratio = f8/perimeter;
        let major_axis_length = rubine.majorAxisLength(stroke);
        let f3 = rubine.f3(stroke.points);
        if(perimeter_strokelength_ratio < 1 && segments.length < 4)
            return false;
        
        if(f5/f8 > 0.09)
            return false;

        if(major_axis_length/f3 > 0.15)
            return false;
            segments
        return true;
        
    }

    this.square = function(stroke, segments){
        // console.log("in square");
        let BB = stroke.boundingBox;
        let width = BB[1].x - BB[0].x;
        let height = BB[1].y - BB[0].y;

        // console.log('width',width)
        // console.log('height',height)

        let avgDist = rubine.getAvgClosestStrokeDistanceToCorners(stroke.points);
        // console.log("avgDIst = ", avgDist);
        
        if(!this.rectangle || !(width/height <1.4)){
            return false;
        }
        // console.log("reaching amala")
        if(avgDist > 40) {
            return false;
        }
        return true;
    }

    this.circle = function(stroke, segments){
        // console.log("in circle");
        if(!this.square(stroke,segments))
            return false;
        let BB = stroke.boundingBox;
        let width = BB[1].x - BB[0].x;
        let height = BB[1].y - BB[0].y;

        let midpoint = {x:(BB[0].x+BB[1].x)/2, y: (BB[0].y+BB[1].y)/2 }
        let avg = 0;

        for(let point of stroke.points){
            // console.log(midpoint)
            let dev = rubine.distanceBetweenPoints(midpoint, point);
            // console.log(dev)
            avg += dev;
        }
        let f9 = rubine.f9(stroke.points);
        // console.log('len', avg)
        avg /= stroke.points.length; //radius
        let diameter = 2*avg; //diameter
        let bbdiagonal_length = rubine.f3(stroke.points);
        //console.log('diam', diameter);
        //console.log('width', width);
        //console.log('height', height);
        // if(diameter>=bbdiagonal_length)
        //     return false;
        //console.log(rubine.majorAxisLength(stroke.points));
        //console.log(bbdiagonal_length)
        if(Math.abs(f9/6.28) < 0.9)
            return false;
        if(rubine.majorAxisLength(stroke.points)/bbdiagonal_length < 0.9)
            return true;
        

        return false;
    }

    this.diamond = function(stroke, segments){
        // console.log("in diamond");
        let f9 = rubine.f9(stroke.points);

        // console.log("angle ",f9)
        // console.log("ratios ",f9/6.28);
        let BB = stroke.boundingBox;
        let midpoint = {x:(BB[0].x+BB[1].x)/2, y: (BB[0].y+BB[1].y)/2 }
        let rotated = this.rotate(stroke.points,midpoint,Math.PI/4);
        rotated['boundingBox'] = rubine.boundingBoxes(rotated.points);
        
        

        let avgDist = rubine.getAvgClosestStrokeDistanceToCorners(stroke.points);
        // console.log('averege dist amala',avgDist)
        if(Math.abs(f9/6.28) > 0.9)
            return false;
        if(!this.square(rotated, segments))
            return false;
        
        // if(avgDist < 0.22) {
        //     return false;
        // }
        return true;
    }

    this.line = function(stroke){
        let f5 = rubine.f5(stroke.points);
        let f8 = rubine.f8(stroke.points);
        let ratio = f5/f8;
        if(ratio >= 0.95)
            return true;
        else
            return false;    
    }

    this.ellipse = function(stroke, segments){
        if(!this.rectangle(stroke, segments))
            return false;
        let bbdiagonal_length = rubine.f3(stroke.points);
        // console.log('ellipse major', rubine.majorAxisLength(stroke.points));
        // console.log('bblength',bbdiagonal_length);
        if(rubine.majorAxisLength(stroke.points)/bbdiagonal_length < 0.95)
            return true;

        return false;
    }
    
    
}

export default FlowChart;
