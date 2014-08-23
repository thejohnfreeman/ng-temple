'use strict';
/*global $:false */
// jshint asi:true

angular.module('ngTemple', [])
// Like `find`, but includes the root elements if they match.
.constant('findAll', function findAll(elts, selector) {
  return elts.find(selector).andSelf().filter(selector)
})
.factory('ngTemple', function($http, $templateCache, $compile, findAll) {
  return function(templateUrl) {
    var pTemplateElt = $http.get(templateUrl, {cache: $templateCache})
    .then(function(response) {
      return $($.parseHTML(response.data))
    })

    // Use as compile function for directives.
    return function(placeholder, attrs) {
      var pegs = placeholder.children()
      pegs.detach()

      var pTemplateFn = pTemplateElt
      .then(function(templateElt) {
        templateElt = templateElt.clone()
        var holes = findAll(templateElt, '[ng-hole]')
        holes.each(function(i, hole) {
          hole = $(hole)
          var name = hole.attr('ng-hole')
          var peg = findAll(pegs, '[ng-peg=' + name + ']')
          /* Would like to use strings instead of elements because
           * substition contents may not be valid HTML when out of
           * context. */
          hole.html(peg.html())
        })
        return $compile(templateElt)
      })

      return function(scope, elt, attrs, ctrl, transclude) {
        pTemplateFn.then(function(templateFn) {
          var instance = templateFn(scope)
          elt.replaceWith(instance)
        })
      }
    }
  }
})


