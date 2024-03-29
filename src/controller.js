
//
// Angular Controller
function controller($scope,$filter,$http) {

	var server = "http://localhost:5500";

	// Fields
	$scope.fields = ['reference', 'domain', 'client_id', 'client_secret'];

	// Apps
	// A list of the users currently registered apps
	$scope.apps = [];
	$scope.addApp = function(){
		$scope.apps.push({
			client_id : '',
			client_secret : '',
			admin_id : getAdmins().join(' ')
//			service : ''
		});
		$scope.$apply();
	};

	$scope.saveApps = function(){

		// Loop through all the apps
		for(var i=0;i<$scope.apps.length;i++){
			postApp($scope.apps[i]);
		}

	};

	//
	// Post individual app
	$scope.postApp = function(app){

		// Get the current users signed attributes
		var admins = getAdmins();

		// Ensure that all the current profiles are defined in the admin_id section.
		var a = app.admin_id.split(/[\s\,]+/);

		for(var j=0;j<admins.length;j++){
			if(a.indexOf(admins[j]) === -1){
				a.push(admins[j]);
			}
		}
		app.admin_id = a.join(' ');


		// Post this request off to the server
		$http({
			url: server + "/rest",
			method: "POST",
			data: app
		}).success(function(response){

			// Update the guid to the app in memory
			if(!app.guid&&!response.guid){
				console.error(response);
				return;
			}
			else{
				alert("Successfully updated records");
			}
			app.guid = response.guid;

			// update view
			$scope.$apply();
		});
	};

	//
	// Delete
	$scope.deleteApp = function(app){

		if(!app.guid){
			removeItem();
			return;
		}

		// Post this request off to the server
		$http({
			url: server + "/rest",
			method: "GET",
			params: {guid:app.guid, action:'delete'}
		}).success(function(response){

			removeItem();

		});

		function removeItem(){
			// Loop through all the apps
			for(var i=0;i<$scope.apps.length;i++){
				if($scope.apps[i]===app){
					$scope.apps.splice(i,1);
					console.log($scope.apps,i);
				}
			}

			// update view
			$scope.$apply();
		}
	};


	// Profiles
	$scope.profiles = [];
	$scope.defaultProfile = null;

	for(var x in CLIENT_IDS){
		$scope.profiles.push(new Profile(x));
	}


	// Get the user credentials
	hello.subscribe('auth.login', function(auth){
		hello.api(auth.network+":me", function(o){

			if(!o||o.error){
				return;
			}

			// Update the Profile
			for(var i=0;i<$scope.profiles.length;i++){
				var profile = $scope.profiles[i];
				if(profile.network === auth.network){

					// Asign the first one to be the default profile
					if(!$scope.defaultProfile){
						$scope.defaultProfile = profile;
					}

					// Add Access Token to the profile
					o.access_token = auth.authResponse.access_token;

					// Update the profile
					profile.update(o);

					// User the profile.id to make a REST request to the server for more the data
					$http({
						url: server + "/rest",
						method: "GET",
						params: {
							"access_token": profile.access_token,
							"admin_id" : profile.id
						}
					}).success(function(response){
						// Loop through the rows and add to the list of the users apps.
						for(var i=0;i<response.rows.length;i++){
							var b = true;
							// Does it exist
							for(var j=0;j<$scope.apps.length;j++){
								if($scope.apps[j].guid===response.rows[i].guid){
									b=false;
								}
							}
							if(b){
								$scope.apps.push(response.rows[i]);
							}
						}

						// update view
						$scope.$apply();
					});

					// update view
					$scope.$apply();
				}
			}
		});
	});

	hello.init(CLIENT_IDS, {
		redirect_uri : REDIRECT_URI,
		display : "page",
		oauth_proxy : "/proxy"
	});


	function getAdmins(){

		var ids = [];

		// Get a snapshot of the current profiles
		for(i=0;i<$scope.profiles.length;i++){
			var id = $scope.profiles[i].id;
			if(id){
				ids.push(id);
			}
		}

		return ids;
	}

}

//
// Profile Controls user access
// A user may have multiple profiles
function Profile(network){
	this.network = network;
	this.name = null;
	this.thumbnail = null;
	this.id = null;
	this.access_token = null;

	this.signin = function(){
		hello.login(network, {display:'popup'});
	};

	this.update = function(o){
		if(o.name){
			this.name = o.name;
		}
		if(o.thumbnail){
			this.thumbnail = o.thumbnail;
		}
		if(o.id){
			this.id = o.id + '@' + this.network;
		}
		if(o.access_token){
			this.access_token = o.access_token;
		}


		console.log(this);
	};
}

var app = angular.module('app',[]);
app.directive('contenteditable', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      // view -> model
      element.bind('blur', function() {
        scope.$apply(function() {
          ctrl.$setViewValue(element.html());
        });
      });

      // model -> view
      ctrl.$render = function() {
        element.html(ctrl.$viewValue);
      };

      // load init value from DOM
      ctrl.$render();
    }
  };
});