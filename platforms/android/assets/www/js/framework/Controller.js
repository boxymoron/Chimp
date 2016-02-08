function Controller(){}

Controller.prototype.setView = function(view){
	this.view = view;
}

Controller.prototype.setModel = function(model){
	this.model = model;
}
/** **************************************************************************/
function GridViewController(){
	this.view = null;
	this.model = null;
	
	
}

function PageViewController(){
	this.view = null;
	this.model = null;
}

/*
var Controller = {
	observers : {},
	dispatch : function(event){
		//console.log(event);
		//console.log(this.observers);
		var start = new Date().getTime();
		var $target = $(event.target);
		var type = $target.attr('model');
		if(!type){
			$target = $target.closest("[model]");
			//console.log("$target");console.log($target);
			if($target){
				type = $target.attr('model');
			}
		}else{
			var observer = this.observers[type];
			if(observer){
				observer.actions["on"+event.type](event);//dispatch
				console.log("Controller.dispatch() "+event.type+" "+$target.attr("id")+" took"+(new Date().getTime()-start)+ "ms");
			}
		}
		return false;
	},
	register : function(model){
		console.log('Registering type '+model.type);
		//console.log(model);
		var self = this;
		$("[model='"+model.getType()+"']").each(function(index, el){
			for(var action in model.actions){
				console.log($(this).attr('id')+"["+$(this).attr('model')+"] "+" binding "+action);
				el[action] = self.dispatch.bind(self);
			}
		});
		for(var i=0; i < model.children.length; i++){
			var child = model.children[i];
			$("[model='"+child.getType()+"']").each(function(index, el){
				for(var action in child.actions){
					console.log($(this).attr('id')+"["+$(this).attr('model')+"] "+" binding "+action);
					el[action] = self.dispatch.bind(self);
				}
			});
			self.observers[child.getType()] = child;
		}
		this.observers[model.getType()] = model;
	}
}
*/