# [ng-temple][]

[Template inheritance][inherit] for [Angular][] directives.

[ng-temple]: https://github.com/thejohnfreeman/ng-temple
[inherit]: https://docs.djangoproject.com/en/dev/topics/templates/#template-inheritance
[Angular]: https://angularjs.org/

## Quick Start

Skip to the [usage section](#usage).

## Motivation

Angular [directives][] provide a powerful feature for injecting custom content
into a "hole" reserved in a template: [transclusion][ng-transclude].
Fortunately, transclusion in Angular supports [parameterization][]: transcluded
content can use scope variables defined in the directive.
Unfortunately, Angular transclusion works only for a single, monolithic block.

[directives]: https://docs.angularjs.org/guide/directive
[ng-transclude]: https://docs.angularjs.org/api/ng/directive/ngTransclude
[parameterization]: http://en.wikipedia.org/wiki/Transclusion#Technical_considerations

Consider a case where we want to write a reusable directive for a table with a
title. We might start with a template like this:

```html
<table class="table">
  <caption>
    ????
  </caption>
  <tr ng-repeat="$item in ctrl.items">
    ????
  </tr>
</table>
```

The question marks represent two blocks, a caption and row content, that need to
be replaced *separately* with transclusion: a feature unsupported by the
existing directive infrastructure.

Some directives take an alternative approach, splitting into multiple
directives. For example the [accordion][] in [AngularUI Bootstrap][] uses a
clever trick for the [accordion-heading][] directive: it has an empty template
and passes its transcluded content to an injected parent controller that inserts
it at the right place in the page.

[accordion]: https://github.com/angular-ui/bootstrap/blob/master/src/accordion/accordion.js
[AngularUI Bootstrap]: http://angular-ui.github.io/bootstrap/
[accordion-heading]: https://github.com/angular-ui/bootstrap/blob/master/src/accordion/accordion.js#L96

ngTemple offers a solution to multiple transclustion that more closely mimics
the familiar pattern of [template inheritance in Django][inherit]. Named blocks
are defined in a parent template and optionally overridden in a child template.

## Usage

In your directive template, elements whose contents should be replaced with
transcluded content are called **holes**. Mark them with the `ng-hole`
attribute, whose value should be a name for the hole.

```html
<!-- example-table.html -->
<table class="table">
  <caption ng-hole="title">
  </caption>
  <tr ng-repeat="$item in ctrl.items" ng-hole="row">
  </tr>
</table>
```

In your directive definition, let the `ngTemple` service handle compilation.

```js
angular.module('example', ['ngTemple'])
.directive('exampleTable', function(ngTemple) {
  return {
    restrict: 'E',
    controller: function() {
      this.items = [1, 2, 3]
    },
    controllerAs: 'ctrl',
    compile: ngTemple('example-table.html'),
  }
})
```

To use the directive, put replacement blocks, called **pegs**, in the
transcluded content. Use the `ng-peg` attribute with a value matching the name
of the corresponding hole.

```html
<example-table>
  <div ng-peg="title">
    The Title
  </div>
  <div ng-peg="row">
    Item #{{ $item }}
  </div>
</example-table>
```

