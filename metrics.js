function Metrics(shape){
    this.shape = shape;
    this.TP = 0;
    this.FP = 0;
    this.FN = 0;
    this.TN = 0;
    this.total = 0;

    this.getTP = function(){
        return this.TP;
    }

    this.getTN = function(){
        return this.TN;
    }

    this.getFP = function(){
        return this.FP;
    }

    this.getFN = function(){
        return this.FN;
    }

    this.addTP = function(){
        this.TP += 1;
    }

    this.subtractTP = function(){
        this.TP -=1;
    }

    this.addTN = function(){
        this.TN += 1;
    }
    
    this.subtractTN = function(){
        this.TN -= 1;
    }

    this.addFP = function(){
        this.FP += 1;
    }

    this.subtractFP = function(){
        this.FP -= 1;
    }

    this.addFN = function(){
        this.FN += 1;
    }

    this.subtractFN = function(){
        this.FN -=1;
    }

    this.accuracy = function(){
        if(this.total() == 0 ){
            // console.log("total is 0");
            return 0;
        }
        else{
            // console.log("total is not zero");
            return ((this.TP + this.TN)/this.total()).toPrecision(3);
        }
    }

    this.fmeasure = function(){
        let num = 2*this.TP;
        let den = 2*this.TP + this.FP + this.FN;
        // console.log(this.TP);
        // console.log(this.FP);
        // console.log(this.FN);
        if(num == 0 || den == 0){
            return 0;
        }
        else{
            // console.log(den)
            // console.log("Fmeasure of ",this.shape +" is "+ (2*this.TP)/(this.FP+this.FN+(2*this.TP)))
            return ((2*this.TP)/(this.FP+this.FN+(2*this.TP))).toPrecision(3)
        }
    }

    this.total = function(){
        return this.TP + this.TN + this.FN + this.FP;
    }
}

export default Metrics;