
function View(){};
View.prototype = {
		setSuperView : function(superView){
			this.superView = superView;
		},
		addSubView : function(subView){
			this.subViews.push(subView);
		},
		setController : function(controller){
			this.controller = controller;
		},
		setModel : function(model){
			this.model = model;
		},
		release : function(){
			model.removeDependent(this);
		},
		render : function(){
			//if(this.model){
			//	console.log(this.id+" rendering self with model")
			//	this.model.render(this.onRender.bind(this));
			//}else{
				//console.log(this.id+" rendering self");
				this.onRender(this);
			//}
		},
		onRender : function(model){
			var start = new Date().getTime();
			var view = (model == null ? {} : model);
			view.id = this.id;
			view.cssClass = this.cssClass;
			var html = this.template(view);
			if(this.superView && this.superView.$element){
				var existingChild = this.superView.$element.find("#"+this.id);
				if(existingChild.length > 0){
					//console.log("existing child found:");
					//console.log(existingChild);
					//console.log("replacing with "+html);
					existingChild.replaceWith(html);
					this.$element = $('#'+this.id);
				}else{
					//console.log("appending to "+this.superView.$element.attr('id'));
					this.superView.$element.append(html);
					this.$element = $('#'+this.id);
				}
			}else{
				var existingChild = $('body').find("#"+this.id);
				if(existingChild.length > 0){
					//console.log("existing child found:");
					//console.log(existingChild);
					existingChild.replaceWith(html);
					this.$element = $('#'+this.id);
				}else{
					//console.log("appending to document body");
					$('body').append(html);
					this.$element = $('#'+this.id);
				}
			}
			this.bindAllActions();
			for(var i=0; i<this.subViews.length; i++){
				//console.log("rendering subview: "+i)
				this.subViews[i].render();
			}
			console.log(this.id+" rendering done, took "+(new Date().getTime()-start)+" ms");
		},
		bindAllActions : function(){
			for(var i in this.actions){
				//console.log(this.actions[i]);
				this.$element.bind(i, this.actions[i]);
			}
		}
}

/** **************************************************************************/
function PageView(controller, cssClass){
	this.id = 'PageView-'+guidGenerator();
	this.controller = (controller == null ? new PageViewController() : controller);
	this.superView = null;
	this.cssClass = (cssClass == null ? 'PageView' : cssClass);
	
	this.subViews = [];
}
PageView.inheritsFrom(View);
PageView.prototype.template = Handlebars.compile($('#PageTemplate').html());

/** **************************************************************************/
function GridView(superView, controller, model, cssClass) {
	this.id = 'GridView-'+guidGenerator();
	
	this.controller = (controller == null ? new GridViewController() : controller);
	
	this.model = model || null;
	this.superView = superView;
	this.superView.addSubView(this);
	
	this.subViews = [];
	
	this.$element = null;
	this.cssClass = (cssClass == null ? 'GridView' : cssClass);
	
	this.render = function(){
		console.log(this.id+" rendering in overriden render()");
		this.model.get(this.onRender.bind(this));
	}
	
	this.click = function(evt){
		//console.log(this.id+" click() triggered on: "+evt.target+" parent: "+$(evt.target).closest("li").attr("id"));
		//return false;
	}
	
	this.mouseover = function(evt){
		//console.log(this.id+" mouseover() triggered on: "+evt.target+" parent: "+$(evt.target).closest("li").attr("id"));
	}
	
	this.actions = {
		mouseover: this.mouseover,
		click: this.click
	}
}
GridView.inheritsFrom(View);
GridView.prototype.template = Handlebars.compile($('#GridTemplate').html());
/** **************************************************************************/
function GenericContainer(superView, cssClass){
	this.id = 'GenericContainer-'+guidGenerator();
	this.superView = superView;
	this.cssClass = (cssClass == null ? 'GenericContainer' : cssClass);
	this.subViews = [];
	this.$element = null;
	if(superView){
		console.log(this.id+" adding self as sub View of: "+superView.id);
		superView.addSubView(this);
	}
}
GenericContainer.inheritsFrom(View);
GenericContainer.prototype.template = Handlebars.compile($('#GenericContainerTemplate').html());

/** **************************************************************************/
function Button(superView, controller, cssClass, label, onClickHandler){
	this.id = 'Button-'+guidGenerator();
	this.superView = superView;
	this.cssClass = (cssClass == null ? 'Button' : cssClass);
	this.subViews = [];
	this.label = label || 'button';
	this.$element = null;
	if(superView){
		console.log(this.id+" adding self as sub View of: "+superView.id);
		superView.addSubView(this);
	}
	
	this.mouseover = function(evt){
		this.$element.css('background-color', 'red');
		//console.log(this.id+" mouseover() triggered on: "+evt.target);
	}.bind(this);
	
	this.mouseout = function(evt){
		this.$element.css('background-color', 'white');
	}.bind(this);
	
	this.click = onClickHandler.bind(this);
	
	this.actions = {
		mouseover: this.mouseover,
		mouseout : this.mouseout,
		click: this.click
	}
}
Button.inheritsFrom(View);
Button.prototype.template = Handlebars.compile($('#ButtonTemplate').html());
