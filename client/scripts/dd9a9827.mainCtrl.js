/*global $:false alert:false */
/*jshint camelcase:false */
'use strict';


function MainCtrl($scope, Project, PhotoPostService, $http) {
  $scope.photoPosts = PhotoPostService.query();

  $scope.container = $('#photoContainer');
  $scope.container.imagesLoaded(function() {
    $scope.container.masonry({
      itemSelector: '.photo'
    });
  });

  $scope.toggleLikeBtnName = function(photoPost) {
    return $.inArray($scope.appUser._id, photoPost.liked_by) >= 0 ? 'Unlike' : 'Like';
  };

  $scope.toggleLikeBtnIcon = function(photoPost) {
    return $.inArray($scope.appUser._id, photoPost.liked_by) >= 0 ? 'icon-thumbs-down' : 'icon-thumbs-up';
  };

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

  $scope.toggleLike = function(photoPost) {
    if(!$scope.loggedIn) {
      return;
    }

    var requestConfig;
    var alreadyLiked = $.inArray($scope.appUser._id, photoPost.liked_by) >= 0;
    if(alreadyLiked) {
      requestConfig = {
        'method': 'DELETE',
        'url': '/likes/photoposts/' + photoPost._id,
        'data': null,
        'headers': {
          'X-foobar-username': $scope.appUser.username,
          'X-foobar-access-token': $scope.appUser.access_token
        }
      };
    } else {
      requestConfig = {
        'method': 'POST',
        'url': '/likes',
        'data': {
          'post_id': photoPost._id
        },
        'headers': {
          'Content-Type': 'application/json',
          'X-foobar-username': $scope.appUser.username,
          'X-foobar-access-token': $scope.appUser.access_token
        }
      };
    }

    var response = $http(requestConfig);
    response.success(function() {
      if(alreadyLiked) {
        photoPost.likes_cnt = photoPost.likes_cnt - 1;
        photoPost.liked_by.splice($.inArray($scope.appUser._id, photoPost.liked_by), 1);
      } else {
        photoPost.likes_cnt = photoPost.likes_cnt + 1;
        photoPost.liked_by.push($scope.appUser._id);
      }
    });

    response.error(function(data) {
      //todo: make error better
      alert(data.Error);
    });
  };

  $scope.deleteComment = function(photoPost, comment) {
    //If not logged-in OR, if the creator of the comment is NOT currently logged-in, return.
    if(!$scope.loggedIn || comment.creator._id !== $scope.appUser._id) {
      return;
    }

    var requestConfig = {
      'method': 'DELETE',
      'url': '/comments/' + comment._id,
      'data': null,
      'headers': {
        'X-foobar-username': $scope.appUser.username,
        'X-foobar-access-token': $scope.appUser.access_token
      }
    };

    var response = $http(requestConfig);
    response.success(function() {
      var index = -1;
      for(var c in photoPost.comments) {
        if(!photoPost.comments.hasOwnProperty(c)) {
          continue;
        }
        index++;

        if(photoPost.comments[c]._id === comment._id) {
            break;
          }
      }

      photoPost.comments.splice(index, 1);
      photoPost.comments_cnt = photoPost.comments_cnt - 1;
    });

    response.error(function(data) {
      //todo: make error better
      alert(data.Error);
    });

  };

  $scope.addComment = function(photoPost) {
    //note: photoPost.newComment is a temporary property from comment text area
    if(!$scope.loggedIn || !photoPost.newComment || photoPost.newComment === '') {
      return;
    }

    var requestConfig = {
      'method': 'POST',
      'url': '/comments',
      'data': {
        'post_id': photoPost._id,
        'text': photoPost.newComment
      },
      'headers': {
        'Content-Type': 'application/json',
        'X-foobar-username': $scope.appUser.username,
        'X-foobar-access-token': $scope.appUser.access_token
      }
    };

    var response = $http(requestConfig);
    response.success(function(data) {
      photoPost.newComment = ''; //remove temporary newComment
      photoPost.comments_cnt = photoPost.comments_cnt + 1;
      photoPost.comments.push(data);
    });

    response.error(function(data) {
      //todo: make error better
      alert(data.Error);
    });
  };

  $scope.showCommentField = function() {
    if(!$scope.loggedIn) {
      return;
    }
    $scope.cf = true;
  };
}

MainCtrl.$inject = ['$scope', 'Project', 'PhotoPostService', '$http'];