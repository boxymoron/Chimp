Function.prototype.inheritsFrom = function( parentClassOrObject ){ 
	if(parentClassOrObject.constructor == Function){ 
		//Normal Inheritance 
		this.prototype = new parentClassOrObject;
		this.prototype.constructor = this;
		this.prototype.parent = parentClassOrObject.prototype;
	}else{
		//Pure Virtual Inheritance 
		this.prototype = parentClassOrObject;
		this.prototype.constructor = this;
		this.prototype.parent = parentClassOrObject;
	} 
	return this;
}

Function.prototype.partial = function(){
	var fn = this, args = Array.prototype.slice.call(arguments);
	return function(){
		var arg = 0;
		for ( var i = 0; i < args.length && arg < arguments.length; i++ )
			if ( args[i] === undefined )
				args[i] = arguments[arg++];
		return fn.apply(this, args);
	};
};

function namespace(namespaceString) {
	var parts = namespaceString.split('.');
	var parent = window;
	var currentPart = '';    

	for(var i = 0, length = parts.length; i < length; i++) {
		currentPart = parts[i];
		parent[currentPart] = parent[currentPart] || {};
		parent = parent[currentPart];
	}

	return parent;
}

BlockMove = function(event) {
	event.preventDefault() ;
}

function equal(a,b) {
	if (a === b)
		return true ;
	if (isNaN(a) && isNaN(b))
		return true ;
	return false
}

function getErrorObject(){
	try { throw Error('') } catch(err) { return err; }
}

function guidGenerator() {
	var S4 = function() {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	};
	return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}


//from http://www.dustindiaz.com/async-method-queues
function Queue() {
	// store your callbacks
	this._methods = [];
	// keep a reference to your response
	this._response = null;
	// all queues start off unflushed
	this._flushed = false;
}

Queue.prototype = {
		// adds callbacks to your queue
		add : function(fn) {
			// if the queue had been flushed, return immediately
			if (this._flushed) {
				fn(this._response);
				// otherwise push it on the queue
			} else {
				this._methods.push(fn);
			}
		},
		flush : function(resp) {
			// note: flush only ever happens once
			if (this._flushed) {
				return;
			}
			// store your response for subsequent calls after flush()
			this._response = resp;
			// mark that it's been flushed
			this._flushed = true;
			// shift 'em out and call 'em back
			while (this._methods[0]) {
				this._methods.shift()(resp);
			}
		}
};

$.fn.filterNode = function(name) {
    return this.find('*').filter(function() {
      return this.nodeName === name;
    });
  };