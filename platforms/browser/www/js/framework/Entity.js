/************************** Model ********************************************/
App.Schema = {
	tables : [
	    {name : "User", fields: [{name: 'id', type: 'INTEGER', extra: 'PRIMARY KEY AUTOINCREMENT'}, {name: 'firstName', type: 'TEXT'}, {name: 'lastName', type: 'TEXT'}, {name: 'email', type: 'TEXT'}]  },
	    {name : "Publication", fields: [{name: 'id', type:'TEXT', extra: 'PRIMARY KEY'}, {name:'lastSynch', type: 'TIMESTAMP'}]},
	    {name : "RSSFeed", fields: [{name: 'id', type: 'INTEGER', extra: 'PRIMARY KEY AUTOINCREMENT'}, {name: 'title', type: 'TEXT'}, {name: 'description', type: 'TEXT'}, {name: 'link', type: 'TEXT'}, {name: 'website', type: 'TEXT'}, {name: 'pubDate', type: 'INTEGER'}, {name: 'image', type: 'TEXT'}]  },
	    {name : "Ticker", fields: [{name: 'id', type: 'INTEGER', extra: 'PRIMARY KEY AUTOINCREMENT'}, {name: 'symbol', type: 'TEXT'}, {name: 'description', type: 'TEXT'}]  }
	]
};

/**
 * Base class for Entities
 */
App.Entity = function(){ }//constructor
App.Entity.prototype.id = -1;

/**
 * Saves or Updates this Entity
 */
App.Entity.prototype.saveInTransaction = function(transaction){
	if(this.id !== null){//UPDATE
		App.log("save() update="+JSON.stringify(this));
		var props = {};
		for(prop in this){
			if(this.hasOwnProperty(prop)){
				if(prop === 'id' || prop === 'name')continue;
				props[prop] = this[prop];
			}
		}
		$.db.where('id', this.id).update(this.name, props, 
		function(norm_results, tx, queryStr){
			if(success)success();
		},
		function() {
			if(error)error();
			App.debug("Error processing SQL: "+JSON.stringify(arguments));
		});
	}else{//INSERT
		var props = {id: null};
		var query       = 'INSERT INTO '+this.name;
		var fields      = 'id';//pre-include the id
		var values      = [];
		values.push(null);
		var count = 0;
		for(prop in this){
			if(this.hasOwnProperty(prop)){
				if(prop === 'id' || prop === 'name')continue;
				//add field to list
				if (fields != '') fields += ', ';
				fields += prop;
				
				//add value to list
				values.push(this[prop]);
				count++;
			}
		}
		var paramQuestionMarks = '?, ';//pre-include the param holder for id
		while((count-1) >=0){
			paramQuestionMarks += '?' + (count > 1 ? ', ' :'');
			count--;
		}
		query += ' ('+fields+') VALUES ('+paramQuestionMarks+')';
		//console.log(query+" ");
		transaction.executeSql(query, values, 
			function(){
				//window.console.log("Insert successful "+(arguments ? JSON.stringify(arguments) : ''));
			}.bind(this),
			function() {
				window.console.log("Error processing SQL: "+JSON.stringify(arguments));
			});
	}
}

App.Entity.prototype.save = function(success, error){ 
	var self = this;
	if(this.id !== null){//UPDATE
		App.log("save() update="+JSON.stringify(this));
		var props = {};
		for(prop in this){
			if(this.hasOwnProperty(prop)){
				if(prop === 'id' || prop === 'name')continue;
				props[prop] = this[prop];
			}
		}
		$.db.where('id', this.id).update(this.name, props, 
		function(norm_results, tx, queryStr){
			if(success)success();
		},
		function() {
			if(error)error();
			App.debug("Error processing SQL: "+JSON.stringify(arguments));
		});
	}else{//INSERT
		var props = {id: null};
		for(prop in this){
			if(this.hasOwnProperty(prop)){
				//App.log(prop);
				if(prop === 'id' || prop === 'name'){
					continue;
				}else{
					props[prop] = this[prop];
				}
			}
		}
		//App.debug(props);
		
		$.db.insert(this.name, props, 
		function(norm_results, tx, queryStr){
			//log(norm_results.raw_results.insertId);
			self.id=norm_results.raw_results.insertId;//update the Model object's id
			App.log(self.name+" saved:"+JSON.stringify(self));
			if(success)success();
		},
		function() {
			if(error)error(arguments);
			App.debug("Error processing SQL: "+JSON.stringify(arguments));
		});
	}
}

/**
 * Deletes this Entity
 */
App.Entity.prototype.del = function(callback){
	if(this.id !== null){
		log("del() called on "+JSON.stringify(this));
		$.db.where('id', this.id).del(this.name, 
		function(norm_results, tx, queryStr){
			if(callback)callback();
		},
		function() {
			log("Error processing SQL: "+JSON.stringify(arguments));
		});
	}
}

/************************** User *****************************************/
function User(firstName, lastName, email){ 
	this.name = "User";
	this.firstName = firstName|| null;//otherwise 'undefined' ends up in the db
	this.lastName = lastName || null;
	this.email = email|| null;
	this.id = null;
} 
User.inheritsFrom(App.Entity);

/************************** Publication ***********************************/
function Publication(lastSynch){
	this.name = "Publication";
	this.lastSynch = lastSynch || null;//otherwise 'undefined' ends up in the db
	this.id = null;
} 
Publication.inheritsFrom(App.Entity);

/************************** RSSFeed **************************************/
function RSSFeed(title, description, link, pubDate, image){
	this.name = "RSSFeed";
	this.title = title || null;//otherwise 'undefined' ends up in the db
	this.description = description || null;
	this.link = link || null;
	this.website = link ? link.replace(/http:[/]+([^/]+).*/, '$1') : null;
	this.pubDate = pubDate || null;
	this.id = null;
	this.image = image || null;
} 
RSSFeed.inheritsFrom(App.Entity);

/************************** Ticker ***************************************/
function Ticker(symbol, description){
	this.name = "Ticker";
	this.symbol = symbol || null;//otherwise 'undefined' ends up in the db
	this.description = description;
	this.id = null;
} 
Ticker.inheritsFrom(App.Entity);
