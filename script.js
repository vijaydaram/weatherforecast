// Code goes here

var myApp = angular.module('myApp', ['ngRoute','ngAutocomplete']);
myApp.filter('escape', function() {
    return window.encodeURIComponent;
});
myApp.filter('titlecase',function(){
    return function(str){return str&&str.charAt(0).toUpperCase()+str.substring(1,str.length);}
});
myApp.filter('formatTemperature', [function() {
    return function(input, scale, label) {
        var value = parseInt(input, 10),
        convertedValue;
        if (isNaN(value)) throw new Error('Input is not a number');
        if (scale === 'F') {
            convertedValue = Math.round(value * 9.0 / 5.0 + 32);
        } else if (scale === 'C') {
            convertedValue = Math.round((value - 32) * 5.0 / 9.0);
        } else {
            throw new Error('Not a valid scale');
        }

        return label ? convertedValue += '\u00B0' : convertedValue;
    };
    }
]);
myApp.filter('fullDay'
,[function(){
    return function(input){
        var days={'sun':'Sunday','mon':'Monday','tue':'Tuesday','wed':'Wednesday','thu':'Thursday','fri':'Friday','sat':'Saturday'};
        return days[input.toLowerCase()];
    };
}]);
myApp.service('myService',function($http){
    var self=this;
    self.loading=false;
    this.days={'sun':'Sunday','mon':'Monday','tue':'Tuesday','wed':'Wednesday','thu':'Thursday','fri':'Friday','sat':'Saturday'};
    var details={};
    this.getWeather=function(city,callback){
        return $http.get(self.urlStart+encodeURIComponent(self.queryStart+city+self.queryEnd)+self.urlEnd);
    }
    this.urlStart="https://query.yahooapis.com/v1/public/yql?q=";
    this.queryStart="select * from weather.forecast where woeid in (select woeid from geo.places(1) where text=\"";
    this.queryEnd="\")";
    this.urlEnd="&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";

});

myApp.controller("TestCtrl",['$scope','myService','$rootScope',function ($scope,myService,$rootScope) {
    $scope.result1 = '';
    $scope.options1 = null;
    $scope.details1 = '';
    $scope.loading=false;
    $scope.locationUrl='#';
    $scope.weatherResults='';
    $scope.$watch('result1',function(){
        if($scope.result1!==''){
            $scope.loading=true;
                myService.getWeather($scope.result1).success(function(result){
                    $scope.weatherResults = result.query.results;
                $scope.weather = result.query && result.query.results.channel.item.forecast;
                $scope.city=result.query.results.channel.title.split("-")[1].trim();
                $rootScope.city=$scope.result1; 
                $rootScope.tempWeather = $scope.weather;
                $rootScope.details=$scope.details1;
                myService.details = $scope.details1; 
                    $scope.locationUrl = 'http://maps.google.com/maps?z=10&t=p&q='+$scope.result1+'&loc:'+$scope.details1.geometry.location.lat()+'+'+$scope.details1.geometry.location.lng();
            }).error(function(data, status){
                    console.log(data);
                }).finally(function(){
                    $scope.loading=false;
                }); 
        }
    })
}]);

myApp.controller('MapCtrl', ['$scope','myService','$rootScope',function ($scope,myService,$rootScope) {
    var mapOptions = {
        zoom: 10,
        center: new google.maps.LatLng(17.385044, 78.486671),
        mapTypeId: google.maps.MapTypeId.TERRAIN
    }
    $scope.weatherResults='';
    $scope.city='';
    $scope.$watch(function(){return $rootScope.city;},function(){
         $scope.weatherResults=$rootScope.tempWeather;
           $scope.city=$rootScope.city;
        var temp=$rootScope.details&&$rootScope.details.geometry&&$rootScope.details.geometry.location&&$rootScope.details.geometry.location.lat();
        mapOptions.center = new google.maps.LatLng(temp,$rootScope.details.geometry.location.lng());
        $scope.map = new google.maps.Map(document.getElementById('map'), mapOptions);
        $scope.content = '<table><tr><td rowspan="2"><img src="http://l.yimg.com/a/i/us/we/52/'+$rootScope.tempWeather[0].code+'.gif"/></td>'+'<td>'+$rootScope.tempWeather[0].date+'( '+myService.days[$rootScope.tempWeather[0].day.toLowerCase()]+' )</td></tr><tr><td><label>'+$rootScope.tempWeather[0].text+'</label></td></tr>'; createMarker({'lat':$rootScope.details.geometry.location.lat(),'long':$rootScope.details.geometry.location.lng(),'city':$rootScope.city,'desc':$scope.content});
        $scope.openInfoWindow($scope.marker);
    });

    $scope.marker={};

    var infoWindow = new google.maps.InfoWindow();

    var createMarker = function (info){
        var marker = new google.maps.Marker({
            map: $scope.map,
            position: new google.maps.LatLng(info.lat, info.long),
            title: info.city
        });
        marker.content = '<div class="infoWindowContent">' + info.desc + '</div>';

        google.maps.event.addListener(marker, 'click', function(){
            infoWindow.setContent('<h5>' + marker.title + '</h5>' + marker.content);
            infoWindow.open($scope.map, marker);
        });

    $scope.marker = marker;                            

    }  
    $scope.openInfoWindow = function(selectedMarker){
    google.maps.event.trigger(selectedMarker, 'click');
    }
}]);

myApp.directive("myCurrentTime", function(dateFilter){
    return function(scope, element, attrs){
        var format='dd MMM yyyy h:mm:ss a';
        
        /*scope.$watch(attrs.myCurrentTime, function(value) {
            format = value;
           
        });*/
        
        function updateTime(){
            var dt = dateFilter(new Date(), format);
            element.text(dt);
        }
         updateTime();
        
        function updateLater() {
            setTimeout(function() {
              updateTime(); // update DOM
              updateLater(); // schedule another update
            }, 1000);
        }
        
        updateLater();
    }
});