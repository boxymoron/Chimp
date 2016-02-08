/** ***************************** Mixins *************************************/
function Paginable(limit, total){
	this.cursor = 1;
	this.limit = limit;
	this.total = total;
	this.reachedLimit = false;
	
	this.incrementIndex = function(){
		if(this.cursor + this.limit <= this.total){
			this.cursor += this.limit;
			return true;
		}else{
			return false;
		}
	}.bind(this);
	
	this.decrementIndex = function(){
		if(this.cursor - this.limit >= 1){
			this.cursor -= this.limit;
			return true;
		}else{
			return false;
		}
	}.bind(this);
	
	this.refresh = function(callback, query, entity){
		var queryParams = [this.cursor, (this.cursor+(this.limit-1))];
		var callback = callback;
		$.db.query(query, queryParams, 
			function(norm_results, tx, queryStr){
				if(norm_results.num_rows > 0){
					callback(norm_results);
				}else{
					console.log("0 results");
					if(this.cursor > limit){
						this.cursor -= limit;
						this.total = this.cursor;
					}

				}
			}.bind(this), function(error){
				console.log(JSON.stringify(arguments));
			}, entity);
	}.bind(this);
	/**
	 * The bind() method creates a new function that, when called, 
	 * has its this keyword set to the provided value, with a given sequence of arguments preceding any provided when the new function is called.
	 */
}

/** ***************************** Models *************************************/
function Model(){}
Model.prototype = {
	addDependent : function(view){
		this.dependents[view.id] = view;
	},
	removeDependent : function(view){
		if(dependents[view.id]){
			delete dependents[view.id];
		}
	}
};

function RSSList(){
	this.entity = RSSFeed;
	this.view = GridView;
	this.dependents = {};
	
	this.query = 'SELECT * FROM RSSFeed where id >= ? and id <= ? ORDER BY pubDate desc';
	
	/** This gets passed to Views **/
	this.model = function(results){
		return{
			'id' : this.id, 
			'model': this.type, 
			'class': this.type,
			'entries': results,
			'previous': {id: 'previous', value: 'previous'},
			'refresh': {id: 'refresh', value: 'refresh'},
			'next': {id: 'next', value:'next'}
	
		}
	};
	
	this.onChange = function(args){
		for(var i=0; i < dependents.length; i++){
			dependents[i].message({'changed': this, 'args': args});
		}
	}
	
	this.message = function(msg){
		console.log(msg);
	}

	this.get = function(callback){
		console.log("RSSList.render() called with: ");
		console.log(arguments);
		this.refresh(
			function(norm_results){
				var model = this.model(norm_results.results);
				callback(model);
			}.bind(this), this.query, this.entity);
	};
	
}

RSSList.prototype = {
		type: 'RSSList'
}

/**
    Apply the Paginable mixin to RSSList
    The call() method calls a function with a given 'this' value and arguments provided individually.
	NOTE: While the syntax of this function is almost identical to that of apply(), 
	the fundamental difference is that call() accepts an argument list, while apply() accepts a single array of arguments.
 */
Paginable.call(RSSList.prototype, 240, 1024);

/** **************************************************************************/