var app=window.angular.module("WebApp",["ng","ngResource"]);app&&console.log("ng:app");

window.app.controller("HomeCtrl",["$scope","$rootScope","$http",function(r,e,o){r.view="login",r.enableView=function(e){r.view=e},r.isEnabledView=function(e){return window.angular.equals(r.view,e)},r.doRegister=function(){o.post("/api/register/"+r.register.email).success(function(e){"InternalError"!==e.code&&(r.view="login",r.alert="Email registered. Check your email inbox.",r.error="")}).error(function(e){r.alert="",r.error=e.error?e.error:e})},r.login=function(){o.post("/api/login",r.user).success(function(e){"InternalError"!==e.code&&(r.error=!1,window.localStorage.setItem("token",e.token),window.location="/users")}).error(function(e){r.error=e.error?e.error:e})}}]);
window.app.controller("ListCtrl",["$scope","$rootScope","$http",function(e,o,r){e.model=!1,e.search="",e.feed=[],e.resources=[];var n="?token="+window.localStorage.getItem("token"),t=function(o,t){return o?(e.model=o,void r.get("/api/"+o+n).success(function(o){"InternalError"!==o.code&&(e.feed=o,t&&t())}).error(function(o,r){return 401===r?(window.location="/",!1):void(e.error=o.error?o.error:o)})):!1},a=function(o){for(var r in e.feed)if(e.feed[r]._id===o){e.edit=e.feed[r];break}if(!e.edit){var n="/"+e.model+"/new";window.location.pathname!==n&&(window.location.pathname=n)}};e.update=function(){r.put("/api/"+e.model+"/"+e.id+n,e.edit).success(function(){e.alert="Message: "+e.model+" updated"}).error(function(o){e.error=o.error?o.error:o})},e.create=function(o){r.post("/api/"+e.model+n,o).success(function(o){e.alert="Message: "+e.model+" created",t(e.model,function(){window.location.pathname="/"+e.model+"/"+o[0]._id})}).error(function(o){e.error=o.error?o.error:o})},e["delete"]=function(){r["delete"]("/api/"+e.model+"/"+e.id+n).success(function(){e.alert="Message: "+e.model+" deleted";var o="/"+e.model+"/new";window.location.pathname=o}).error(function(o){e.error=o.error?o.error:o})};var c=function(){var o="";for(var r in e.resources)e.resources.hasOwnProperty(r)&&(o=o+"/"+e.resources[r]+"/",e.resources.length-1!=r&&(o+="|"));var n=window.location.pathname.match(new RegExp("(W|^)("+o+")(W|$)"));return n?n[0]:!1};e.setHashId=function(o){window.location.pathname="/"+e.model+"/"+o._id},o.$on("load:resources",function(r,n){e.resources=n;var a=c();a&&(a=c(),t(a),o.$emit("load:param",a)),console.log("load:resources")}),o.$on("change:model",function(e,o){window.location.pathname="/"+o+"/new",console.log("change:model")}),o.$on("watch:search",function(o,r){e.search=r,console.log("watch:search")}),e.$watch("model",function(o){t(o,function(){a(e.id)}),console.log("watch:model")})}]);
window.app.controller("NavBarCtrl",["$scope","$rootScope","$http",function(e,o,t){e.search="",e.themes=[],e.resources=[];var r=function(){var e="//maxcdn.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css",o=window.localStorage.getItem("theme");return null===o?e:o};e.setTheme=function(o){e.theme=o.css,window.localStorage.setItem("theme",o.css)},e.delTheme=function(){e.theme=!1,window.localStorage.removeItem("theme")},e.setResource=function(e){o.$emit("change:model",e)},o.$on("load:param",function(o,t){e.model=t,console.log("load:param")}),e.$watch("search",function(e){o.$emit("watch:search",e)}),e.theme=r(),t.get("/api/properties").success(function(t){"InternalError"!==t.code&&(e.resources=t.resources,e.themes=t.themes,o.$emit("load:resources",t.resources||[]))}).error(function(e){console.log(e)})}]);