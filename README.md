# mscgen_js - core package
Implementation of [MscGen][mscgen] and two derived languages in JavaScript.

> This is the JavaScript _library_ that takes care of parsing and
> rendering MscGen. You might be looking for one of these in stead:
> - [**online interpreter** - mscgen_js][mscgenjs.interpreter]
> - [**atom package** - mscgen-preview][mscgen-preview]
> - [**command line interface** - mscgenjs-cli][mscgenjs.cli]
> - [how to **embed MscGen in html**][mscgenjs.embed].

## Features
- Parses and renders [MscGen][mscgen]
  - Accepts all valid [MscGen][mscgen] programs and render them correctly.
  - All valid MscGen programs accepted by mscgen_js are also accepted and
    rendered correctly by the original `mscgen` command.
  - If you find proof to the contrary: [tell us][mscgenjs.issues.compliance].
- Parses and renders [Xù][mscgenjs.doc.xu]    
  Xù is a strict superset of MscGen. It adds things like `alt` and
  `loop`.
- Parses and renders [MsGenny][mscgenjs.doc.msgenny]    
  Same as Xù, but with a simpler syntax.
- Translates between these three languages
- Spits out svg, GraphViz dot, doxygen and JSON.
- runs in all modern browsers (and in _Node.js_).

## I'm still here. How can I use this?
### Prerequisites
mscgen_js works in anything with an implementation of the document object model
(DOM). This includes web-browsers, client-side application shells like electron
and even headless browsers like phantomjs. It does _not_ include nodejs
(although it is possible to get it sorta to work even there with
[jsdom](https://github.com/tmpvar/jsdom)).

### Get it
`npm install mscgenjs`

### Import it
You'll have to import the mscgenjs module somehow. There's a commonjs and a
requirejs variant, both of which are in the `mscgenjs`
[npm module](https://www.npmjs.com/package/mscgenjs)
(repo: [sverweij/mscgenjs-core](https://github.com/sverweij/mscgenjs-core)).

```javascript
// commonjs
var mscgenjs = require('mscgenjs');
```

```javascript
// commonjs, but with lazy loading. Useful when you're using it in
// e.g. an electron shell, or on the web without a minifier
var mscgenjs = require('mscgenjs/index-lazy');
```

```javascript
// requirejs
require(['your/path/to/mscgenjs/index'], function(mscgenjs){
    // your code here
});
```

### Use it

- use the root module directly => recommended    
  mscgenjs-cli and atom-mscgen-preview take that approach. See the samples below
- individually do calls to the parse and render steps => do this when you have
  very special needs. This is the approach the mscgen_js and mscgenjs-inpage script take. [link to where this happens in mscgen_js](https://github.com/sverweij/mscgen_js/blob/master/src/script/interpreter/uistate.js#L242) and one [where this happens in mscgenjs-inpage](https://github.com/sverweij/mscgenjs-inpage/blob/master/src/mscgen-inpage.js#L116) - I plan to migrate that last one to using the root module somewhere in the future because it's simpler and there's no specific reason to want

Here's some some samples for using the root module directly:
```Javascript
// renders the given script in the (already existing) element with id=yourCoolId
mscgenjs.renderMsc (
  'msc { a,b; a=>>b[label="render this"; }',
  {
    elementId: "yourCoolId"
  }
);
```

If you want to do error handling, or act on the created svg: provide a callback:
```javascript
mscgenjs.renderMsc (
  'msc { a,b; a=>>b[label="render this"; }',
  {
    elementId: "yourOtherCoolId"
  },
  handleRenderMscResult
);

function handleRenderMscResult(pError, pSuccess) {
  if (Boolean(pError)){
    console.log (pError);
  } else if (Boolean(pSuccess)){
    console.log ('That worked - cool!');
   // the svg is in the pSuccess argument
  }
  console.log('Wat! Error nor success?');
}
```

The second parameter in the `renderMsc` call takes some options that influence rendering e.g.
```javascript
mscgenjs.renderMsc (
  'a=>>b:render this;',
  {
    elementId: "yourThirdCoolId",
    inputType: "msgenny", // language to parse - default "mscgen"; other accepted languages: "xu", "msgenny" and "json"
    mirrorEntitiesOnBottom: true, // draws entities on both top and bottom of the chart - default false
    additionalTemplate: "lazy", // use a predefined template. E.g. "lazy" or "classic". Default empty
    includeSource: false, // whether the generated svg should include the source in a desc element
  },
```

### Some battle tested implementations

- the atom package [mscgen-preview][mscgen-preview.source] (CoffeeScript alert)
  - specifically the [renderer][mscgen-preview.source.render]
  - ... which is just 6 lines of code
- the [embedder][mscgenjs.embed.source] (Any modern browser. Using require.js)
- the [unit tests][mscgenjs.unit] from mscgenjs-core itself:
  - [parse][mscgenjs.unit.parse] (Node.js)
  - [render][mscgenjs.unit.render] (Node.js with jsdom)
- the [on line interpreter][mscgenjs.interpreter.source] (Any modern browser.
  Using require.js)
  - ~ [where parsing happens][mscgenjs.interpreter.source.parse]
  - ~ [where rendering happens][mscgenjs.interpreter.source.render]
- the [command line interface][mscgenjs.cli.source] (Node.js, PhantomJS and
  some spit)


### Building mscgen_js
See [build.md][mscgenjs.docbuild].

### How does mscgen_js work?
You can start reading about that [over here](doc/readme.md)

## License
This software is free software [licensed under GPLv3][mscgenjs.license].
This means (a.o.) you _can_ use it as part of other free software, but
_not_ as part of non free software.

### Dependencies and their licenses
We built mscgen_js on various libraries, each of which have their own
license (incidentally all MIT style):
- mscgen_js uses [requirejs][requirejs.license] and [amdefine][amdefine.license]
  for modularization.
- We generated its parsers with [pegjs][pegjs.license].
- mscgen_js automated tests use [mocha][21], [chai][39],
  [chai-xml][40] and [jsdom][jsdom.license].

It uses [istanbul][28], [eslint][22], [plato][23] and [nsp][35] to maintain some
modicum of verifiable code quality. You can see the build history in
[Travis][travis.mscgenjs] and an indication of the shape of the code at [Code
Climate][codeclimate.mscgenjs].

## Thanks
- [Mike McTernan][mscgen.author] for creating the wonderful
  MscGen language, the accompanying c implementation and for releasing both
  to the public domain (the last one under a [GPLv2][mscgen.license] license
  to be precise).
- [David Majda][pegjs.author] for cooking and maintaining the fantastic
  and lightning fast [PEG.js][pegjs] parser generator.
- [Elijah Insua][jsdom.author] for [jsdom][jsdom], which allows us to
  test rendering vector graphics in Node.js without having to resort
  to outlandish hacks.

## Build status
[![Build Status][travis.mscgenjs.badge]][travis.mscgenjs]
[![bitHound Overall Score][bithound.mscgenjs.badge]][bithound.mscgenjs]
[![Test Coverage](https://codeclimate.com/github/sverweij/mscgenjs-core/badges/coverage.svg)](https://codeclimate.com/github/sverweij/mscgenjs-core/coverage)
[![Dependency Status][david.mscgenjs.badge]][david.mscgenjs]
[![devDependency Status][daviddev.mscgenjs.badge]][daviddev.mscgenjs]
[![npm stable version](https://img.shields.io/npm/v/mscgenjs.svg)](https://npmjs.com/package/mscgenjs)
[![total downloads on npm](https://img.shields.io/npm/dt/mscgenjs.svg)](https://npmjs.com/package/mscgenjs)
[![GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE.md)

[amdefine.license]: doc/licenses/license.amdefine.md
[atom]: https://atom.io
[codeclimate.mscgenjs]: https://codeclimate.com/github/sverweij/mscgenjs-core
[codeclimate.mscgenjs.badge]: https://codeclimate.com/github/sverweij/mscgenjs-core/badges/gpa.svg
[bithound.mscgenjs]: https://www.bithound.io/github/sverweij/mscgenjs-core
[bithound.mscgenjs.badge]: https://www.bithound.io/github/sverweij/mscgenjs-core/badges/score.svg
[codecov.mscgenjs]: http://codecov.io/github/sverweij/mscgenjs-core?branch=master
[codecov.mscgenjs.badge]: http://codecov.io/github/sverweij/mscgenjs-core/coverage.svg?branch=master
[daviddev.mscgenjs]: https://david-dm.org/sverweij/mscgenjs-core#info=devDependencies
[daviddev.mscgenjs.badge]: https://david-dm.org/sverweij/mscgenjs-core/dev-status.svg
[david.mscgenjs]: https://david-dm.org/sverweij/mscgenjs-core
[david.mscgenjs.badge]: https://david-dm.org/sverweij/mscgenjs-core.svg
[jsdom]: https://github.com/tmpvar/jsdom
[jsdom.author]: http://tmpvar.com/
[jsdom.license]: doc/licenses/license.jsdom.md
[license.gpl-3.0]: http://www.gnu.org/licenses/gpl.html
[mscgen]: http://www.mcternan.me.uk/mscgen
[mscgen.author]: http://www.mcternan.me.uk/mscgen
[mscgen.license]: http://code.google.com/p/mscgen/source/browse/trunk/COPYING
[mscgen-preview]: https://atom.io/packages/mscgen-preview
[mscgen-preview.source]: https://github.com/sverweij/atom-mscgen-preview
[mscgen-preview.source.render]: https://github.com/sverweij/atom-mscgen-preview/blob/master/lib/renderer.coffee
[mscgenjs.cli]: https://www.npmjs.com/package/mscgenjs-cli
[mscgenjs.cli.source]: https://github.com/sverweij/mscgenjs-cli
[mscgenjs.docbuild]: doc/build.md
[mscgenjs.docsource]: doc/README.md
[mscgenjs.embed]: https://sverweij.github.io/mscgen_js/embed.html?utm_source=mscgenjs-core
[mscgenjs.embed.source]: https://github.com/sverweij/mscgenjs-inpage/blob/master/src/mscgen-inpage.js
[mscgenjs.embedpackage]: https://sverweij.github.io/mscgen_js/embed.html#package
[mscgenjs.interpreter]: https://sverweij.github.io/mscgen_js/index.html?utm_source=mscgenjs-core
[mscgenjs.interpreter.source]: https://github.com/sverweij/mscgen_js
[mscgenjs.interpreter.source.parse]: https://github.com/sverweij/mscgen_js/blob/master/src/script/interpreter/uistate.js#L117
[mscgenjs.interpreter.source.render]: https://github.com/sverweij/mscgen_js/blob/master/src/script/interpreter/uistate.js#L260
[mscgenjs.issues.compliance]: https://github.com/sverweij/mscgenjs-core/labels/compliance
[mscgenjs.unit]: https://github.com/sverweij/mscgenjs-core/tree/master/test
[mscgenjs.unit.parse]: https://github.com/sverweij/mscgenjs-core/blob/master/test/parse/t_mscgenparser_node.js
[mscgenjs.unit.render]: https://github.com/sverweij/mscgenjs-core/blob/master/test/render/graphics/t_renderast.js
[mscgenjs.license]: LICENSE.md
[mscgenjs.doc.msgenny]: doc/msgenny.md
[mscgenjs.doc.xu]: doc/xu.md
[pegjs]: http://pegjs.org
[pegjs.author]: http://majda.cz/about
[pegjs.license]: doc/licenses/license.pegjs.md
[phantomjs]: https://www.npmjs.com/package/phantomjs
[requirejs.license]: doc/licenses/license.requirejs.md
[travis.mscgenjs]: https://travis-ci.org/sverweij/mscgenjs-core
[travis.mscgenjs.badge]: https://travis-ci.org/sverweij/mscgenjs-core.svg?branch=master
[21]: doc/licenses/license.mocha.md
[22]: doc/licenses/license.eslint.md
[23]: doc/licenses/license.plato.md
[28]: doc/licenses/license.istanbul.md
[35]: https://nodesecurity.io/
[39]: https://github.com/chaijs/chai
[40]: https://github.com/krampstudio/chai-xml
