/***********************************************************
 *                       Boid.js
 *                 Written by Jake Grajewski
 *
 *
 * *********************************************************/

     var Boid = function(x , y, flock) {
        this.pos = [x,y];
        this.vel = [1,-1];
        this.flock = flock;
        this.maxVel = 5;
    }

    // stereotypical distance calc for 2d
    Boid.prototype.distance = function(boid){
        var dX = this.pos[0] -boid.pos[0],
            dY = this.pos[1] -boid.pos[1];

        return Math.sqrt(dX * dX + dY * dY);
    }

    Boid.prototype.gather = function(boids,dist){

        // maybe console.log this because it should not happen
        if(boids.length < 1 ) return;

        var avg = [0,0];
        for(var i = 0; i<boids.length; i++){
            var boid = boids[i];

            // if we are too far I can not gather with you.
            if(this.distance(boid) > dist) continue;

            // if we are the same one move on you can't gather with yourself.
            if( this.pos === boid.pos ) continue;

            avg[0] += this.pos[0] - boid.pos[0];
            avg[1] += this.pos[1] - boid.pos[1];

            // Kill it for safety
            boid = null;
        }

        // find average spot
        avg[0] /= boids.length;
        avg[1] /= boids.length;

        dist = Math.sqrt((avg[0] * avg[0]) + (avg[1] * avg[1])) * -1.0

        // I would rather not divide by 0
        if(dist === 0) return;

        // figrue out scaling later
        this.vel[0] = Math.min(this.vel[0] + (avg[0] / dist) * gatherPercent, this.maxVel);
        this.vel[1] = Math.min(this.vel[1] + (avg[1] / dist) * gatherPercent, this.maxVel);
    };

    Boid.prototype.runAway = function(flock, minSame, mindiff){
        var dX = 0,
            dY = 0,
            tooClose = 0;

        for ( var i =0 ; i< flock.length; i++){
            // have to search the entire flock
            var boids = flock[i];

            for(var j = 0; j< boids.length; j++)
            {
                var boid = boids[j];
                // if we are the same one move on you can't run from your self
                if( this.pos === boid.pos ) continue;

                var howClose = this.distance(boid);

                // stay close to your own run from others!
                var min = this.flock === boid.flock ? minSame : mindiff ;

                // something is too close time to run
                if(howClose < min){
                    tooClose++;
                    var posDiff = [ this.pos[0] - boid.pos[0] ,  this.pos[1] - boid.pos[1] ];

                    // we have to make sure we are moving away
                    if(posDiff[0] >= 0 ) dX += Math.sqrt(min) - posDiff[0];
                    else if (posDiff[0] < 0) dX += -Math.sqrt(min) - posDiff[0];

                    if(posDiff[1] >= 0 ) dY += Math.sqrt(min) - posDiff[1];
                    else if (posDiff[1] < 0) dY += -Math.sqrt(min) - posDiff[1];

                    // Kill it for safety
                    boid = null;
                }
            }
        }

        if(tooClose === 0){return};

        this.vel[0] -= dX / runAwayDivider;
        this.vel[1] -= dY / runAwayDivider;
    }

    Boid.prototype.keepUp = function (boids, dist){
        // maybe console this because it should not happen
        if(boids.length < 1 ) return;

       var avg = [0,0];

        for(var i = 0 ; i<boids.length; i++){
            var boid = boids[i];

            // too far can't swarm with
            if(this.distance(boid) > dist) continue;

            // if we are the same one move on you can't keepUp with yourself
            if( this.pos === boid.pos ) continue;

            avg[0] += boid.vel[0];
            avg[1] += boid.vel[1];

            // Kill it for safety
            boid = null;
        }

        avg[0] /= boids.length;
        avg[1] /= boids.length;

        dist = Math.sqrt((avg[0] * avg[0]) + (avg[1] * avg[1])) * 1.0

        // I would rather not divide by 0
        if(dist === 0) return;

        this.vel[0] = Math.min(this.vel[0] + (avg[0] / dist) * keepUpPercent, this.maxVel);
        this.vel[1] = Math.min(this.vel[1] + (avg[1] / dist) * keepUpPercent, this.maxVel);
    }

    // the grand stashing function to update all the moves
    Boid.prototype.move = function() {

        this.pos[0] += this.vel[0];
        this.pos[1] += this.vel[1];

        var border = 5;

        if(this.pos[0] <= border || this.pos[0] >= w - border) {
            this.pos[0] -= this.vel[0];
            this.pos[0] = Math.max(this.pos[0], border);
            this.pos[0] = Math.min(this.pos[0], w - border);
            this.vel[0] = -this.vel[0];
            this.pos[0] += this.vel[0];
        }

        if(this.pos[1] <= border || this.pos[1] >= h - border) {
            this.pos[1] -= this.vel[1];
            this.pos[1] = Math.max(this.pos[1], border);
            this.pos[1] = Math.min(this.pos[1], h - border);
            this.vel[1] = -this.vel[1];
            this.pos[1] += this.vel[1];
        }
    }

    // change these numbers to tweak the graph and behavior of the boids
    var w = 1000,
        h = 450,

        numOfFlocks = 8,
        birdsPerFlock = 20,

        swarmableRange = 500,
        runAwayDivider = 7,
        keepUpPercent = .07,
        gatherPercent = .20,

        minSameFlock = 8,
        minDiffFlock = 12,

        flockOfBirds = [];

    // Initialize bird
    for (var i =0 ; i< numOfFlocks; i++)
    {
        flockOfBirds[i] = d3.range(birdsPerFlock).map(function() {
            return new Boid( Math.ceil ( Math.random() * w), Math.ceil( Math.random() * h ), i );
        });
    }

    // array of arrays
    var manyPoints = [];

    for(var i = 0 ; i< flockOfBirds.length; i++)
    {

        if(typeof manyPoints[i] === "undefined") manyPoints[i] = [];

        var points = [];

        for(var j =0; j < flockOfBirds[i].length; j++)
        {
            var flock = flockOfBirds[i];
            if(typeof  points[i] === "undefined") points[i] = [];
            points[i].push( {
                pos : flock[j].pos,
                flock : flock[j].flock
            }    )
        }

        manyPoints[i] =  points;
    }

    function moveBoids(flock) {
        var flockCnt = 0;
        flock.forEach(function(boids,j){
            for(var i = 0; i < boids.length; i++) {
                boids[i].keepUp(boids, swarmableRange);
                boids[i].gather(boids, swarmableRange);
                boids[i].runAway(flock, minSameFlock , minDiffFlock);
            }
            var point = [];
            // update the data
            boids.forEach(function(boid, i) {
                boid.move(boids);
                if(typeof  point[i] === "undefined") point[i] = [];
                point[i].push( {
                    pos : boid.pos,
                    flock : boid.flock
                }    )
            });

            manyPoints[j] = point;
        });
    }

    d3.select(window).on("blur");

    var svg = d3.select("#flockSort")
        .append("svg:svg")
        .attr("width", w)
        .attr("height", h)

    var pos = [],
        colors = [];

    for(var i = 0 ; i<manyPoints.length;i++)
    {
         var points = (manyPoints[i])[i];

        for(var j = 0; j< points.length; j++){
            pos[j +  i*points.length] = [points[j].pos[0], points[j].pos[1]];
        }

        // random colors for each flock
        colors[i] = '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
    }

    svg.selectAll("circle")
        .data(pos)
        .enter().append("svg:circle")
        .attr("class", "flockSort")
        .attr("transform", function(d) {
            return "translate(" + d + ")";
        })
        .style("fill", function(d, i) { return colors[parseInt(i/birdsPerFlock)]; })
        .attr("r", 4);

    d3.timer(function() {
        // Update boid positions.
        moveBoids(flockOfBirds);

        var pos = [];

        for(var i = 0 ; i<manyPoints.length;i++)
        {
            var points = (manyPoints[i]);

            for(var j = 0; j< points.length; j++){
                pos[j +  i*points.length] = [(points[j])[0].pos[0], (points[j])[0].pos[1]];
            }

        }
        // Update circle positions.
        svg.selectAll("circle")
            .data(pos)
            .attr("transform", function(d) { return "translate(" + d + ")"; });


    });
