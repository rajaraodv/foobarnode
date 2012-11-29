'use strict';

function ShareCtrl($scope) {
  console.log(1);

  //G+
  $scope.gclick = function() {
    var popUp = window.open('https://plusone.google.com/_/+1/confirm?hl=en-US&url=http://foobarnode.cloudfoundry.com/', 'popupwindow', 'scrollbars=yes,width=800,height=400');
    popUp.focus();
    return false;
  };

  //FB sharing
  $scope.fbsClick = function() {
    var u = location.href;
    var t = document.title;
    window.open('http://www.facebook.com/sharer.php?u=' + encodeURIComponent(u) + '&t=' + encodeURIComponent(t), 'sharer', 'toolbar=0,status=0,width=626,height=436');
    return false;
  };
  //Popup Tweet window
  $scope.twtClick = function() {
    var newwindow = window.open('https://twitter.com/intent/tweet?text=Check out the Foo Bar from Cloud Foundry http://foobarnode.cloudfoundry.com', 'name', 'height=435,width=600');
    if(window.focus) {
      newwindow.focus();
    }
    return false;
  };

}

ShareCtrl.$inject = ['$scope'];
