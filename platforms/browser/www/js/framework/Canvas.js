App.View = new Object();
	App.View.coordsX = 0;
	App.View.coordsY = 0;
	App.View.time = 0;
	App.View.distances = []; 
	App.View.previousVelocity = 0.0;
	App.View.maxVelocity = 0.0;
	App.View.isDraw = false;

$(window).load(function () {
	$myConsole = $("#myConsole");
	
	if(document.getElementById('primaryCanvas')){
		canvas = document.getElementById('primaryCanvas');
		ctx = canvas.getContext('2d');
		contentArea = $("#myConsole");
	}else {
		return;
	}

	ontouchstart = function(evt){
		/* var touch = evt.touches[0];
	  	//contentArea.html("touchstart "+touch.pageX + "/" + touch.pageY);
		View.isDraw = !View.isDraw;
		var currY = evt.pageY;
		var currX = evt.pageX;
		View.coordsY=currY;
		View.coordsX=currX; */
	}
	
	calculateDistance = function(x, y) {
		var currTime = (new Date()).getTime();
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

		var previousTime = View.time || 0;
		var deltaTime = currTime - previousTime;
		var currVelocity = distance/deltaTime;
		var currMaxVelocity=Math.abs(currVelocity);
		if(currMaxVelocity > View.maxVelocity && currMaxVelocity != Infinity){
			View.maxVelocity = currMaxVelocity;
		}

		View.coordsY=currY;
		View.coordsX=currX;
		View.time =currTime;
		//View.distances.push(distance);
		View.previousVelocity = Math.abs(currVelocity);

		contentArea.html("x="+View.coordsX+" y="+View.coordsY+"<br> currVelocity="+currVelocity+"<br>theta="+theta+" "+"<br>took "+((new Date()).getTime()-currTime)+" ms");

	}

	var count = 0;
	var previousX = 140;
	var previousY = 140;
	onmousemove = ontouchmove = function(evt){
		try{
			var currTime = (new Date()).getTime();
			var touch = evt.touches[0];
			var currX = touch.pageX;
			var currY = touch.pageY;
			
			calculateDistance(currX, currY);
			ctx.strokeStyle = "green"; // line color
			
			ctx.moveTo(previousX, previousY);
			ctx.lineTo(currX, currY);
			ctx.stroke();
			
			previousX = currX;
			previousY = currY;
			//ctx.moveTo(140, 140);
			//ctx.lineTo(evt.pageX, evt.pageY);
			//ctx.strokeStyle = "black"; // line color
			//ctx.stroke();
			
			contentArea.append("<br>took "+((new Date()).getTime()-currTime)+" ms");
		}catch(e){
			
		}
	}

	onclick = ontouchend = function(evt){
		View.isDraw = !View.isDraw;
	}
});
