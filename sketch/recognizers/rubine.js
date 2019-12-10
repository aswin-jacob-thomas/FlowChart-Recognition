function Rubine(){

this.majorAxisLength = function(stroke){
    let maxD = Number.NEGATIVE_INFINITY;
    let maxi = 0;
    let maxj = 0;
    for(let i=0;i<stroke.length;i++){
        for(let j=0;j<stroke.length;j++){
            if(i!=j){
                let d = this.distanceBetweenPoints(stroke[i], stroke[j]);
                if(d > maxD){
                    maxD = d;
                    maxi = i;
                    maxj = j;
                }
            }
        }
    }

    return maxD;
}

this.preProcess = function(stroke){    
    //Removing the second point where time values are same
    stroke = removeSameSpacialPoints(stroke);
    if(IsSingleTimeStroke(stroke)){
        stroke = changeTimeForStrokePoints(stroke);
        
    }
    stroke = removeSameTimePoints(stroke);  
    stroke = removeNearPoints(stroke);
    return stroke;
}

this.changeTimeForStrokePoints = function(stroke){
    i=0;
    stroke = stroke.map(function(element){
        
        element.time = (parseInt(element.time,10)+i*100).toString();
        i++;
        return element;
    });
    
    return stroke;
}

this.distanceBetweenPoints = function(a,b){
    return Math.sqrt(((a.x-b.x)**2) + ((a.y-b.y)**2));
}

this.removeNearPoints = function(stroke){
    for(let i=stroke.length-1;i>0;i--){
        if(this.distanceBetweenPoints(stroke[i],stroke[i-1]) < 1){
           
            stroke.splice(i,1);
        }
    }

    return stroke;
}

this.IsSingleTimeStroke = function(stroke){
    let time =stroke[0].time;
    for(i=1;i<stroke.length;i++)
        if(time!=stroke[i].time)
            return false;
            
    return true;        
}

this.removeNullPoints = function(stroke){
    stroke = stroke.filter(function(el){  //Issue present where stroke.points contains more values than points which are just null values
        return el!=null;
    });
    return stroke;
    
}

this.removeSameTimePoints = function(stroke){
    for(let i=stroke.length-1;i>0;i--){   //Remove the first point having the same time values
       
        if(stroke[i].time == stroke[i-1].time){
            stroke.splice(i-1,1);
        }
    }

    return stroke;
}

this.removeSameSpacialPoints = function(stroke){
    for(let i=stroke.length-1;i>0;i--){ //Remove the second point having the same spacial value
        
        if(stroke[i].x == stroke[i-1].x && stroke[i].y == stroke[i-1].y){
            stroke.splice(i,1);
        
        }
    }
    return stroke;
}

this.f1 = function(stroke) {
    //cos a : where a is the initial angle
    let dx,dy,i;
    if(stroke.length == 2){ //when the stroke length is 2, take the first and second point
        dx = stroke[1].x - stroke[0].x;
        dy = stroke[1].y - stroke[0].y;
    }
    else if(stroke.length > 2){ //when the stroke length is more than 2, take the first point which is spacially different than the first point

        for(i=2;i<stroke.length;i++){
            if(stroke[0].x != stroke[i].x || stroke[i].y != stroke[0].y)
                break;
        }
        dx = stroke[i].x - stroke[0].x;
        dy = stroke[i].y - stroke[0].y;
    }
    let len = Math.sqrt(dx*dx + dy*dy);

    if(len == 0)
        return 1;
    else    
        return dx/len;
}

this.f2 = function(stroke) {
    //sin a : where a is the initial angle
    let dx,dy,i;
    if(stroke.length == 2){
        dx = stroke[1].x - stroke[0].x;
        dy = stroke[1].y - stroke[0].y;
    }
    else if(stroke.length > 2){
        for(i=2;i<stroke.length;i++){
            if(stroke[0].x != stroke[i].x || stroke[i].y != stroke[0].y)
                break;
        }
        dx = stroke[i].x - stroke[0].x;
        dy = stroke[i].y - stroke[0].y;
    }
    let len = Math.sqrt(dx*dx + dy*dy);
    if(len == 0)
        return 0;
    else    
    return dy/len;
}

this.boundingBoxes = function(stroke){
    let xmin = stroke.reduce((min,p) => p.x<min ? p.x : min, stroke[0].x);
    let xmax = stroke.reduce((max,p) => p.x>max ? p.x : max, stroke[0].x);
    let ymin = stroke.reduce((min,p) => p.y<min ? p.y : min, stroke[0].y);
    let ymax = stroke.reduce((max,p) => p.y>max ? p.y : max, stroke[0].y);

    let BB = [];
    BB[0] = {x: xmin, y:ymin};
    BB[1] = {x: xmax, y:ymax};
    return BB;
}

this.boundingBoxLengths = function(stroke){
    let xmin = stroke.reduce((min,p) => p.x<min ? p.x : min, stroke[0].x);
    let xmax = stroke.reduce((max,p) => p.x>max ? p.x : max, stroke[0].x);
    let ymin = stroke.reduce((min,p) => p.y<min ? p.y : min, stroke[0].y);
    let ymax = stroke.reduce((max,p) => p.y>max ? p.y : max, stroke[0].y);

    return [Math.abs(xmax - xmin),Math.abs(ymax - ymin)];
}

this.f3 = function(stroke) {
    //length of the bounding box
    let xlen;
    let ylen;
    [xlen, ylen ] = this.boundingBoxLengths(stroke);
    return Math.sqrt(xlen*xlen + ylen*ylen);
}

this.f4 = function(stroke){
    //angle at the bounding box diagonal
    [ xlen, ylen ] = this.boundingBoxLengths(stroke);
    return Math.atan(ylen/xlen);

}

this.endPointLengths = function(stroke){

    let xn = stroke[stroke.length-1].x;
    let yn = stroke[stroke.length-1].y;
    let x0 = stroke[0].x;
    let y0 = stroke[0].y;

    return [Math.abs(xn-x0), Math.abs(yn-y0)];
}

this.getAvgClosestStrokeDistanceToCorners = function(stroke) {
    let BB = this.boundingBoxes(stroke);
    let dis = 0.0;
    let dist =[];

    let corners = [];
    corners[0] = {x:BB[0].x, y:BB[0].y}
    corners[1] = {x:BB[1].x, y:BB[0].y}
    corners[2] = {x:BB[1].x, y:BB[1].y}
    corners[3] = {x:BB[0].x, y:BB[1].y}

    for(let i=0; i< 4; i++)
        dist[i] = Number.POSITIVE_INFINITY;

    for(let i=0; i<4; i++) {
        for(let j=0; j<stroke.length; j++) {
            //console.log("point in rubine = ", stroke[j]);
            dis = this.distanceBetweenPoints(stroke[j], corners[i]);
            if(dis < dist[i])
                dist[i] = dis;
        }
    }
       
    let avg = dist.reduce((a,b) => a+b, 0) / 4;
    //console.log("in rubine avg dist = ", avg);
    return avg;
}

this.f5 = function(stroke){
    //Length between the end points of the stroke
    let xlen, ylen;
    ([xlen, ylen ] = this.endPointLengths(stroke));
    return Math.sqrt(xlen*xlen + ylen*ylen);
}

this.f6 = function(stroke){
    //cosine of angle formed between start and the end points
    ([ xlen, ylen] = this.endPointLengths(stroke));
    len = f5(stroke);
    if(len == 0)
        return 1;
    else    
        return xlen/len;
}

this.f7 = function(stroke){
    //sine of the angle formed between first and the last point
    ([ xlen, ylen ] = this.endPointLengths(stroke));
    len = f5(stroke);
    if(len ==0)
        return 0;
    else    
        return ylen/len;
}

this.generateVectorLengths = function(stroke){
    //Generate difference between x, y and time cordinates between adjascent vectors
    let lengths = [];
    
    for(let i = 1;i<stroke.length;i++){
        lengths.push([(stroke[i].x-stroke[i-1].x), (stroke[i].y-stroke[i-1].y), (stroke[i].time-stroke[i-1].time)])
    }
    return lengths;
}

this.f8 = function(stroke){
    //Total length of the stroke
    let sum_of_lengths = 0;
    let lengths = this.generateVectorLengths(stroke);
    
    for(let length of lengths){
        sum_of_lengths += Math.sqrt(length[0]*length[0] + length[1]*length[1]);
    }
    return sum_of_lengths;
}

this.generateAngles = function(stroke){
    //Generate the angles from the vectors
    let lengths = this.generateVectorLengths(stroke);
    
    let angles = [];
    for(let i=1;i<lengths.length;i++){
        
        let xp = lengths[i][0];
        let yp = lengths[i][1];
        let x = lengths[i-1][0];
        let y = lengths[i-1][1];

        let tan_value =(xp*y - x*yp)/(xp*x + yp*y);
        angles.push(Math.atan(tan_value));

    }

    return angles;
}

this.f9 = function(stroke){
    //Total curvature
    let total_angles = 0;
    let angles = this.generateAngles(stroke);
    // console.log("angles generated ", angles)
    for(let angle of angles){
        // console.log(angle)
        if(angle){
            // console.log(angle)
            total_angles +=angle;
        }
    }
    // console.log("total",total_angles)
    return total_angles;
}

this.f10 = function(stroke){
    //Total absolute curvature
    let total_angles = 0;
    let angles = this.generateAngles(stroke);

    for(angle of angles){
        total_angles += Math.abs(angle);
    }

    return total_angles;
}

this.f11 = function(stroke){
    //Total squared curvature
    let total_angles = 0;
    let angles = this.generateAngles(stroke);

    for(angle of angles){
        total_angles += angle*angle;
    }

    return total_angles;
}

function f12(stroke){
    //Maximum speed of the stroke
    lengths = this.generateVectorLengths(stroke);
    
    speeds = [];
    for(let length of lengths){
        
        speeds.push((length[0]*length[0] + length[1]*length[1])/(length[2]*length[2]));
    }
    max_speed = speeds.reduce((max,speed) => speed>max ? speed : max,0);
    
    return max_speed;
}

function f13(stroke){
    //Total duration of the stroke
    return stroke[stroke.length-1].time - stroke[0].time;
}

//Rubine features end
//Long features start

function f14(stroke){
    //Aspect ratio
    return Math.abs(0.785 - f4(stroke));
}

function f15(stroke){
    //Curviness - take the absolute sum of all the angles less than 19 degrees = 0.3314 radians
    let angles = generateAngles(stroke);
    let total_angles = 0;
    let max_angle = 0.3314;
    for(angle of angles){
        if(Math.abs(angle) < max_angle)
            total_angles += Math.abs(angle);
    }

    return total_angles;
}

function f16(stroke){
    //Relative rotation - total angle traversed/total length of the stroke
    val = f8(stroke);
    if(val == 0)
        return 0;
    else    
        return f9(stroke)/val;
}

function f17(stroke){
    //Density measure1 - Total stroke length to end point length ratio
    len = f5(stroke);
    if(len ==0)
        return 0;
    else    
        return f8(stroke)/len;
}

function f18(stroke){
    //Density measure2 - Total stroke length to bounding box diagonal ratio
    val = f3(stroke);
    if(val == 0)
        return 0;
    else    
        return f8(stroke)/val;
}

function f19(stroke){
    //Non subjective openness
    val = f3(stroke);
    if(val == 0)
        return 0;
    else    
        return f5(stroke)/val;
}

function f20(stroke){
    //Area of the bounding box
    [xlen, ylen ] = boundingBoxLengths(stroke);

    return xlen*ylen;
}

function f21(stroke){
    //Log of the area of the bounding box
    if(f20(stroke) == 0)
        return -2000;
    else    
        return Math.log(f20(stroke));
}

function f22(stroke){
    //Rotational change to motion
    if(f10(stroke) == 0)
        return 0;
    else    
        return f9(stroke)/f10(stroke);
}

function f23(stroke){
    //Log of the stroke length
    if(f8(stroke) == 0)
        return -2000;
    else    
        return Math.log(f8(stroke));
}

function f24(stroke){
    //Log of the aspect ratio
    if(f14(stroke) == 0)
        return -100;
    else    
    return Math.log(f14(stroke));
}

function f25(stroke){
    //Log of the bounding box diagonal length
    if(f3(stroke) == 0)
        return -2000;
    else    
        return Math.log(f3(stroke));
}

function f26(stroke){
    //NDDE - Normalized Distance between Direction Extremes
    //Take the point with the highest direction change - change of y over change of x : dy/dx
    //Take the point with the lowest direction change
    //Compute stroke length between these 2 points
    //This length is divided by the entire stroke length

    let lengths = generateVectorLengths(stroke);
    // let direction_change = lengths.map(function(elem){
    //     if(elem[0] ==  0)        
    //         return 0;
    //     else
    //         return Math.abs(elem[1]/elem[0])
    //     });   
    let direction_change = generateAngles(stroke);
    
    if(direction_change == undefined || direction_change.length < 1)    
        return 1;

    let max_index = direction_change.indexOf(Math.max(...direction_change));
    let min_index = direction_change.indexOf(Math.min(...direction_change));
    let stroke_length_between_extremes = 0;
    
    let relative_max_index, relative_min_index;
    relative_max_index = max_index > min_index ? max_index : min_index;
    relative_min_index = min_index < max_index ? min_index : max_index;
    relative_max_index++; //Since we are taking the relative angle and vector length, we will miss out the last point

    for(let i=relative_min_index;i<=relative_max_index;i++){
        stroke_length_between_extremes += Math.sqrt(lengths[i][0]*lengths[i][0] + lengths[i][1]*lengths[i][1]);
    }

    return stroke_length_between_extremes/f8(stroke);
}

function f27(stroke){
    //Direction Change ratio
    //Maximum change in direction / Average change in direction
    // let lengths = generateVectorLengths(stroke);
    // let direction_change = lengths.map(function(elem){
    //     if(elem[0] ==  0)
    //         return 0;
    //     else
    //         return Math.abs(elem[1]/elem[0])
    //     });   
    let direction_change = generateAngles(stroke);
    let max_change_direction = Math.max(...direction_change);
    let total = direction_change.reduce((change,p)=> change+p,0);

    if(direction_change == undefined || direction_change.length < 1 || total == 0)    
        return 0;


    let average = total/direction_change.length;
   
    return max_change_direction/average;
}

function f28(stroke){
    //Compactness - Perimeter squared/Area
    [xlen, ylen ] = boundingBoxLengths(stroke);
    area = xlen*ylen;
    perimeter = 2*(xlen+ylen);
    if(area == 0)
        return 0;
    else    
        return (perimeter * perimeter)/area;
}


function f29(stroke){
    //Circle variance
    //Ratio of standard deviation of radial distance from points to centroid to mean of the radial distances

    stDev = stdDev(stroke);
    mean = meanDistanceToCentroid(stroke);

    if(mean == 0)
        return 0;
    else    
        return stDev/mean; 
        
}

function f30(stroke){
    corners = shortStraw(stroke);
    return corners.length;
}

function findCentroid(stroke){
    xtotal = stroke.reduce((xval,p) => xval+p.x ,0);
    xavg = xtotal/stroke.length;

    ytotal = stroke.reduce((yval,p) => yval+p.y,0);
    yavg = ytotal/stroke.length;

    return [xavg,yavg];
}

function distanceToCentroid(stroke){
    [gx,gy] = findCentroid(stroke);
    distanceVectors = stroke.map(p => Math.sqrt((p.x-gx)**2)+((p.y-gy)**2));
    
    return distanceVectors;
}

function meanDistanceToCentroid(stroke){
    distances = distanceToCentroid(stroke);
    totalValue = distances.reduce((total,p) => total+p,0);

    return totalValue/distances.length;
}

function average(data){
    var sum = data.reduce(function(sum, value){
      return sum + value;
    }, 0);
    
  var avg = sum / data.length;
  return avg;
}

function stdDev(stroke){
    distances = distanceToCentroid(stroke);
    avg = meanDistanceToCentroid(stroke);
    squareDiffs = distances.map(function(value){
        var diff = value - avg;
        var sqrDiff = diff * diff;
        return sqrDiff;
      });
    
    var avgSquareDiff = average(squareDiffs);  

    var stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
}

function shortStraw(stroke){
    let S = determineResampleSpacing(stroke);
    resampled = resamplePoints(stroke,S);
    corners = getCorners(stroke,resampled);
    return corners;
}

function determineResampleSpacing(stroke){
    return f3(stroke)/40;

}

function resamplePoints(stroke,S){
    let D = 0;
    let resampled = [];
    resampled.push(stroke[0]);
    for(let i=1;i<stroke.length;i++){
        let d = distanceBetweenPoints(stroke[i],stroke[i-1]);
        if(D+d>=S){
            let q = {};
            q.x = stroke[i-1].x + ((S-D)/d)*(stroke[i].x - stroke[i-1].x);
            q.y = stroke[i-1].y + ((S-D)/d)*(stroke[i].y - stroke[i-1].y);
            resampled.push(q);
            stroke.splice(i,0,q);
            D = 0;
        }else{
            D = D + d;
        }
    }

    return resampled;
}

function median(arr) {
    const mid = Math.floor(arr.length / 2),
    nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  };

function getCorners(stroke, points){
    let corners = [];
    corners.push(0);
    let W = 3;
    let straws = [];
    for(let i=0;i<points.length;i++){
        if(i<W || i+W >= points.length){
            straws.push(0);
            continue;
        }
            
        straws.push(distanceBetweenPoints(points[i-W],points[i+W]));
    }

    let t = median(straws) * 0.95;  
    
    for(let i=W;i<(straws.length-W);i++){
        if(straws[i]<t){
            let localMin = Number.POSITIVE_INFINITY;
            let localMinIndex = i;

            while(i<(straws.length-W) && straws[i]<t){
                if(straws[i]<localMin){
                    localMin = straws[i];
                    localMinIndex = i;
                }
                i++;
            }

            corners.push(localMinIndex);

        }
    }

    corners.push(points.length-1);
    corners = postProcessCorner(stroke, corners, straws);
    return corners;
}

function postProcessCorner(stroke, corners, straws){
    do{
        con = true;
        for(let i=1;i<corners.length;i++){
            let c1 = corners[i-1];
            let c2 = corners[i];

            if(!isLine(stroke,c1,c2)){
                let newCorner = halfwayCorner(straws,c1,c2);
                if(newCorner!=c1 && newCorner!=c2){
                    corners.splice(i,0,newCorner);
                    con = false;
                }
                
            }
        }
    }while(!con);

    for(i=1;i<corners.length-1;i++){
        let c1 = corners[i-1];
        let c2 = corners[i+1];
        
        if(isLine(stroke,c1,c2)){
            corners.splice(i,1);
            i = i-1;
        }
    }

    return corners;
}

function halfwayCorner(straws, a, b){
    // quarter = Math.ce(b-a)/4;
    let minValue = Number.POSITIVE_INFINITY;
    let minIndex;
    for(let i=a+(Math.floor((b-a)/4));i<=b-(Math.floor((b-a)/4));i++){  
        if(straws[i] < minValue){
            minValue = straws[i];
            minIndex = i;
        }
    }
    return minIndex;
    
}

function pathDistance(stroke, c1, c2){
    let d = 0;
    for(let i=c1;i<=c2-1;i++){
        d = d + distanceBetweenPoints(stroke[i],stroke[i+1]);
    }

    return d;
}

function isLine(stroke,c1,c2){
    let threshold = 0.95;
    let distance = distanceBetweenPoints(stroke[c1],stroke[c2]);
    let pDistance = pathDistance(stroke,c1,c2);
    if(distance/pDistance > threshold)
        return true;
    else
        return false;
}

}
export default Rubine;


