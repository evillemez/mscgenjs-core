var parser = require("../../parse/xuparser_node");
var tst    = require("../testutensils");
var fix    = require("../astfixtures.json");
var fs     = require("fs");
var path   = require("path");
var expect = require("chai").expect;

describe('parse/xuparser', function() {
    describe('#parse()', function() {

        it('should render a simple AST', function() {
            var lAST = parser.parse('msc { a,"b space"; a => "b space" [label="a simple script"];}');
            expect(lAST).to.be.deep.equal(fix.astSimple);
        });
        it('should render a simple AST - regardless of start marker case', function() {
            var lAST = parser.parse('MsC { a,"b space"; a => "b space" [label="a simple script"];}');
            expect(lAST).to.be.deep.equal(fix.astSimple);
        });
        it('should render a simple AST - also with xu as start marker', function() {
            var lAST = parser.parse('xu { a,"b space"; a => "b space" [label="a simple script"];}');
            expect(lAST).to.be.deep.equal(fix.astSimple);
        });
        it('should ignore c++ style one line comments', function() {
            var lAST = parser.parse('msc { a,"b space"; a => "b space" [label="a simple script"];}//ignored');
            expect(lAST).to.deep.equal(fix.astSimple);
        });
        it("should produce an (almost empty) AST for empty input", function() {
            var lAST = parser.parse("msc{}");
            expect(lAST).to.deep.equal(fix.astEmpty);
        });
        it("should produce an AST even when non entity arcs are its only content", function() {
            var lAST = parser.parse('msc{--- [label="start"]; ... [label="no entities ..."]; ---[label="end"];}');
            expect(lAST).to.deep.equal(fix.astNoEntities);
        });
        it("should produce lowercase for upper/ mixed case arc kinds", function() {
            var lAST = parser.parse('msc { a, b, c, d; a NoTE a, b BOX b, c aBox c, d rbOX d;}');
            expect(lAST).to.deep.equal(fix.astBoxArcs);
        });
        it("should produce lowercase for upper/ mixed case options", function() {
            var lAST = parser.parse('msc{HSCAle=1.2, widtH=800,  ARCGRADIENT="17",woRDwrAParcS="oN", WATERmark="not in mscgen, available in xù and msgenny" ;a;}');
            expect(lAST).to.deep.equal(fix.astOptions);
        });
        it("should correctly parse naked reals", function() {
            var lAST = parser.parse('xu{HSCAle=481.1337;a;}');
            expect(lAST.options.hscale).to.equal("481.1337");
        });
        it("should produce lowercase for upper/ mixed case attributes", function() {
            var lAST = parser.parse('msc{a [LaBEL="miXed", teXTBGcolOR="orange"]; a NOte a [LINEcolor="red", TEXTColoR="blue", ArcSkip="4"];}');
            expect(lAST).to.deep.equal(fix.astMixedAttributes);
        });
        it("should translate *colour to *color", function() {
            var lAST = parser.parse('msc { a [textcolOUr="green", textBGColour="cyan", linecolour="#ABCDEF"];}');
            expect(lAST).to.deep.equal(fix.astColourColor);
        });
        it("should parse all possible attributes", function(){
            var lAST = parser.parse('msc {\n\
  a [label="Label for A", idurl="http://localhost/idurl", id="Just and id", url="http://localhost/url", linecolor="#ABCDEF", textcolor="green", textbgcolor="cyan", arclinecolor="violet", arctextcolor="pink", arctextbgcolor="brown"];\n\
\n\
  a <<=>> a [label="Label for a <<=>> a", idurl="http://localhost/idurl", id="Just and id", url="http://localhost/url", linecolor="#ABCDEF", textcolor="green", textbgcolor="cyan"];\n\
}');
            expect(lAST).to.deep.equal(fix.astAllAttributes);
        });
        it("should generate arcs to all other arcs with both bare and quoted *", function(){
            expect(
                parser.parse('msc {arcgradient="18"; "ω","ɑ","β","ɣ"; "ɑ" -> * [label="ɑ -> *"]; * <- "β" [label="* <- β"]; "ɣ" <-> * [label="ɣ <-> *"];}')
            ).to.deep.equal(fix.astAsteriskBoth);
            expect(
                parser.parse('msc {arcgradient="18"; "ω","ɑ","β","ɣ"; "ɑ" -> "*" [label="ɑ -> *"]; "*" <- "β" [label="* <- β"]; "ɣ" <-> "*" [label="ɣ <-> *"];}')
            ).to.deep.equal(fix.astAsteriskBoth);
        });
        it("should produce only 'true' or 'false' for all variants of wordwraparcs", function() {
            expect(parser.parse('msc { wordwraparcs=true;}')).to.deep.equal(fix.astWorwraparcstrue);
            expect(parser.parse('msc { wordwraparcs="true";}')).to.deep.equal(fix.astWorwraparcstrue);
            expect(parser.parse('msc { wordwraparcs=on;}')).to.deep.equal(fix.astWorwraparcstrue);
            expect(parser.parse('msc { wordwraparcs="on";}')).to.deep.equal(fix.astWorwraparcstrue);
            expect(parser.parse('msc { wordwraparcs=1;}')).to.deep.equal(fix.astWorwraparcstrue);
            expect(parser.parse('msc { wordwraparcs="1";}')).to.deep.equal(fix.astWorwraparcstrue);
            expect(parser.parse('msc { wordwraparcs=false;}')).to.deep.equal(fix.astWorwraparcsfalse);
            expect(parser.parse('msc { wordwraparcs="false";}')).to.deep.equal(fix.astWorwraparcsfalse);
            expect(parser.parse('msc { wordwraparcs=off;}')).to.deep.equal(fix.astWorwraparcsfalse);
            expect(parser.parse('msc { wordwraparcs="off";}')).to.deep.equal(fix.astWorwraparcsfalse);
            expect(parser.parse('msc { wordwraparcs=0;}')).to.deep.equal(fix.astWorwraparcsfalse);
            expect(parser.parse('msc { wordwraparcs="0";}')).to.deep.equal(fix.astWorwraparcsfalse);
        });
        it("should throw a SyntaxError on an invalid program", function() {
            tst.assertSyntaxError('a', parser);
        });
        it("unicode is cool. But not yet for unquoted entity names", function() {
            tst.assertSyntaxError('msc{序;}', parser);
        });
        it("unicode is cool for quoted entity names", function() {
            var lFixture = {
                "meta": {
                    "extendedOptions": false,
                    "extendedArcTypes": false,
                    "extendedFeatures": false
                },
                "entities": [
                {
                    "name": "序"
                }
              ]
            };
            expect(parser.parse('msc{"序";}')).to.deep.equal(lFixture);
        });
        it("should throw a SyntaxError on an invalid program", function() {
            tst.assertSyntaxError('msc{a}', parser);
        });
        it("should throw a SyntaxError on asterisks on both sides for uni-directional arrows", function(){
            tst.assertSyntaxError('msc{a,b,c; * -> *;}', parser);
            tst.assertSyntaxError('msc{a,b,c; * <- *;}', parser);
        });
        it("should throw a SyntaxError on asterisks on both sides for bi-directional arrows", function(){
            tst.assertSyntaxError('msc{a,b,c; * <-> *;}', parser);
        });
        it("should throw a SyntaxError for asterisks on LHS on bi-directional arrows", function(){
            tst.assertSyntaxError('msc{a,b,c; * <-> a;}', parser);
        });
        it("should throw a SyntaxError on a program with only the start token", function() {
            tst.assertSyntaxError('msc', parser);
        });
        it("should throw a SyntaxError on a program with shizzle after the closing statement", function() {
            tst.assertSyntaxError('msc{a;} shizzle after the closing statement', parser);
        });
        it("should throw a SyntaxError on an invalid arc type", function() {
            tst.assertSyntaxError('msc{a, b; a xx b;}', parser);
        });
        it("should accept empty inline expressions", function() {
            var lFixture = {
                "meta": {
                    "extendedOptions": false,
                    "extendedArcTypes": true,
                    "extendedFeatures": true
                },
                "entities": [
                {
                    "name": "a"
                },
                {
                    "name": "b"
                }
              ],
                "arcs": [
                  [
                  {
                      "kind": "opt",
                      "from": "a",
                      "to": "b",
                      "arcs": null
                  }
                ]
              ]
            };
            expect(parser.parse('Xu{a, b; a opt b{};}')).to.deep.equal(lFixture);
        });
        it("should throw a SyntaxError on _that's not an inline expression_ arc type", function() {
            tst.assertSyntaxError('msc{a, b; a => b{|||;};}', parser);
        });
        it("should throw a SyntaxError on an invalid option", function() {
            tst.assertSyntaxError('msc{wordwarparcs="true"; a, b; a -> b;}', parser);
        });
        it("should throw a SyntaxError on an invalid value for an option", function() {
            tst.assertSyntaxError('msc{wordwraparcs=\u0181; a, b; a -> b;}', parser);
        });
        it("should throw a SyntaxError on a missing semi colon after the options list", function() {
            tst.assertSyntaxError('msc{wordwraparcs="true" a, b; a -> b;}', parser);
        });
        it("should throw a SyntaxError on a missing semi colon", function() {
            tst.assertSyntaxError('msc{wordwraparcs="true"; a, b; a -> b}', parser);
        });
        it("should throw a SyntaxError for a * on the RHS of x-", function() {
            tst.assertSyntaxError('msc{a,b,c; b x- *;}', parser);
        });
        it("should throw a SyntaxError for a * on the LHS of -x", function() {
            tst.assertSyntaxError('msc{a,b,c; * -x b;}', parser);
        });
        it("should throw a SyntaxError on a missing program closer", function() {
            tst.assertSyntaxError('msc{wordwraparcs="true"; a, b; a -> b;', parser);
        });
        it("should throw a SyntaxError on a invalid entity attribute", function() {
            tst.assertSyntaxError('msc{a[invalidentitityattribute="invalid"];}', parser);
        });
        it("should throw a SyntaxError on a missing closing bracket on an entity", function() {
            tst.assertSyntaxError('msc{a[label="missing closing bracket";}', parser);
        });
        it("should throw a SyntaxError on a invalid arc attribute", function() {
            tst.assertSyntaxError('msc{a, b; a -> b[invalidearcattribute="invalid"];}', parser);
        });
        it("should throw a SyntaxError on a missing closing bracket", function() {
            tst.assertSyntaxError('msc{a, b; a -> b[label="missing closing bracket";}', parser);
        });
        it ("should complain about an undeclared entity in a from", function(){
            tst.assertSyntaxError("msc{a,b,c;d=>a;}", parser, "EntityNotDefinedError");
        });
        it ("should complain about an undeclared entity in a to", function(){
            tst.assertSyntaxError("msc{a,b,c;b=>f;}", parser, "EntityNotDefinedError");
        });
    });

    describe('#parse() - file based tests', function(){
        it("should parse all possible arcs", function() {
            var lTextFromFile = fs.readFileSync(path.join(__dirname, '../fixtures/test01_all_possible_arcs.xu'), {"encoding":"utf8"});
            var lAST = parser.parse(lTextFromFile.toString());
            tst.assertequalToFileJSON(path.join(__dirname, '../fixtures/test01_all_possible_arcs.json'), lAST);
        });
        it("should parse stuff with colors", function() {
            var lTextFromFile = fs.readFileSync(path.join(__dirname, '../fixtures/rainbow.mscin'), {"encoding":"utf8"});
            var lAST = parser.parse(lTextFromFile.toString());
            tst.assertequalToFileJSON(path.join(__dirname, '../fixtures/rainbow.json'), lAST);
        });
        it("strings, ids and urls", function() {
            var lTextFromFile = fs.readFileSync(path.join(__dirname, '../fixtures/test10_stringsandurls.mscin'), {"encoding":"utf8"});
            var lAST = parser.parse(lTextFromFile.toString());
            tst.assertequalToFileJSON(path.join(__dirname, '../fixtures/test10_stringsandurls.json'), lAST);
        });
    });

    describe('#parse() - xu specific extensions', function() {
        it('should render an AST, with an alt in it', function() {
            var lAST = parser.parse('msc { a,b,c; a => b; b alt c { b => c; c >> b; };}');
            expect(lAST).to.deep.equal(fix.astOneAlt);
        });

        it('should render an AST, with a loop and an alt in it', function() {
            var lAST = parser.parse('msc { a,b,c; a => b; a loop c [label="label for loop"] { b alt c [label="label for alt"]{ b -> c [label="-> within alt"]; c >> b [label=">> within alt"]; }; b >> a [label=">> within loop"];}; a =>> a [label="happy-the-peppy - outside"];...;}');
            expect(lAST).to.deep.equal(fix.astAltWithinLoop);
        });
        it('should accept "auto" as a valid width', function(){
            var lAST = parser.parse('xu{ arcgradient=20, width=AUTO; a,b,c,d,e,f; c =>> * [label="Hello everyone"];}');
            expect(lAST.options.width).to.equal("auto");
        });
        it("should throw a SyntaxError on a missing closing bracket", function() {
            tst.assertSyntaxError('msc {a,b; a loop b {', parser);
        });
        it("should throw a SyntaxError on a missing closing bracket", function() {
            tst.assertSyntaxError('msc {a,b; a loop b {a=>b;', parser);
        });
        it("should throw a SyntaxError on a missing closing bracket", function() {
            tst.assertSyntaxError('msc {a,b; a loop b {}', parser);
        });
        it("should throw a SyntaxError on a missing semi colon after a closing bracket", function() {
            tst.assertSyntaxError('msc {a,b; a loop b [', parser);
        });
        it("should throw a SyntaxError on a missing a value for an attribute", function() {
            tst.assertSyntaxError('msc {a,b; a loop b [label', parser);
        });
        it("should throw a SyntaxError on a missing a closing bracket after a valid option", function() {
            tst.assertSyntaxError('msc {a,b; a loop b [label="brackets missing"', parser);
        });
        it("should throw an EntityNotDefinedError on a missing entity somewhere deeply nested", function() {
            tst.assertSyntaxError('msc {a,b; a loop b {c => b;};}', parser, "EntityNotDefinedError");
        });
    });
});
