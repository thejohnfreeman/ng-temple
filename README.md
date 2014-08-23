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

Consider a case where we want to write a reusable directive for a panel with a
heading.  We might start with a template like this:

```html
<div>
  <h1>
    ????
  </h1>
  <p>
    ????
  </p>
</div>
```

The question marks represent two blocks, the heading and body, that need to be
replaced *separately* with transclusion: a feature unsupported by the existing
directive infrastructure.

Some directives take an alternative approach, dividing the responsibility among
multiple directives. For example the [accordion][] in [AngularUI Bootstrap][]
uses a clever trick for the [accordion-heading][] directive: it has an empty
template and passes its transcluded content to an injected parent controller
that inserts it at the right place in the page. This approach divides your
directive into more pieces than is usually desirable, and it's not a convenient
technique to implement.

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
<!-- example-panel.html -->
<div>
  <h1 ng-hole="heading">
  </h1>
  <p ng-hole="body">
  </p>
</div>
```

In your directive definition, let the `ngTemple` service handle compilation.

```js
angular.module('example', ['ngTemple'])
.directive('examplePanel', function(ngTemple) {
  return {
    restrict: 'E',
    compile: ngTemple('example-panel.html'),
  }
})
```

To use the directive, put replacement blocks, called **pegs**, in the
transcluded content. Use the `ng-peg` attribute with a value matching the name
of the corresponding hole.

```html
<example-panel>
  <div ng-peg="heading">
    Heading
  </div>
  <div ng-peg="body">
    The body.
  </div>
</example-panel>
```

Your directive's template will *replace* the calling element, and the contents
of each peg will *replace* the contents of each hole. The result of our example
here looks like this ([on Plunker](http://plnkr.co/edit/84QjyIDI08jDgkmIhkZg)):

```html
<div>
  <h1 ng-hole="heading">
    Heading
  </h1>
  <p ng-hole="body">
    The body.
  </p>
</div>
```

### Note on element restrictions

We must keep in mind that the browser parses our directive elements as HTML
before Angular even gets a peek. Consequently, invalid HTML in our transcluded
content will produce unexpected results.

Consider a directive template that defines a hole inside a table row:

```html
<!-- example-table.html -->
<table class="table">
  <tr ng-repeat="$item in ctrl.items" ng-hole="row">
  </tr>
</table>
```

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

One intuitive approach will not work
([on Plunker](http://plnkr.co/edit/pQignhGlb55XcvSyDRaB)):

```html
<!-- index.html -->
<example-table>
  <div ng-peg="row">
    <td>Item</td>
    <td>#{{ $item }}</td>
  </div>
</example-table>
```

If you inspect the page, you'll see that the `td` tags were stripped from the
transclusion, similar to what would be produced by this:

```html
<table class="table">
  <tr ng-repeat="$item in ctrl.items" ng-hole="row">
    Item
    #{{ $item }}
  </tr>
</table>
```

What happened? `td` elements are [only permitted][td-usage] to be children of
`tr` elements, which are [only permitted][tr-usage] to be children of `table`,
`thead`, `tbody`, or `tfoot` elements. When the browser encounters them outside
of their permitted context, it may choose to ignore them.

[td-usage]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#Usage_context
[tr-usage]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr#Usage_context

The fix is to use valid HTML in our transcluded content. Judicious use of the
`ng-peg` attribute lets us exclude extra elements from the final result
([on Plunker](http://plnkr.co/edit/sID8gR9HqSrBaPGnEY4E)):

```html
<!-- index.html -->
<example-table>
  <table>
    <tr ng-peg="row">
      <td>Item</td>
      <td>#{{ $item }}</td>
    </tr>
  </table>
</example-table>
```

### Default peg

Pegs are optional, and any content defined within a hole will serve as a default
peg. Modifying our earlier example...

```html
<!-- example-panel.html -->
<div>
  <h1 ng-hole="heading">
    Default Heading
  </h1>
  <p ng-hole="body">
    A default body.
  </p>
</div>
```

```html
<!-- index.html -->
<example-panel>
  <div ng-peg="body">
    The body.
  </div>
</example-panel>
```

... will produce this result
([on Plunker](http://plnkr.co/edit/oRxkNE1K2IREe46Ew3gx)):

```html
<div>
  <h1 ng-hole="heading">
    Default Heading
  </h1>
  <p ng-hole="body">
    The body.
  </p>
</div>
```

