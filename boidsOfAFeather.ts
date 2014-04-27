module BoidsOfaFeather{
    var w                   = 1000,
        h                   = 450,

        numOfFlocks         = 8,
        birdsPerFlock       = 20,

        swarmableRange      = 500,
        runAwayDivider      = 7,
        keepUpPercent       = 0.07,
        gatherPercent       = 0.20,
        maxVel              = 5,

        minSameFlock        = 8,
        _ecosystem:Ecosytem,
        minDiffFlock        = 12;


    export interface Pos {x:number;y:number;}
    export interface Vel {x:number;y:number;}

    export class Boid{
        private id:number;
        private flockId:number;
        private pos:Pos;
        private vel:Vel;
        private flock:Flock;

        constructor(x:number,y:number,flock:Flock){
            this.pos = {x:x,y:y};
            this.vel = {x:1,y:-1};
            this.flock = flock;
            this.id = flock.getNumberOfBoids();
            this.flockId = flock.getId();
        }

        public getPos = () => {return this.pos;};

        public gather = () => {
            var boids = this.flock.getBoids();
            // maybe console.log this because it should not happen
            if(boids.length < 1 ) return;

            var avg = {x:0,y:0};
            for(var i = 0; i<boids.length; i++){
                var boid = boids[i];

                // if we are too far I can not gather with you.
                if(this.distance(boid) > swarmableRange) continue;

                // if we are the same one move on you can't gather with yourself.
                if( this.pos === boid.pos ) continue;

                avg.x += this.pos.x - boid.pos.x;
                avg.y += this.pos.y - boid.pos.y;

                // Kill it for safety
                //todo why do i kill it?
//                boid = null;
            }

            // find average spot
            avg.x /= boids.length;
            avg.y /= boids.length;

            dist = Math.sqrt((avg.x * avg.x) + (avg.y * avg.y)) * -1.0;

            // I would rather not divide by 0
            if(dist === 0) return;

            // figrue out scaling later
            this.vel.x = Math.min(this.vel.x + (avg.x / dist) * gatherPercent, maxVel);
            this.vel.y = Math.min(this.vel.y + (avg.y / dist) * gatherPercent, maxVel);
        };

        public runAway = () => {
            var dX = 0,
                dY = 0,
                flocks = _ecosystem.getFlocks(),
                tooClose = 0;

            for ( var i =0 ; i< flocks.length; i++){
                // have to search the entire flock
                var flock:Boid[] = flocks[i].getBoids();

                for(var j = 0; j< flock.length; j++)
                {
                    var boid = flock[j];
                    // if we are the same one move on you can't run from your self
                    if( this.pos === boid.pos ) continue;

                    var howClose = this.distance(boid.getPos());

                    // stay close to your own run from others!
                    var min = this.stayCloseOrRun(boid);

                    // something is too close time to run
                    if(howClose < min){
                        tooClose++;
                        var posDiff = { x:this.pos.x - boid.pos.x , y: this.pos.y - boid.pos.y };

                        // we have to make sure we are moving away
                        if(posDiff.x >= 0 ) dX += Math.sqrt(min) - posDiff.x;
                        else if (posDiff.x < 0) dX += -Math.sqrt(min) - posDiff.x;

                        if(posDiff.y >= 0 ) dY += Math.sqrt(min) - posDiff.y;
                        else if (posDiff.y < 0) dY += -Math.sqrt(min) - posDiff.y;
                    }
                }
            }

            if(tooClose === 0){return;}

            this.vel.x -= dX / runAwayDivider;
            this.vel.y -= dY / runAwayDivider;
        };

        keepUp = () => {
            var flock:Boid[] = this.flock.getBoids();
            // maybe console this because it should not happen
            if(flock.length < 1 ) return;

            var avg = {x:0,y:0};

            for(var i = 0 ; i<flock.length; i++){
                var boid = flock[i];

                // too far can't swarm with
                if(this.distance(boid) > swarmableRange) continue;

                // if we are the same one move on you can't keepUp with yourself
                if( this.pos === boid.pos ) continue;

                avg.x += boid.vel.x;
                avg.y += boid.vel.y;

                // Kill it for safety
                boid = null;
            }

            avg.x /= flock.length;
            avg.y /= flock.length;

            var dist = Math.sqrt((avg.x * avg.x) + (avg.y * avg.y));

            // I would rather not divide by 0
            if(dist === 0) return;

            this.vel.x = Math.min(this.vel.x + (avg.x / dist) * keepUpPercent, maxVel);
            this.vel.y = Math.min(this.vel.y + (avg.y / dist) * keepUpPercent, maxVel);
        };

        private stayCloseOrRun = (boid:Boid) =>{return this.flockId === boid.flockId ? minSame : mindiff;};

        private distance = (pos:Pos):number => {
            var dX = this.pos.x - pos.x,
                dY = this.pos.y - pos.y;
            return Math.sqrt(dX * dX + dY * dY);
        }
    }

    export class Flock{
        private id:number;
        private _boids:Boid[]=[];

        constructor(){
            this.id = _ecosystem.getFlockCnt();
        }

        public getBoids = ():Boid[] => {return boids};
        public getNumberOfBoids = ():number => {return boids.length};
        //returns true if one made it in else it returns false
        public insertBoid = (boid:Boid) => {
            if(this._boids.length > birdsPerFlock){console.log('No MOAR boids for flock#: '+ this.id);return false;}
            this._boids.push(boid);
            return true
        };
        public getId = ():number => {return this.id;}
    }

    export class Ecosytem{
        private _flocks:Flock[]=[];
        public getFlocks = () => {return this._flocks;};

        constructor () {
            for (var i =0 ; i< numOfFlocks; i++){
                var flock:Flock = new Flock();
                for (var j = 0;j<birdsPerFlock;j++){
                    var x = Math.ceil ( Math.random() * w),
                        y = Math.ceil( Math.random() * h );
                    flock.insertBoid( new Boid( x, y, flock) );
                }
                this.insertFlock(flock);
            }
        }

        public getFlockCnt = ():number => {return this._flocks.length};

        //returns true if one made it in else it returns false
        private insertFlock = (flock:Flock) => {
            if(this._flocks.length > numOfFlocks){
                console.log('No MOAR flocks We are full: '+ this.id);
                return false
            }
            this._flocks.push(flock);
            return true;
        };
    }
    console.log(_ecosystem = new Ecosytem());
}
