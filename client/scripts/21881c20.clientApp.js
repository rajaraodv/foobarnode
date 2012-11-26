'use strict'; /*global  angular:false MainCtrl:false EditCtrl:false GalleryCtrl:false */

var clientAppModule = angular.module('clientApp', ['mongolab']);
clientAppModule.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
  when('/', {
    controller: MainCtrl,
    templateUrl: 'views/main.html'
  }).
  when('/edit/:projectId', {
    controller: EditCtrl,
    templateUrl: 'views/detail.html'
  }).
  when('/gallery', {
    controller: GalleryCtrl,
    templateUrl: 'views/gallery.html'
  }).
  otherwise({
    redirectTo: '/'
  });
}]);

clientAppModule.directive('showonhoverparent', function() {
  return {
    link: function(scope, element) {
      element.parent().bind('mouseenter', function() {
        element.show();
      });
      element.parent().bind('mouseleave', function() {
        element.hide();
      });
    }
  };
});

clientAppModule.directive('togglecommentfield', function() {
  return {
    link: function(scope, element) {
      element.bind('click', function() {
        var commentWrap = element.parent().find('.commentWrap');
        commentWrap.toggle();
        commentWrap.find('.c11').focus();
        /*
                When comment field is toggled, we should reload masonry coz card/item's height is now increased/decreased
              */
        scope.container.masonry('reload');
      });
    }
  };
});


clientAppModule.directive('addTwtrWidget', function() {
  return {
    link: function(scope, element) {
      scope.loadTwitWidget = new window.TWTR.Widget({
        id: 'twitter_widget_div',
        version: 2,
        type: 'search',
        search: 'node.js',
        interval: 20000,
        title: '',
        subject: '',
        width: 150,
        height: 700,
        theme: {
          shell: {
            background: '#ffffff',
            color: '#eeeeee'
          },
          tweets: {
            background: '#ffffff',
            color: '#444444',
            links: '#0a96c5'
          }
        },
        features: {
          scrollbar: false,
          loop: true,
          live: true,
          hashtags: true,
          timestamp: true,
          avatars: true,
          toptweets: true,
          behavior: 'default'
        }
      });
      scope.loadTwitWidget.render().start();

      element.bind('destroy', function() {
        scope.loadTwitWidget.stop();
      });
    }
  };
});

clientAppModule.factory('BackendService', ['$resource', function($resource) {
  var BackendService = $resource('scripts/posts.json');
  return BackendService;
}]);

clientAppModule.factory('LoginService', ['$resource', function($resource){
  var LoginService = $resource('/session/user');
  return LoginService;
}]);

clientAppModule.directive('addMasonry', function($timeout) {
  return {
    restrict: 'A',
    link: function(scope) {
      $timeout(function() {
        scope.container.imagesLoaded(function() {
          scope.container.masonry('reload');
        });
      }, 0);
    }
  };
});