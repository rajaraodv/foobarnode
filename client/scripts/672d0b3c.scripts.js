function HeaderCtrl(a,b,c){c.appUser=b.get(),a.$watch("appUser",function(){a.loginText=a.appUser.username?"Logged in as "+a.appUser.username:"Log In",c.loggedIn=a.appUser.username?!0:!1},!0)}function MainCtrl(a,b,c,d){a.photoPosts=c.query(),a.container=$("#photoContainer"),a.container.imagesLoaded(function(){a.container.masonry({itemSelector:".photo"})}),a.toggleLikeBtnName=function(b){return $.inArray(a.appUser._id,b.liked_by)>=0?"Unlike":"Like"},a.toggleLikeBtnIcon=function(b){return $.inArray(a.appUser._id,b.liked_by)>=0?"icon-thumbs-down":"icon-thumbs-up"},a.pluralizeLikes={0:"",one:"{} like",other:"{} likes"},a.pluralizeComments={0:"",one:"{} comment",other:"{} comments"},a.toggleLike=function(b){if(!a.loggedIn)return;var c,e=$.inArray(a.appUser._id,b.liked_by)>=0;e?c={method:"DELETE",url:"/likes/photoposts/"+b._id,data:null,headers:{"X-foobar-username":a.appUser.username,"X-foobar-access-token":a.appUser.access_token}}:c={method:"POST",url:"/likes",data:{post_id:b._id},headers:{"Content-Type":"application/json","X-foobar-username":a.appUser.username,"X-foobar-access-token":a.appUser.access_token}};var f=d(c);f.success(function(){e?(b.likes_cnt=b.likes_cnt-1,b.liked_by.splice($.inArray(a.appUser._id,b.liked_by),1)):(b.likes_cnt=b.likes_cnt+1,b.liked_by.push(a.appUser._id))}),f.error(function(a){alert(a.Error)})},a.deleteComment=function(b,c){if(!a.loggedIn||c.creator._id!==a.appUser._id)return;var e={method:"DELETE",url:"/comments/"+c._id,data:null,headers:{"X-foobar-username":a.appUser.username,"X-foobar-access-token":a.appUser.access_token}},f=d(e);f.success(function(){var a=-1;for(var d in b.comments){if(!b.comments.hasOwnProperty(d))continue;a++;if(b.comments[d]._id===c._id)break}b.comments.splice(a,1),b.comments_cnt=b.comments_cnt-1}),f.error(function(a){alert(a.Error)})},a.addComment=function(b){if(!a.loggedIn||!b.newComment||b.newComment==="")return;var c={method:"POST",url:"/comments",data:{post_id:b._id,text:b.newComment},headers:{"Content-Type":"application/json","X-foobar-username":a.appUser.username,"X-foobar-access-token":a.appUser.access_token}},e=d(c);e.success(function(a){b.newComment="",b.comments_cnt=b.comments_cnt+1,b.comments.push(a)}),e.error(function(a){alert(a.Error)})},a.showCommentField=function(){if(!a.loggedIn)return;a.cf=!0}}function ShareCtrl(a){console.log(1),a.gclick=function(){var a=window.open("https://plusone.google.com/_/+1/confirm?hl=en-US&url=http://foobarbar.cloudfoundry.com/","popupwindow","scrollbars=yes,width=800,height=400");return a.focus(),!1},a.fbsClick=function(){var a=location.href,b=document.title;return window.open("http://www.facebook.com/sharer.php?u="+encodeURIComponent(a)+"&t="+encodeURIComponent(b),"sharer","toolbar=0,status=0,width=626,height=436"),!1},a.twtClick=function(){var a=window.open("https://twitter.com/intent/tweet?text=Check out the Foo Bar from Cloud Foundry http://foobarbar.cloudfoundry.com","name","height=435,width=600");return window.focus&&a.focus(),!1}}function EditCtrl(a,b,c,d){var e=this;d.get({id:c.projectId},function(b){e.original=b,a.project=new d(e.original)}),a.isClean=function(){return angular.equals(e.original,a.project)},a.destroy=function(){e.original.destroy(function(){b.path("/list")})},a.save=function(){a.project.update(function(){b.path("/")})}}function GalleryCtrl(a,b,c){a.save=function(){c.save(a.project,function(a){b.path("/edit/"+a._id.$oid)})}}"use strict";var clientAppModule=angular.module("clientApp",["mongolab"]);clientAppModule.config(["$routeProvider",function(a){a.when("/",{controller:MainCtrl,templateUrl:"views/main.html"}).when("/edit/:projectId",{controller:EditCtrl,templateUrl:"views/detail.html"}).when("/gallery",{controller:GalleryCtrl,templateUrl:"views/gallery.html"}).otherwise({redirectTo:"/"})}]),clientAppModule.directive("showonhoverparent",function(){return{link:function(a,b){b.parent().bind("mouseenter",function(){b.show()}),b.parent().bind("mouseleave",function(){b.hide()})}}}),clientAppModule.directive("toggleDeleteComment",function(){return{link:function(a,b){b.bind("mouseenter",function(){if(a.comment.creator._id!==a.appUser._id)return;b.find(".deleteComment").show()}),b.bind("mouseleave",function(){b.find(".deleteComment").hide()})}}}),clientAppModule.directive("togglecommentfield",function(){return{link:function(a,b){b.bind("click",function(){var c=b.parent().find(".commentWrap");c.toggle(),c.find(".c11").focus(),a.container.masonry("reload")})}}}),clientAppModule.directive("addTwtrWidget",function(){return{link:function(a,b){a.loadTwitWidget=new window.TWTR.Widget({id:"twitter_widget_div",version:2,type:"search",search:"node.js",interval:2e4,title:"",subject:"",width:150,height:700,theme:{shell:{background:"#ffffff",color:"#eeeeee"},tweets:{background:"#ffffff",color:"#444444",links:"#0a96c5"}},features:{scrollbar:!1,loop:!0,live:!0,hashtags:!0,timestamp:!0,avatars:!0,toptweets:!0,behavior:"default"}}),a.loadTwitWidget.render().start(),b.bind("destroy",function(){a.loadTwitWidget.stop()})}}}),clientAppModule.factory("PhotoPostService",["$resource","$rootScope",function(a,b){var c=a("/feeds/1/10",null,{query:{method:"GET",isArray:!0,headers:{"X-foobar-username":b.appUser.username,"X-foobar-access-token":b.appUser.access_token}}});return c}]),clientAppModule.factory("LikesService",["$resource",function(a){var b=a("scripts/mocks/like.json");return b}]),clientAppModule.factory("LoginService",["$resource",function(a){var b=a("/session/user");return b}]),clientAppModule.directive("addMasonry",["$timeout",function(a){return{restrict:"A",link:function(b){a(function(){b.container.imagesLoaded(function(){b.container.masonry("reload")})},0)}}}]),clientAppModule.directive("loginRequired",["$anchorScroll",function(a){var b={link:function(b,c){function d(){if(b.loggedIn)return;a();var c=angular.element("#loginRequiredDialog");c.modal("show")}c.bind("click",d)}};return b}]),"use strict",HeaderCtrl.$inject=["$scope","LoginService","$rootScope"],"use strict",MainCtrl.$inject=["$scope","Project","PhotoPostService","$http"],"use strict",ShareCtrl.$inject=["$scope"],"use strict",EditCtrl.$inject=["$scope","$location","$routeParams","Project"],"use strict",GalleryCtrl.$inject=["$scope","$location","Project"],angular.module("mongolab",["ngResource"]).factory("Project",["$resource",function(a){var b=a("https://api.mongolab.com/api/1/databases/angularjs/collections/projects/:id",{apiKey:"4f847ad3e4b08a2eed5f3b54"},{update:{method:"PUT"}});return b.prototype.update=function(a){return b.update({id:this._id.$oid},angular.extend({},this,{_id:undefined}),a)},b.prototype.destroy=function(a){return b.remove({id:this._id.$oid},a)},b}]);