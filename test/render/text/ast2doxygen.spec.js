/* eslint max-len:0 */
var assert   = require("assert");
var renderer = require("../../../render/text/ast2doxygen");
var fix      = require("../../astfixtures.json");

describe('render/text/ast2doxygen', function() {
    describe('#renderAST() - simple syntax tree', function() {
        it('should, given a simple syntax tree, render a mscgen script', function() {
            var lProgram = renderer.render(fix.astSimple);
            var lExpectedProgram =
                ' * \\msc\n *   a,\n *   "b space";\n * \n *   a => "b space" [label="a simple script"];\n * \\endmsc';
            assert.equal(lProgram, lExpectedProgram);
        });

        it("should preserve the comments at the start of the ast", function() {
            var lProgram = renderer.render(fix.astWithPreComment);
            var lExpectedProgram = " * \\msc\n *   a,\n *   b;\n * \n *   a -> b;\n * \\endmsc";
            assert.equal(lProgram, lExpectedProgram);
        });

        it("should preserve attributes", function() {
            var lProgram = renderer.render(fix.astAttributes);
            var lExpectedProgram =
` * \\msc
 *   Alice [linecolor="#008800", textcolor="black", textbgcolor="#CCFFCC", arclinecolor="#008800", arctextcolor="#008800"],
 *   Bob [linecolor="#FF0000", textcolor="black", textbgcolor="#FFCCCC", arclinecolor="#FF0000", arctextcolor="#FF0000"],
 *   pocket [linecolor="#0000FF", textcolor="black", textbgcolor="#CCCCFF", arclinecolor="#0000FF", arctextcolor="#0000FF"];
 * \n *   Alice => Bob [label="do something funny"];
 *   Bob => pocket [label="fetch (nose flute)", textcolor="yellow", textbgcolor="green", arcskip="0.5"];
 *   Bob >> Alice [label="PHEEE!", textcolor="green", textbgcolor="yellow", arcskip="0.3"];
 *   Alice => Alice [label="hihihi", linecolor="#654321"];
 * \\endmsc`;
            assert.equal(lProgram, lExpectedProgram);
        });
    });

    describe('#renderAST() - xu compatible', function() {
        it('alt only - render correct script', function() {
            var lProgram = renderer.render(fix.astOneAlt);
            var lExpectedProgram =
` * \\msc
 *   a,
 *   b,
 *   c;
 * \n *   a => b;
 *   b -- c;
 *     b => c;
 *     c >> b;
 * #;
 * \\endmsc`;
            assert.equal(lProgram, lExpectedProgram);
        });
        it('alt within loop - render correct script', function() {
            var lProgram = renderer.render(fix.astAltWithinLoop);
            var lExpectedProgram =
` * \\msc
 *   a,
 *   b,
 *   c;
 * \n *   a => b;
 *   a -- c [label="label for loop"];
 *     b -- c [label="label for alt"];
 *       b -> c [label="-> within alt"];
 *       c >> b [label=">> within alt"];
   * #;
 *     b >> a [label=">> within loop"];
 * #;
 *   a =>> a [label="happy-the-peppy - outside"];
 *   ...;
 * \\endmsc`;
            assert.equal(lProgram, lExpectedProgram);
        });
        it('When presented with an unsupported option, renders the script by simply omitting it', function(){
            var lProgram = renderer.render(fix.astWithAWatermark);
            var lExpectedProgram =
` * \\msc
 *   a;
 * \n * \\endmsc`;
            assert.equal(lProgram, lExpectedProgram);
        });
        it("Does not render width when that equals 'auto'", function(){
            var lProgram = renderer.render(fix.auto, true);
            var lExpectedProgram =
` * \\msc
 * \\endmsc`;
            assert.equal(lProgram, lExpectedProgram);
        });
        it("Render width when that is a number", function(){
            var lProgram = renderer.render(fix.fixedwidth, true);
            var lExpectedProgram =
` * \\msc
 *   width=800;
 * \n * \\endmsc`;
            assert.equal(lProgram, lExpectedProgram);
        });
        it("Puts entities with mscgen keyword for a name in quotes", function(){
            var lProgram = renderer.render(fix.entityWithMscGenKeywordAsName, true);
            var lExpectedProgram =
` * \\msc\n\
 *   "note";\n\
 * \n * \\endmsc`;
            assert.equal(lProgram, lExpectedProgram);
        });
    });
});
