
var View = new Object();
		View.coordsX = 0;
		View.coordsY = 0;
		View.time = [];
		View.distances = []; 
		View.previousVelocity = 0.0;
		View.maxVelocity = 0.0;


var actions = {
    echo: function(a) {
		postMessage(JSON.stringify({
    		action: 'log',
    		args: [a+" from worker"]
		}));
        return a;
    },
	
    calculateDistance: function(x, y) {
		var currY = x;
		var currX = y;
		var previousY = View.coordsY;
		var previousX = View.coordsX;
			
		var deltaY = currY - previousY;
		var deltaX = currX - previousX;
			
		var deltaYSq = Math.pow(deltaY, 2);
		var deltaXSq = Math.pow(deltaX, 2);

		var distance=Math.sqrt(deltaYSq+deltaXSq);
		var theta = (Math.atan2(deltaY,deltaX));
		if (theta < 0)theta += 2 * Math.PI;
		theta *= (180/Math.PI);

		var currTime = (new Date()).getTime();
		var previousTime = View.time[View.time.length-1] || 0;
		var deltaTime = currTime - previousTime;
		var currVelocity = distance/deltaTime;
		var currMaxVelocity=Math.abs(currVelocity);
		if(currMaxVelocity > View.maxVelocity && currMaxVelocity != Infinity){
			View.maxVelocity = currMaxVelocity;
		}

		View.coordsY=currY;
		View.coordsX=currX;
		View.time.push(currTime);
		View.distances.push(distance);
		View.previousVelocity = Math.abs(currVelocity);

		var totalDistance = 0;
		for(var i=1; i<View.distances.length;i++){
			if(isNaN(totalDistance))continue;
			totalDistance+=View.distances[i];
		}

		var startSleepTime=new Date().getTime();
		var sleepTime = 100;
		while (new Date().getTime()-startSleepTime < sleepTime){}
		sleepTime = new Date().getTime()-startSleepTime;

		postMessage(JSON.stringify({
    		action: 'log',
    		args: ["sleepTime="+sleepTime+"<br>x="+x+"<br> y="+y+"<br> distance="+distance+"<br> theta="+theta+"<br> dT="+deltaTime+" <br>totalDistance="+totalDistance+"<br> speed="+currVelocity+"<br> max speed="+View.maxVelocity]
		}));
	}
};

// handle a new request from the host
onmessage = function(event) {
    var data   = JSON.parse(event.data), // parse the data
        action = data.action,            // get the requested action
        args   = data.args,              // get the arguments for the action
        result = { action: action };     // prepare the result

    // if we understand the action
    if (action in actions) {
        // execute the action and set the returnValue
        result.returnValue = actions[action].apply(this, args);
    }
	return result;

};
