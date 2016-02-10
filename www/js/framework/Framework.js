//Declare the App module
var App = function () {
	/**
	 * Private members
	 */
	var DB = null;
		
	/**
	 * Public members
	 */
	var init = function(callback){
		console.log("App.init()");
		this.showDeviceInfo();
		this.DB = new this.Database('ChimpDB', App.Schema);
		this.DB.init()
        .done(function(){
			callback();
        })
        .fail(function(err){
        	console.log('Error '+err);
        });
	}
	
	var refresh = function(callback){
		console.log("App.refresh()");
		this.showDeviceInfo();
		//this.DB = new this.Database('ChimpDB', App.Schema);
		this.DB.refresh()
		.done(function(){
			callback();
		 })
		 .fail(function(err){
			console.log('Error '+err);
		 });;
	}
	
	var showDeviceInfo = function(){
		if(typeof device === 'object'){
			window.console.html('Device Name: ' + device.name + '<br />' + 
					       	 'Device PhoneGap: ' + device.phonegap + '<br />' + 
					       	 'Device Platform: ' + device.platform + '<br />' + 
					       	 'Device UUID: '     + device.uuid     + '<br />' + 
					       	 'Device Version: '  + device.version  + '<br />');
		}
	}

    return {
    	showDeviceInfo: showDeviceInfo,
    	init : init,
    	refresh: refresh,
    	log: function(msg){if(window.console)console.log(msg);}
    }
    
}();

/*****************************************************************************/
//function HomePage(){
	
	
//}

$(window).load(function () {
	App.page = new PageView(null, 'PageView');//instantiate the Page View
	App.page.gridView = new GridView(App.page, null, new RSSList(), 'RSSList');//superView, controller, model, cssClass
	//App.page.addSubView(page.gridView);
	
	App.page.gridView.buttonContainer = new GenericContainer(App.page.gridView, 'ButtonsContainer');
	
	App.page.gridView.buttonContainer.previous = new Button(App.page.gridView.buttonContainer, null, null, 'Previous', function(evt){
		this.$element.css('background-color', 'green');
		if(App.page.gridView.model.decrementIndex()){
			window.history.pushState({state: "decrement"}, "title");
			App.page.gridView.render();
		}
	});
	
	App.page.gridView.buttonContainer.refresh = new Button(App.page.gridView.buttonContainer, null, null, 'Refresh', function(evt){
		App.refresh(function(){
			window.console.log('in App.init() callback');
			//var homePage = new HomePage();
			App.page.render();
		});
	});
	
	App.page.gridView.buttonContainer.next = new Button(App.page.gridView.buttonContainer, null, 'Button', 'Next', function(evt){
		//this.$element.css('background-color', 'green');
		if(App.page.gridView.model.incrementIndex()){
			window.history.pushState({state: "increment"}, "title");
			App.page.gridView.render();
		}
	});
	
	window.history.pushState({state: "initial"}, "title");
	window.onpopstate = function(event){
		if(event.state){
			if(event.state.state === "decrement"){
				//App.page.gridView.buttonContainer.next.click();

			}else if(event.state.state === "increment"){
				//App.page.gridView.buttonContainer.previous.click();
			}
		}
	};
	
	App.init(
		function(){
			window.console.log('in App.init() callback');
			//var homePage = new HomePage();
			App.page.render();
			//App.page.gridView.render();
	});
	
	//document.addEventListener("deviceready", onDeviceReady);
	//function onDeviceReady() {
		App.showDeviceInfo();
		$(document).bind('orientationchange', function(){
			App.log(arguments);
		});
	//}
});
