function Figure(path, shape, label){
    this.path = path;
    this.shape = shape;
    this.label = label;
    this.fromFigure = null;
    this.toFigure = null
    this.addFromFigures = function(path){
        if(this.fromFigure == null)
            this.fromFigure = new Set([]);
        this.fromFigure.add(path);
    }

    this.addToFigures = function(path){
        if(this.toFigure == null)
            this.toFigure = new Set([])
        this.toFigure.add(path);
    }

    this.getPath = function(){
        return this.path;
    }
    
    this.getShape = function(){
        return this.shape;
    }

    this.getLabel = function(){
        return this.label;
    }

    this.getFromFigures = function(){
        return this.fromFigure;
    }

    this.getToFigures = function(){
        return this.toFigure;
    }
}

export default Figure;