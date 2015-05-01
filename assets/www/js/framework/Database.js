App.Database = function(name, schema) {
		/** Private Properties **/
		var VERSION = '1.0';
		var NAME = name;
		var SIZE = 1;// * 1024 * 1024;
		var db = null;
		
		function checkStatus(callback){
				$.db.open_db({
				    shortName: NAME,
				    version:   VERSION,
				    name:      NAME,
				    maxSize:   SIZE
				});
				
				this.db = $.db._db;
				
				this.db.transaction(function(transaction){
					transaction.executeSql('SELECT count(*) FROM RSSFeed', null, function(transaction, results){
				        if (results.rows.length == 1 && results.rows.item(0)['count(*)'] > 1){
				            console.log('Database '+NAME+' is already initialized');
				            if(callback)callback(true);
				        }else{
				        	console.log('Database '+NAME+' is NOT initialized');
				        	if(callback)callback(false);
				        }
					});
			}, function(){
				errorCB(arguments);
				console.log('Database '+NAME+' is NOT initialized');
	        	if(callback)callback(false);
			});
		}
		
		/** Initialization code */
		function init(callback){
			var start = new Date().getTime();
			var fn = function (transaction) {
				
				for(var i=0; i< schema.tables.length; i++){
					var currTable = schema.tables[i];
					transaction.executeSql('DROP TABLE IF EXISTS '+currTable.name, null);
					createTable.bind(this)(transaction, currTable);
				}
				//, 'http://rss.slashdot.org/Slashdot/slashdotLinux', 'http://rss.slashdot.org/Slashdot/slashdotPolitics','http://rss.slashdot.org/Slashdot/slashdotDevelopers','http://rss.slashdot.org/Slashdot/slashdotYourRightsOnline','http://rss.cnn.com/rss/cnn_topstories.rss'
				var rssFeeds = ['http://feeds.arstechnica.com/arstechnica/index?format=xml', 'http://rss.slashdot.org/Slashdot/slashdotLinux', 'http://rss.slashdot.org/Slashdot/slashdotPolitics','http://rss.slashdot.org/Slashdot/slashdotDevelopers','http://rss.slashdot.org/Slashdot/slashdotYourRightsOnline','http://rss.cnn.com/rss/cnn_topstories.rss'];
				//var rssFeeds = ['http://localhost/cnn.rss']
				for(var i=0; i<rssFeeds.length;i++){
					insertData.bind(this)(transaction, rssFeeds[i]);
				}
			};
			this.db.transaction(fn.bind(this), errorCB, timeTransaction.partial(start, callback));
		}
		
		function timeTransaction(start, callback){
			window.console.log("Transaction finished in "+((new Date().getTime() - start)+" ms."));
			if(callback)callback();
		}
		
		function createTable(transaction, currTable){
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
			transaction.executeSql(query, null, successCB, errorCB);
		}
		
		this.getName = function(){
			return this.NAME;
		}
		
		function insertData(transaction, url) {
			console.log("inserting data for feed: "+url);
			$.ajax({
		    	url: url, //../data/cnn.rss
		    	dataType: 'xml',
		    	async:false,//very important
		    	success: function(xml){
		    		var xmlData = $(xml);
		    		var count = 0;
					$(xmlData).find("item").each(function(index, element){
						if(count++ > 32){
					    	return false;
					    }
						var $xmlData = $(this);
						var title = $xmlData.find("title").text();
						var description = $xmlData.find("description").text();
						var link = $xmlData.find("link").text();
						var pubDate = new Date($xmlData.find("pubDate").text()).getTime();
						var imageLink = $xmlData.filterNode("content:encoded");
						
						try{
							if(imageLink.length > 0){
								imageLink = $(imageLink.text().replace('<![CDATA[', '').replace(']]>', ''));
								//console.log("imageLink = "+imageLink.text());
								imageLink = imageLink.find('img');
								if(imageLink.length > 0){
									//console.log("Found content:encoded section in RSS Feed "+title+" : "+imageLink.attr('src'));
									imageLink = imageLink.attr('src');
								}else{
									imageLink = null;
								}
							}else{
								imageLink = null;
							}
						}catch(err){
							//console.log(err);
							imageLink = null;
						}
						if(description.length !== 0){
							description = description.replace(/(')|(\n)/gm,"");
							//'../images/grid/grid'+parseInt((index%9)+1)+'.jpg'
							(new RSSFeed(title, description, link, pubDate, imageLink == null ? 'images/grid/grid'+parseInt((index%9)+1)+'.jpg' : imageLink)).saveInTransaction(transaction);
						}
					});
		    	},
		    	error: function(error){
		    		window.console.log("Error: "+error.message);
		    	}
		    });
		}
		
		function readData(norm_results, tx, queryStr){
			App.log(norm_results.results);
			for(result in norm_results.results){
				//App.log("result: "+JSON.stringify(norm_results.results[result]));
			}
		}
		function successCB(){
			window.console.log("Transaction successful"+(arguments ? JSON.stringify(arguments) : ''));
		}
		function errorCB () {
			window.console.log("Error processing SQL: "+JSON.stringify(arguments));
		}
		
		return{
			init : init,
			checkStatus: checkStatus,
			successCB: successCB
		}
	}