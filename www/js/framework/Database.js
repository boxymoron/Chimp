App.Database = function(name, schema) {
		/** Private Properties **/
		var VERSION = '1.0';
		var NAME = name;
		var SIZE = 1;// * 1024 * 1024;
		var db = null;
		
		function init(){
			$.db.open_db({
				shortName: NAME,
				version:   VERSION,
				name:      NAME,
				maxSize:   SIZE
			});

			this.db = $.db._db;
			var that = this;
			var $d = $.Deferred();

			this.db.transaction(
				function(tx) {
					tx.executeSql("SELECT count(*) FROM RSSFeed", null, success, error)
				}
			);

			function success(tx, rs) {
				if (rs.rows.length == 1 && rs.rows.item(0)['count(*)'] > 1){
					console.log('Database is already initialized');
					$d.resolve();
				}else{
					console.log('Database is empty');

					refresh.bind(that)()
					.done(function(){
						$d.resolve();
					})
					.fail(function(err){
						$d.reject(error);
					});
				}
			}

			function error(tx, error) {
				refresh.bind(that)()
				.done(function(){
					$d.resolve();
				})
				.fail(function(err){
					$d.reject(error);
				});
			}

			return $d.promise();
		}
		
		/** Initialization code */
		function refresh(){
			var that = this;
			var $d = $.Deferred();

			var rssFeeds = ['http://www.wsj.com/xml/rss/3_7085.xml', 'http://feeds.arstechnica.com/arstechnica/index?format=xml&limit=100', 'http://feeds.arstechnica.com/arstechnica/apple?format=xml&limit=100'];//,
            				/*'http://rss.slashdot.org/Slashdot/slashdotLinux',
            				'http://rss.slashdot.org/Slashdot/slashdotPolitics',
            				'http://rss.slashdot.org/Slashdot/slashdotDevelopers',
            				'http://rss.slashdot.org/Slashdot/slashdotYourRightsOnline',
            				'http://rss.cnn.com/rss/cnn_topstories.rss',
            				'http://www.npr.org/rss/rss.php?id=1001'];*/

			var start = new Date().getTime();

			var processFeeds = function (transaction) {
				var dropTables = [];
				for(var i=0; i < schema.tables.length; i++){
					var currTable = schema.tables[i];
					dropTables.push(dropTable(transaction, currTable));
				}

				var createTables = [];
				$.when.apply(this, dropTables)
                .done(function(){
					for(var i=0; i < schema.tables.length; i++){
						var currTable = schema.tables[i];
						createTables.push(createTable(transaction, currTable));
					}
				}).fail(function(err){
					console.log("Error while dropping tables: "+err);
				});

				var insertDatas = [];
				$.when.apply(this, createTables)
				.done(function(){
					for(var i=0; i<rssFeeds.length;i++){
						insertDatas.push(insertData.bind(that)(rssFeeds[i]));
					}
				})
				.fail(function(err){
					console.log("Error while creating tables: "+err)
				});

				$.when.apply(this, insertDatas)
				.done(function(){
					console.log("Done with all ajax requests")
					$d.resolve();
				}).fail(function(err){
					$d.resolve();
					console.log("Error while inserting data: "+err)
				});

			};

			function success(){
				window.console.log("Transaction finished in "+((new Date().getTime() - start)+" ms."));

			}
			function error(tx, error) {
				$d.reject(error);
			}

			//tx callback, error callback, success callback
			this.db.transaction(processFeeds.bind(this), errorCB, success);

			return $d.promise();
		};

		function dropTable(transaction, currTable){
			var $d = $.Deferred();
			function success(){
				window.console.log("Dropped table: "+currTable.name);
				$d.resolve();
			}
			function error(tx, err) {
				window.console.log("Error dropping table: "+err);
				$d.reject(err);
			}
            transaction.executeSql('DROP TABLE IF EXISTS '+currTable.name, null, success, error);
            return $d.promise();
		}
		
		function createTable(transaction, currTable){
			var $d = $.Deferred();

			function success(){
				window.console.log("Created table: "+currTable.name);
				$d.resolve();
			}

			function error(tx, error) {
				window.console.log("Error creating table: "+err);
				$d.reject(error);
			}

			var query = 'CREATE TABLE IF NOT EXISTS '+currTable.name+'(';
			
			var str = '';
			for (var i in currTable.fields) {
				if (!currTable.fields[i].type)   currTable.fields[i].type = 'TEXT';
				if (!currTable.fields[i].isNull) currTable.fields[i].isNull = 'NOT NULL';
				
				if (str != '') str += ', ';
				str += currTable.fields[i].name+' ';
				str += currTable.fields[i].type+' ';
				str += currTable.fields[i].isNull;
				if (currTable.fields[i].extra) str += ' '+currTable.fields[i].extra;
			}
			query += str;
			query += ')';

			transaction.executeSql(query, null, success, error);

			return $d.promise();
		}
		
		this.getName = function(){
			return this.NAME;
		}
		
		function insertData(url) {
			var $d = $.Deferred();
			var that = this;
			var success = function(xml){
				console.log("inserting data for feed: "+url);
				var xmlData = $(xml);
				var count = 0;
				var deferreds = [];

				$(xmlData).find("item").each(function(index, element){
					var $deferred = $.Deferred();
					if(count++ > 1024){
						return false;
					}
					var $xmlData = $(this);
					var title = $xmlData.find("title").text();
					var description = $xmlData.find("description").text().replace(/(')|(\n)/gm,"");
					if(description.length !== 0){
						var link = $xmlData.find("link").text();
						var pubDate = new Date($xmlData.find("pubDate").text()).getTime();
						if(isNaN(pubDate)){
							pubDate = new Date();
						}
						var content = null;
						var imageLink = 'images/grid/grid'+parseInt((index % 9)+1)+'.jpg';
						try{
							content = $($xmlData.filterNode("content:encoded").text().replace('<![CDATA[', '').replace(']]>', ''));
							var $img = $(content).find('img');

							if($img.length > 0){
								imageLink = $img.attr('src');
							}

							content = content.html();
							if(content == null || content.length == 0){
								content = "n/a";
							}

							var feed = new RSSFeed(title, description, link, pubDate, imageLink, content);
							that.db.transaction(
								feed.saveInTransaction.bind(feed),
								function(err){$deferred.reject(err);},
								function(){$deferred.resolve();}
							);
							deferreds.push($deferred.promise());
						}catch(err){
							console.log(err);
						}
					}
				});

				$.when.apply(this, deferreds)
				.done(function(){
					console.log("Done with current ajax request: "+url)
					$d.resolve();
				}).fail(function(err){
					$d.resolve();
					console.log("Error with current ajax request: "+url+" : "+err)
				});
				$d.resolve();
			};

			$.ajax({
		    	url: url, //../data/cnn.rss
		    	dataType: 'xml',
		    	async: true,//very important
		    	success: success,
		    	error: function(error){
		    		$d.reject(error);
		    	}
		    });

		    return $d.promise();
		}
		
		function readData(norm_results, tx, queryStr){
			App.log(norm_results.results);
			for(result in norm_results.results){
				//App.log("result: "+JSON.stringify(norm_results.results[result]));
			}
		}
		function successCB(tx, rs){
			window.console.log("Transaction successful: rs.rowsAffected: "+rs.rowsAffected);
		}

		function errorCB (tx, err) {
			window.console.log("Error processing SQL: "+err);
		}
		
		return{
			init : init,
			refresh: refresh,
			successCB: successCB
		}
	}