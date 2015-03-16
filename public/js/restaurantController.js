var RestaurantController = function ($http, $scope) {

  this.favoriteToggle = function(restaurant, dish) {
    dish.favorited = !dish.favorited;
    var counter;
    var f;
    if (counter !== undefined) {
      clearTimeout(counter);
    }
    counter = setTimeout(function() {
      if (dish.favorited) {
        f = 1;
      } else {
        f = 0;
      }
      var data = {
        dishId : dish._id,
        liked  : f,
        userId : $scope.user._id
      };
      $http.post('/updatefavorite', data).success(function(data) {
        console.log(data);
      });
    }, 50);  
  }
  
  if ($scope.currPage === "restaurant" && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      self.long = Math.floor(position.coords.longitude);
      self.lat = Math.floor(position.coords.latitude);
      var geoUrl = '/getrestaurant/' + self.long + '/' + self.lat;
      $http.get(geoUrl).success(function(data) {
        $scope.restaurant = data;
      });
    });
  }
};    

angular.module('top5').controller('RestaurantController', RestaurantController);
