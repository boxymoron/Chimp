Function.prototype.bind = function (o) {
	var fn = this;
	return function () {
		return fn.apply(o, arguments);
	};
};

function EntityResultSet(entity, rows_affected, num_rows, raw_results){
	this.entity = entity;
	this.rows_affected = rows_affected;
	this.num_rows = num_rows;
	this.raw_results = raw_results;
	this.item = function(index){
		var entityObj = new entity();
		var currItem = this.raw_results.rows.item(index);
		for(var columnName in currItem){
			if(entityObj.hasOwnProperty(columnName)){
				entityObj[columnName] = currItem[columnName];
			}
		}
		return entityObj;
	}
	this.length = this.num_rows;
}

if (window.openDatabase) {
	jQuery.extend({
		db: {
			_debug: true,
			_log: [],
			log: function (message) {
				this._log.push(message);
				if (this._debug) window.console.log(message);
				
			},
			_db: null,
			_lastQuery: '',
			selectArray: [],
			fromTables: [],
			whereArray: [],
			ordering: [],
			limitCount: 0,
			limitOffset: 0,
			reset: function () {
				this.selectArray = [];
				this.fromTables  = [];
				this.whereArray  = [];
				this.ordering    = [];
				this.limitCount  = 0;
				this.limitOffset = 0;
			},
			open_db: function (settings) {
				this._db = window.openDatabase(settings.shortName, settings.version, settings.name, settings.maxSize);
			},
			create_table: function (settings, ifExists, resultsfn, errorfn) {
				var query = 'CREATE TABLE '+(ifExists ? 'IF NOT EXISTS ' : '')+settings.name+'(';
				
				var str = '';
				for (var i in settings.fields) {
					if (!settings.fields[i].type)   settings.fields[i].type = 'TEXT';
					if (!settings.fields[i].isNull) settings.fields[i].isNull = 'NOT NULL';
					
					if (str != '') str += ', ';
					str += settings.fields[i].name+' ';
					str += settings.fields[i].type+' ';
					str += settings.fields[i].isNull;
					if (settings.fields[i].extra) str += ' '+settings.fields[i].extra;
				}
				query += str;
				query += ')';
				
				return this.query(query, null, resultsfn, errorfn);
			},
			normalize_results: function (results, entity) {
				var resultSet = {
						rows_affected: results.rowsAffected,
						num_rows: results.rows.length,
						raw_results: results,
				}; 
				
				if (resultSet.num_rows > 0) {
					if(entity){
						resultSet.results = new EntityResultSet(entity, results.rowsAffected, results.rows.length, results);
					}else{
						resultSet.results = [];
						//if (results['insertId']) obj.insert_id = results.insertId;
						for (var i=0; i<results.rows.length; i++) {
							resultSet.results.push(results.rows.item(i));
						}
					}
				}
				
				return resultSet;
			},
			query: function (query, params, resultsfn, errorfn, entity) {
				this._lastQuery = query;
				var query       = query;
				var resultsfn   = resultsfn;
				var errorfn     = errorfn;
				
				var fn = function (transaction) {
					transaction.executeSql(query, (params == null ? [] : params), function (transaction, results) {
						if (resultsfn) resultsfn(this.normalize_results(results, entity), transaction, query);
					}.bind(this), function (transaction, error) {
						this.log('db error: "'+error.message+'"');
						if (errorfn) errorfn(error.message, error.code, transaction, query);
					}.bind(this));
				};
				this._db.transaction(fn.bind(this));
				
				if(params == null){
					this.log('db query: '+query);
				}else{
					this.log('db query: '+query+' params:'+JSON.stringify(params));
				}
				return query;
			},
			where: function (field, value) {
				if (typeof field === 'object') {
					for (var i in field) {
						this.whereArray.push({'field': i, 'value': field[i]});
					}
				}
				else {
					this.whereArray.push({'field':field,'value':value});
				}
				
				return this;
			},
			order_by: function (field, order) {
				if (order) {
					this.ordering = [field,order]
				}
				else {
					this.ordering = [field,'ASC']
				}
				
				return this;
			},
			limit: function (count, offset) {
				this.limitCount = count;
				this.limitOffset = offset;
				
				return this;
			},
			select: function () {
				for (var i=0; i<arguments.length; i++) {
					this.selectArray.push(arguments[i]);
				}
				
				return this;
			},
			from: function () {
				for (var i=0; i<arguments.length; i++) {
					this.fromTables.push(arguments[i]);
				}
				
				return this;
			},
			get: function (table, resultfn, errorfn) {
				if (table) {
					this.fromTables = [table];
				}
				
				//create query
				var query;
				var str;
				
				//SELECT ... FROM segment
				query      = 'SELECT ';
				if (this.selectArray.length) {
					for (var i=0; i<this.selectArray.length; i++) {
						if (i > 0) str += ', ';
						str += this.selectArray[i];
					}
					query += str;
				}
				else {
					query += '*';
				}
				query     += ' FROM ';
				
				//table list segment
				str = '';
				for (var i=0; i<this.fromTables.length; i++) {
					if (i > 0) str += ', ';
					str += this.fromTables[i];
				}
				query += str;
				
				//WHERE segment
				if (this.whereArray.length) {
					str = ' WHERE ';
					for (var i=0; i<this.whereArray.length; i++) {
						if (i > 0) str += ' AND ';
						str += this.whereArray[i].field+'="'+this.whereArray[i].value+'"';
					}
					query += str;
				}
				
				//ORDER BY segment
				if (this.ordering.length) {
					query += ' ORDER BY '+this.ordering[0]+' '+this.ordering[1];
				}
				
				//LIMIT segment
				if (this.limitCount) {
					query += ' LIMIT '+this.limitCount+(this.limitOffset ? ', '+this.limitOffset : '');
				}
				
				//reset
				this.reset();
				
				return this.query(query, null,resultfn, errorfn);
			},
			insert: function (table, data, resultfn, errorfn) {
				//INSERT INTO ... segment
				var query       = 'INSERT INTO '+table;
				var fields      = '';
				var values      = [];
				//{id: null, };
				var count = 0;
				for (var i in data) {
					//add field to list
					if (fields != '') fields += ', ';
					fields     += i;
					
					//add value to list
					values.push(data[i]);
					count++;
				}
				var paramQuestionMarks = '';
				while((count-1) >=0){
					paramQuestionMarks += '?' + (count > 1 ? ', ' :'');
					count--;
				}
				query += ' ('+fields+') VALUES ('+paramQuestionMarks+')';
				
				//reset
				this.reset();
				
				return this.query(query, values, resultfn, errorfn);
			},
			update: function (table, data, resultfn, errorfn) {
				//UPDATE ... SET ... segment
				var query = 'UPDATE '+table+' SET ';
				var str = '';
				for (var i in data) {
					if (str != '') str += ', ';
					str += i+'="'+data[i]+'"';
				}
				query += str;
				
				//WHERE segment
				if (this.whereArray.length) {
					str = ' WHERE ';
					for (var i=0; i<this.whereArray.length; i++) {
						if (i > 0) str += ' AND ';
						str += this.whereArray[i].field+'="'+this.whereArray[i].value+'"';
					}
					query += str;
				}
				
				//LIMIT segment
				if (this.limitCount) {
					query += ' LIMIT '+this.limitCount+(this.limitOffset ? ', '+this.limitOffset : '');
				}
				
				//reset
				this.reset();
				
				return this.query(query, null,resultfn, errorfn);
			},
			del: function (table, resultfn, errorfn) {
				//DELETE FROM ... segment
				var query = 'DELETE FROM '+table;
				
				//WHERE segment
				if (this.whereArray.length) {
					str = ' WHERE ';
					for (var i=0; i<this.whereArray.length; i++) {
						if (i > 0) str += ' AND ';
						str += this.whereArray[i].field+'="'+this.whereArray[i].value+'"';
					}
					query += str;
				}
				
				//LIMIT segment
				if (this.limitCount) {
					query += ' LIMIT '+this.limitCount+(this.limitOffset ? ', '+this.limitOffset : '');
				}
				
				//reset
				this.reset();
				
				return this.query(query, null, resultfn, errorfn);
			}
		},
		db_sync: {
			_debug: false,
			_lastSync: {},
			_interval: {},
			_log: [],
			log: function (message) {
				this._log.push(message);
				
				if (this._debug) window.console.log(message);
			},
			_status: {},
			status: function (table) {
				if (arguments.length == 2 || arguments.length == 3) {
					this._status[table] = arguments[1];
					if (window.onsyncstatuschange) window.onsyncstatuschange(table, this._status[table]);
					if (this._status[table] === 'ready') {
						this._lastSync[table] = Math.round((new Date()).getTime() / 1000);
					}
					if (this._status[table] === 'ready' && window.onsyncready) {
						window.onsyncready(table, this._status[table], arguments[2]);
					}
				}
				else {
					return this._status[table];
				}
			},
			_percent: {},
			percent: function (table, percent) {
				this._percent[table] = percent;
				if (window.onsyncpercent) window.onsyncpercent(table, percent);
			},
			_settings: {
				'default': {
					primaryKey: 'id',
					interval: 30000, //5 minutes default
					syncURL: '',
					type: 'replace'
				}
			},
			init: function (table, settings) {
				var table = table;
				
				if (settings) {
					var s = {};
					$.extend(s, this._settings['default'], settings);
					this._settings[table] = s;
				}
				
				//set-up interval
				this._interval[table] = setInterval(function () {
					if (jQuery.db_sync._lastSync[table]) {
						var ago = (Math.round((new Date()).getTime() / 1000 - jQuery.db_sync._lastSync[table]));
						if (ago >= 60) {
							ago = 'around '+Math.round(ago / 60)+' minute'+(Math.round(ago / 60) > 1 ? 's' : '')+' ago';
						}
						else {
							ago += ' seconds ago'
						}
						
						jQuery.db_sync.log('db sync: "'+table+'" last synced '+ago);
						if (jQuery.db_sync.status(table) != 'syncing' && ((new Date()).getTime() - jQuery.db_sync._lastSync[table] * 1000) >= jQuery.db_sync._settings[table].interval) {
							jQuery.db_sync.sync(table);
						}
					}
				}, (this._settings[table].interval / 10 < 30000 ? (this._settings[table].interval / 10 > 10000 ? this._settings[table].interval / 10 : 10000) : 30000));
				
				//sync
				if (!jQuery.db_sync._lastSync[table]) jQuery.db_sync._lastSync[table] = 0;
				if ((((new Date()).getTime() - jQuery.db_sync._lastSync[table] * 1000) >= jQuery.db_sync._settings[table].interval) || jQuery.db_sync._lastSync[table] == 0) {
					this.sync(table);
				}
				else {
					this.status(table, 'ready', false);
				}
			},
			sync: function (table) {
				var table = table;
				
				//make sure a syncURL is available
				if (!this._settings[table].syncURL) {
					this.log('db sync: no syncURL available');
					return false;
				}
				if (this._settings[table].precheck) {
					this._settings[table].precheck(function () {
						//set status
						jQuery.db_sync.status(table, 'syncing');
						
						//load data
						jQuery.ajax({
							url: jQuery.db_sync._settings[table].syncURL,
							success: function (data) {
								jQuery.db_sync.process(table, data);
							},
							error: function () {
								jQuery.db_sync.log('db sync: "'+table+'" sync failed');
								
								//set status
								jQuery.db_sync.status('ready');
							},
							type: 'GET',
							dataType: 'json'
						});
					});
				}
				else {
					//set status
					this.status(table, 'syncing');
					
					//load data
					$.getJSON(this._settings[table].syncURL, function (data) {
						jQuery.db_sync.process(table, data);
					});
				}
			},
			process: function (table, json) {
				var table = table;
				
				if (this._settings[table].processData) {
					json = this._settings[table].processData(json);
				}
				
				if (json) {
					//get total row count
					var total_rows   = json.length;
					var updated_rows = 0;
					
					jQuery.each(json, function (i, row) {
						var row = row;
						jQuery.db.where(jQuery.db_sync._settings[table].primaryKey, row[jQuery.db_sync._settings[table].primaryKey]).del(table, function () {
							jQuery.db.insert(table, row, function () {
								updated_rows++;
								jQuery.db_sync.percent(table, Math.round(updated_rows / total_rows * 100));
								jQuery.db_sync.log('db sync: "'+table+'" syncing '+(Math.round(updated_rows / total_rows * 100))+'%');
								
								if (updated_rows == total_rows) {
									jQuery.db_sync.status(table, 'ready');
								}
							});
						});
					});
					
					//set status
					this.status('ready');
				}
				else {
					this.log('db sync: "'+table+'" sync failed');
					
					//set status
					this.status('ready');
				}
			}
		}
	});
}