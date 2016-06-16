/*
 * parser for _simplified_ MSC (messsage sequence chart)
 * Designed to make creating sequence charts as effortless as possible
 *
 * mscgen features supported:
 * - All arc types
 * - All options
 *
 * not supported (by design):
 * - all types of coloring, arcskip, id, url, idurl
 *
 * extra features:
 * - implicit entity declaration
 * - quoteless strings quotes
 * - low effort labels
 * - no need to enclose in msc { ... }
 * - inline expressions
 *
 * The resulting abstract syntax tree is compatible with the one
 * generated by the mscgenparser, so all renderers for mscgen can
 * be used for ms genny scripts as well.
 *
 */

{
    function mergeObject (pBase, pObjectToMerge){
        if (pObjectToMerge){
            Object.getOwnPropertyNames(pObjectToMerge).forEach(function(pAttribute){
                pBase[pAttribute] = pObjectToMerge[pAttribute];
            });
        }
    }

    function merge(pBase, pObjectToMerge){
        pBase = pBase ? pBase : {};
        mergeObject(pBase, pObjectToMerge);
        return pBase;
    }

    function optionArray2Object (pOptionList) {
        var lOptionList = {};
        pOptionList[0].forEach(function(lOption){
            lOptionList = merge(lOptionList, lOption);
        });
        return merge(lOptionList, pOptionList[1]);
    }

    function flattenBoolean(pBoolean) {
        return (["true", "on", "1"].indexOf(pBoolean.toLowerCase()) > -1);
    }

    function nameValue2Option(pName, pValue){
        var lOption = {};
        lOption[pName.toLowerCase()] = pValue;
        return lOption;
    }

    function entityExists (pEntities, pName, pEntityNamesToIgnore) {
        if (pName === undefined || pName === "*") {
            return true;
        }
        if (pEntities.entities.some(function(pEntity){
            return pEntity.name === pName;
        })){
            return true;
        }
        return pEntityNamesToIgnore[pName] === true;
    }

    function initEntity(lName ) {
        var lEntity = {};
        lEntity.name = lName;
        return lEntity;
    }

    function extractUndeclaredEntities (pEntities, pArcLineList, pEntityNamesToIgnore) {
        if (!pEntities) {
            pEntities = {};
            pEntities.entities = [];
        }

        if (!pEntityNamesToIgnore){
            pEntityNamesToIgnore = {};
        }

        if (pArcLineList && pArcLineList.arcs) {
            pArcLineList.arcs.forEach(function(pArcLine){
                pArcLine.forEach(function(pArc){
                    if (!entityExists (pEntities, pArc.from, pEntityNamesToIgnore)) {
                        pEntities.entities[pEntities.entities.length] =
                            initEntity(pArc.from);
                    }
                    // if the arc kind is arcspanning recurse into its arcs
                    if (pArc.arcs){
                        pEntityNamesToIgnore[pArc.to] = true;
                        merge (pEntities, extractUndeclaredEntities (pEntities, pArc, pEntityNamesToIgnore));
                        delete pEntityNamesToIgnore[pArc.to];
                    }
                    if (!entityExists (pEntities, pArc.to, pEntityNamesToIgnore)) {
                        pEntities.entities[pEntities.entities.length] =
                            initEntity(pArc.to);
                    }
                });
            });
        }
        return pEntities;
    }

    function hasExtendedOptions (pOptions){
        if (pOptions && pOptions.options){
            return (
                !!pOptions.options["watermark"] ||
                !!pOptions.options["mirrorentitiesonbottom"] ||
                (!!pOptions.options["width"] && pOptions.options["width"] === "auto")
            );
        } else {
            return false;
        }
    }

    function hasExtendedArcTypes(pArcLineList){
        if (pArcLineList && pArcLineList.arcs){
            return pArcLineList.arcs.some(function(pArcLine){
                return pArcLine.some(function(pArc){
                    return (["alt", "else", "opt", "break", "par",
                      "seq", "strict", "neg", "critical",
                      "ignore", "consider", "assert",
                      "loop", "ref", "exc"].indexOf(pArc.kind) > -1);
                });
            });
        }
        return false;
    }

    function getMetaInfo(pOptions, pArcLineList){
        var lHasExtendedOptions  = hasExtendedOptions(pOptions);
        var lHasExtendedArcTypes = hasExtendedArcTypes(pArcLineList);
        return {
            "extendedOptions" : lHasExtendedOptions,
            "extendedArcTypes": lHasExtendedArcTypes,
            "extendedFeatures": lHasExtendedOptions||lHasExtendedArcTypes
        }
    }
}

program
    =  pre:_ d:declarationlist _
    {
        d[1] = extractUndeclaredEntities(d[1], d[2]);
        var lRetval = merge (d[0], merge (d[1], d[2]));

        lRetval = merge ({meta: getMetaInfo(d[0], d[2])}, lRetval);

        if (pre.length > 0) {
            lRetval = merge({precomment: pre}, lRetval);
        }
        /*
            if (post.length > 0) {
                lRetval = merge(lRetval, {postcomment:post});
            }
        */
        return lRetval;
    }

declarationlist
    = (o:optionlist {return {options:o}})?
      (e:entitylist {return {entities:e}})?
      (a:arclist {return {arcs:a}})?

optionlist
    = options:((o:option "," {return o})*
               (o:option ";" {return o}))
    {
      return optionArray2Object(options);
    }

option
    = _ name:("hscale"i/ "arcgradient"i) _ "=" _ value:numberlike _
        {
            return nameValue2Option(name, value);
        }
    / _ name:"width"i _ "=" _ value:sizelike _
        {
            return nameValue2Option(name, value);
        }
    / _ name:"wordwraparcs"i _ "=" _ value:booleanlike _
        {
            var lOption = {};
            lOption[name.toLowerCase()] = flattenBoolean(value);
            return lOption;
        }
    / _ name:"watermark"i _ "=" _ value:quotedstring _
        {
            return nameValue2Option(name, value);
        }
    / _ name:"mirrorentitiesonbottom"i _ "=" _ value:booleanlike _
        {
            var lOption = {};
            lOption[name.toLowerCase()] = flattenBoolean(value);
            return lOption;
        }

entitylist
    = el:((e:entity "," {return e})* (e:entity ";" {return e}))
    {
      el[0].push(el[1]);
      return el[0];
    }

entity "entity"
    =  _ name:identifier _ label:(":" _ l:string _ {return l})?
    {
      var lEntity = {};
      lEntity.name = name;
      if (!!label) {
        lEntity.label = label;
      }
      return lEntity;
    }

arclist
    = (a:arcline _ ";" {return a})+

arcline
    = al:((a:arc "," {return a})* (a:arc {return [a]}))
    {
       al[0].push(al[1][0]);

       return al[0];
    }

arc
    = regulararc
    / spanarc

regulararc
    = ra:((sa:singlearc {return sa})
    / (da:dualarc {return da})
    / (ca:commentarc {return ca}))
      label:(":" _ s:string _ {return s})?
    {
      if (label) {
        ra.label = label;
      }
      return ra;
    }

singlearc
    = _ kind:singlearctoken _ {return {kind:kind}}

commentarc
    = _ kind:commenttoken _ {return {kind:kind}}

dualarc
    = (_ from:identifier _ kind:dualarctoken _ to:identifier _
      {return {kind: kind, from:from, to:to}})
    /(_ "*" _ kind:bckarrowtoken _ to:identifier _
      {return {kind:kind, from: "*", to:to}})
    /(_ from:identifier _ kind:fwdarrowtoken _ "*" _
      {return {kind:kind, from: from, to: "*"}})
    /(_ from:identifier _ kind:bidiarrowtoken _ "*" _
      {return {kind:kind, from: from, to: "*"}})

spanarc
    = (_ from:identifier _ kind:spanarctoken _ to:identifier _ label:(":" _ s:string _ {return s})? "{" _ arcs:arclist? _ "}" _
      {
        var retval = {kind: kind, from:from, to:to, arcs:arcs};
        if (label) {
          retval.label = label;
        }
        return retval;
      })

singlearctoken "empty row"
    = "|||"
    / "..."

commenttoken "---"
    = "---"

dualarctoken
    = kind:( bidiarrowtoken
    / fwdarrowtoken
    / bckarrowtoken
    / boxtoken
    )
    {
        return kind.toLowerCase();
    }

bidiarrowtoken "bi-directional arrow"
    = "--" / "<->"
    / "==" / "<<=>>"
           / "<=>"
    / ".." / "<<>>"
    / "::" / "<:>"

fwdarrowtoken "left to right arrow"
    = "->"
    / "=>>"
    / "=>"
    / ">>"
    / ":>"
    / "-x"i

bckarrowtoken "right to left arrow"
    = "<-"
    / "<<="
    / "<="
    / "<<"
    / "<:"
    / "x-"i

boxtoken "box"
    = "note"i
    / "abox"i
    / "rbox"i
    / "box"i

spanarctoken "inline expression"
    = kind:(
          "alt"i
        / "else"i
        / "opt"i
        / "break"i
        / "par"i
        / "seq"i
        / "strict"i
        / "neg"i
        / "critical"i
        / "ignore"i
        / "consider"i
        / "assert"i
        / "loop"i
        / "ref"i
        / "exc"i
     )
    {
        return kind.toLowerCase()
    }

string
    = quotedstring
    / unquotedstring

quotedstring "double quoted string" // used in watermark messages
    = '"' s:stringcontent '"' {return s.join("")}

stringcontent
    = (!'"' c:('\\"'/ .) {return c})*

unquotedstring
    = s:nonsep {return s.join("").trim()}

nonsep
    = (!(',' /';' /'{') c:(.) {return c})*

identifier "identifier"
    = (letters:([^;, \"\t\n\r=\-><:\{\*])+ {return letters.join("")})
    / quotedstring

whitespace "whitespace"
    = c:[ \t] {return c}

lineend "lineend"
    = c:[\r\n] {return c}

/* comments - multi line */
mlcomstart = "/*"
mlcomend   = "*/"
mlcomtok   = !"*/" c:. {return c}
mlcomment
    = start:mlcomstart com:(mlcomtok)* end:mlcomend
    {
      return start + com.join("") + end
    }

/* comments - single line */
slcomstart = "//" / "#"
slcomtok   = [^\r\n]
slcomment
    = start:(slcomstart) com:(slcomtok)*
    {
      return start + com.join("")
    }

/* comments in general */
comment "comment"
    = slcomment
    / mlcomment
_
   = (whitespace / lineend/ comment)*

numberlike "number"
    = s:numberlikestring { return s; }
    / i:number { return i.toString(); }

numberlikestring
    = '"' s:number '"' { return s.toString(); }

number
    = real
    / cardinal

cardinal
    = digits:[0-9]+ { return parseInt(digits.join(""), 10); }

real
    = digits:(cardinal "." cardinal) { return parseFloat(digits.join("")); }

booleanlike "boolean"
    = bs:booleanlikestring {return bs;}
    / b:boolean {return b.toString();}

booleanlikestring
    = '"' s:boolean '"' { return s; }

boolean
    = "true"i
    / "false"i
    / "on"i
    / "off"i
    / "0"
    / "1"

sizelike "size"
    = sizelikestring
    / size

sizelikestring
    = '"' s:size '"' { return s; }

size
    = n:number {return n.toString(); }
    / s:"auto"i {return s.toLowerCase(); }

/*
 This file is part of mscgen_js.

 mscgen_js is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 mscgen_js is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with mscgen_js.  If not, see <http://www.gnu.org/licenses/>.
 */
