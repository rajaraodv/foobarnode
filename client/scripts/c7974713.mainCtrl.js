/*global $:false */
'use strict';


function MainCtrl($scope, Project, BackendService) {
  $scope.photoPosts = BackendService.query();
  /* Watch photocontainer and once it is populated, apply masonry*/
  $scope.container = $('#photoContainer');
  $scope.container.imagesLoaded(function() {
    $scope.container.masonry({
      itemSelector: '.photo'
    });
  });

  /* Pluralize Like and Comments */
  $scope.pluralizeLikes = {
    0: '',
    one: '{} like',
    other: '{} likes'
  };
  $scope.pluralizeComments = {
    0: '',
    one: '{} comment',
    other: '{} comments'
  };

  $scope.like = function(photoPost) {
    photoPost.likes_cnt = photoPost.likes_cnt + 1;
    photoPost.liked_by.push("50826c1595148ef179000039");
  };

  $scope.showCommentField = function() {
    $scope.cf = true;
  };
}

MainCtrl.$inject = ['$scope', 'Project', 'BackendService'];