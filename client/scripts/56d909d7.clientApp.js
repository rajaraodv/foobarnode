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

//An example of creating mocks in Angularjs
// clientAppModule.config(['$provide', function($provide) {
//   $provide.decorator('$httpBackend', angular.mock.e2e.$httpBackendDecorator);
// }]);
// clientAppModule.run(['$httpBackend', function($httpBackend){
//   $httpBackend.whenGET('scripts/mocks/photoPosts.json').passThrough();
//   $httpBackend.whenGET('/session/user').respond(200, {'username': 'raja', '_id':'userId12345'}, {header: 'one'});
//   $httpBackend.whenGET('views/main.html').passThrough();
//   $httpBackend.whenPOST('/likes').respond(200, {'_id': 'likeid'});
// }]);

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
clientAppModule.directive('toggleDeleteComment', function() {
  return {
    link: function(scope, element) {
      element.bind('mouseenter', function() {
        //if the comment's creator is NOT the same as current user, don't show delete-comment button
        if(scope.comment.creator._id !== scope.appUser._id) {
          return;
        }
        element.find('.deleteComment').show();
      });
      element.bind('mouseleave', function() {
        element.find('.deleteComment').hide();
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

clientAppModule.factory('PhotoPostService', ['$resource', '$rootScope', function($resource, $rootScope) {
  var PhotoPostService = $resource('/feeds/1/10', null, {
    'query': {
      'method': 'GET',
      'isArray':true,
      'headers': {
        'X-foobar-username': $rootScope.appUser.username,
        'X-foobar-access-token': $rootScope.appUser.access_token
      }
    }
  });
  return PhotoPostService;
}]);

clientAppModule.factory('LikesService', ['$resource', function($resource) {
  var LikesService = $resource('scripts/mocks/like.json');
  return LikesService;
}]);

clientAppModule.factory('LoginService', ['$resource', function($resource) {
  var LoginService = $resource('/session/user');
  return LoginService;
}]);

clientAppModule.directive('addMasonry', ['$timeout', function($timeout) {
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
}]);

clientAppModule.directive('loginRequired', ['$anchorScroll', function($anchorScroll) {
  var loginRequired = {
    link: function(scope, element) {
      function loginRequired() {
        if(scope.loggedIn) {
          return;
        }
        //scroll to the top of the page
        $anchorScroll();
        //display dialog
        var element = angular.element('#loginRequiredDialog');
        element.modal('show');
      }
      //bind to click event
      //Warning: This only shows dialog & doesn't prevent the action w/in ng-click (if you have that on the element).
      //You need to also verify for loggedIn in ng-click or any other directives that might be triggered when the element was clicked
      element.bind('click', loginRequired);
    }
  };
  return loginRequired;
}]);