/* Riot v3.0.0-alpha.4, @license MIT */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.riot = factory());
}(this, function () { 'use strict';

    var observable = function observable(el) {

      /**
       * Extend the original object or create a new empty one
       * @type { Object }
       */

      el = el || {};

      /**
       * Private variables
       */
      var callbacks = {},
          slice = Array.prototype.slice;

      /**
       * Private Methods
       */

      /**
       * Helper function needed to get and loop all the events in a string
       * @param   { String }   e - event string
       * @param   {Function}   fn - callback
       */
      function onEachEvent(e, fn) {
        var es = e.split(' '),
            l = es.length,
            i = 0,
            name,
            indx;
        for (; i < l; i++) {
          name = es[i];
          indx = name.indexOf('.');
          if (name) fn(~indx ? name.substring(0, indx) : name, i, ~indx ? name.slice(indx + 1) : null);
        }
      }

      /**
       * Public Api
       */

      // extend the el object adding the observable methods
      Object.defineProperties(el, {
        /**
         * Listen to the given space separated list of `events` and
         * execute the `callback` each time an event is triggered.
         * @param  { String } events - events ids
         * @param  { Function } fn - callback function
         * @returns { Object } el
         */
        on: {
          value: function value(events, fn) {
            if (typeof fn != 'function') return el;

            onEachEvent(events, function (name, pos, ns) {
              (callbacks[name] = callbacks[name] || []).push(fn);
              fn.typed = pos > 0;
              fn.ns = ns;
            });

            return el;
          },
          enumerable: false,
          writable: false,
          configurable: false
        },

        /**
         * Removes the given space separated list of `events` listeners
         * @param   { String } events - events ids
         * @param   { Function } fn - callback function
         * @returns { Object } el
         */
        off: {
          value: function value(events, fn) {
            if (events == '*' && !fn) callbacks = {};else {
              onEachEvent(events, function (name, pos, ns) {
                if (fn || ns) {
                  var arr = callbacks[name];
                  for (var i = 0, cb; cb = arr && arr[i]; ++i) {
                    if (cb == fn || ns && cb.ns == ns) arr.splice(i--, 1);
                  }
                } else delete callbacks[name];
              });
            }
            return el;
          },
          enumerable: false,
          writable: false,
          configurable: false
        },

        /**
         * Listen to the given space separated list of `events` and
         * execute the `callback` at most once
         * @param   { String } events - events ids
         * @param   { Function } fn - callback function
         * @returns { Object } el
         */
        one: {
          value: function value(events, fn) {
            function on() {
              el.off(events, on);
              fn.apply(el, arguments);
            }
            return el.on(events, on);
          },
          enumerable: false,
          writable: false,
          configurable: false
        },

        /**
         * Execute all callback functions that listen to
         * the given space separated list of `events`
         * @param   { String } events - events ids
         * @returns { Object } el
         */
        trigger: {
          value: function value(events) {

            // getting the arguments
            var arglen = arguments.length - 1,
                args = new Array(arglen),
                fns;

            for (var i = 0; i < arglen; i++) {
              args[i] = arguments[i + 1]; // skip first argument
            }

            onEachEvent(events, function (name, pos, ns) {

              fns = slice.call(callbacks[name] || [], 0);

              for (var i = 0, fn; fn = fns[i]; ++i) {
                if (fn.busy) continue;
                fn.busy = 1;
                if (!ns || fn.ns == ns) fn.apply(el, fn.typed ? [name].concat(args) : args);
                if (fns[i] !== fn) {
                  i--;
                }
                fn.busy = 0;
              }

              if (callbacks['*'] && name != '*') el.trigger.apply(el, ['*', name].concat(args));
            });

            return el;
          },
          enumerable: false,
          writable: false,
          configurable: false
        }
      });

      return el;
    };

    /**
     * The riot template engine
     * @version v2.4.0
     */
    /**
     * riot.util.brackets
     *
     * - `brackets    ` - Returns a string or regex based on its parameter
     * - `brackets.set` - Change the current riot brackets
     *
     * @module
     */

    /* global riot */

    var brackets = (function (UNDEF) {

      var
        REGLOB = 'g',

        R_MLCOMMS = /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g,

        R_STRINGS = /"[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'/g,

        S_QBLOCKS = R_STRINGS.source + '|' +
          /(?:\breturn\s+|(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/]))/.source + '|' +
          /\/(?=[^*\/])[^[\/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[\/\\]*)*?(\/)[gim]*/.source,

        FINDBRACES = {
          '(': RegExp('([()])|'   + S_QBLOCKS, REGLOB),
          '[': RegExp('([[\\]])|' + S_QBLOCKS, REGLOB),
          '{': RegExp('([{}])|'   + S_QBLOCKS, REGLOB)
        },

        DEFAULT = '{ }'

      var _pairs = [
        '{', '}',
        '{', '}',
        /{[^}]*}/,
        /\\([{}])/g,
        /\\({)|{/g,
        RegExp('\\\\(})|([[({])|(})|' + S_QBLOCKS, REGLOB),
        DEFAULT,
        /^\s*{\^?\s*([$\w]+)(?:\s*,\s*(\S+))?\s+in\s+(\S.*)\s*}/,
        /(^|[^\\]){=[\S\s]*?}/
      ]

      var
        cachedBrackets = UNDEF,
        _regex,
        _cache = [],
        _settings

      function _loopback (re) { return re }

      function _rewrite (re, bp) {
        if (!bp) bp = _cache
        return new RegExp(
          re.source.replace(/{/g, bp[2]).replace(/}/g, bp[3]), re.global ? REGLOB : ''
        )
      }

      function _create (pair) {
        if (pair === DEFAULT) return _pairs

        var arr = pair.split(' ')

        if (arr.length !== 2 || /[\x00-\x1F<>a-zA-Z0-9'",;\\]/.test(pair)) { // eslint-disable-line
          throw new Error('Unsupported brackets "' + pair + '"')
        }
        arr = arr.concat(pair.replace(/(?=[[\]()*+?.^$|])/g, '\\').split(' '))

        arr[4] = _rewrite(arr[1].length > 1 ? /{[\S\s]*?}/ : _pairs[4], arr)
        arr[5] = _rewrite(pair.length > 3 ? /\\({|})/g : _pairs[5], arr)
        arr[6] = _rewrite(_pairs[6], arr)
        arr[7] = RegExp('\\\\(' + arr[3] + ')|([[({])|(' + arr[3] + ')|' + S_QBLOCKS, REGLOB)
        arr[8] = pair
        return arr
      }

      function _brackets (reOrIdx) {
        return reOrIdx instanceof RegExp ? _regex(reOrIdx) : _cache[reOrIdx]
      }

      _brackets.split = function split (str, tmpl, _bp) {
        // istanbul ignore next: _bp is for the compiler
        if (!_bp) _bp = _cache

        var
          parts = [],
          match,
          isexpr,
          start,
          pos,
          re = _bp[6]

        isexpr = start = re.lastIndex = 0

        while ((match = re.exec(str))) {

          pos = match.index

          if (isexpr) {

            if (match[2]) {
              re.lastIndex = skipBraces(str, match[2], re.lastIndex)
              continue
            }
            if (!match[3]) {
              continue
            }
          }

          if (!match[1]) {
            unescapeStr(str.slice(start, pos))
            start = re.lastIndex
            re = _bp[6 + (isexpr ^= 1)]
            re.lastIndex = start
          }
        }

        if (str && start < str.length) {
          unescapeStr(str.slice(start))
        }

        return parts

        function unescapeStr (s) {
          if (tmpl || isexpr) {
            parts.push(s && s.replace(_bp[5], '$1'))
          } else {
            parts.push(s)
          }
        }

        function skipBraces (s, ch, ix) {
          var
            match,
            recch = FINDBRACES[ch]

          recch.lastIndex = ix
          ix = 1
          while ((match = recch.exec(s))) {
            if (match[1] &&
              !(match[1] === ch ? ++ix : --ix)) break
          }
          return ix ? s.length : recch.lastIndex
        }
      }

      _brackets.hasExpr = function hasExpr (str) {
        return _cache[4].test(str)
      }

      _brackets.loopKeys = function loopKeys (expr) {
        var m = expr.match(_cache[9])

        return m
          ? { key: m[1], pos: m[2], val: _cache[0] + m[3].trim() + _cache[1] }
          : { val: expr.trim() }
      }

      _brackets.array = function array (pair) {
        return pair ? _create(pair) : _cache
      }

      function _reset (pair) {
        if ((pair || (pair = DEFAULT)) !== _cache[8]) {
          _cache = _create(pair)
          _regex = pair === DEFAULT ? _loopback : _rewrite
          _cache[9] = _regex(_pairs[9])
        }
        cachedBrackets = pair
      }

      function _setSettings (o) {
        var b

        o = o || {}
        b = o.brackets
        Object.defineProperty(o, 'brackets', {
          set: _reset,
          get: function () { return cachedBrackets },
          enumerable: true
        })
        _settings = o
        _reset(b)
      }

      Object.defineProperty(_brackets, 'settings', {
        set: _setSettings,
        get: function () { return _settings }
      })

      /* istanbul ignore next: in the browser riot is always in the scope */
      _brackets.settings = typeof riot !== 'undefined' && riot.settings || {}
      _brackets.set = _reset

      _brackets.R_STRINGS = R_STRINGS
      _brackets.R_MLCOMMS = R_MLCOMMS
      _brackets.S_QBLOCKS = S_QBLOCKS

      return _brackets

    })()

    /**
     * @module tmpl
     *
     * tmpl          - Root function, returns the template value, render with data
     * tmpl.hasExpr  - Test the existence of a expression inside a string
     * tmpl.loopKeys - Get the keys for an 'each' loop (used by `_each`)
     */

    var tmpl = (function () {

      var _cache = {}

      function _tmpl (str, data) {
        if (!str) return str

        return (_cache[str] || (_cache[str] = _create(str))).call(data, _logErr)
      }

      _tmpl.haveRaw = brackets.hasRaw

      _tmpl.hasExpr = brackets.hasExpr

      _tmpl.loopKeys = brackets.loopKeys

      _tmpl.errorHandler = null

      function _logErr (err, ctx) {

        if (_tmpl.errorHandler) {

          err.riotData = {
            tagName: ctx && ctx.root && ctx.root.tagName,
            _riot_id: ctx && ctx._riot_id  //eslint-disable-line camelcase
          }
          _tmpl.errorHandler(err)
        }
      }

      function _create (str) {
        var expr = _getTmpl(str)

        if (expr.slice(0, 11) !== 'try{return ') expr = 'return ' + expr

    /* eslint-disable */

        return new Function('E', expr + ';')
    /* eslint-enable */
      }

      var
        CH_IDEXPR = '\u2057',
        RE_CSNAME = /^(?:(-?[_A-Za-z\xA0-\xFF][-\w\xA0-\xFF]*)|\u2057(\d+)~):/,
        RE_QBLOCK = RegExp(brackets.S_QBLOCKS, 'g'),
        RE_DQUOTE = /\u2057/g,
        RE_QBMARK = /\u2057(\d+)~/g

      function _getTmpl (str) {
        var
          qstr = [],
          expr,
          parts = brackets.split(str.replace(RE_DQUOTE, '"'), 1)

        if (parts.length > 2 || parts[0]) {
          var i, j, list = []

          for (i = j = 0; i < parts.length; ++i) {

            expr = parts[i]

            if (expr && (expr = i & 1

                ? _parseExpr(expr, 1, qstr)

                : '"' + expr
                    .replace(/\\/g, '\\\\')
                    .replace(/\r\n?|\n/g, '\\n')
                    .replace(/"/g, '\\"') +
                  '"'

              )) list[j++] = expr

          }

          expr = j < 2 ? list[0]
               : '[' + list.join(',') + '].join("")'

        } else {

          expr = _parseExpr(parts[1], 0, qstr)
        }

        if (qstr[0]) {
          expr = expr.replace(RE_QBMARK, function (_, pos) {
            return qstr[pos]
              .replace(/\r/g, '\\r')
              .replace(/\n/g, '\\n')
          })
        }
        return expr
      }

      var
        RE_BREND = {
          '(': /[()]/g,
          '[': /[[\]]/g,
          '{': /[{}]/g
        }

      function _parseExpr (expr, asText, qstr) {

        expr = expr
              .replace(RE_QBLOCK, function (s, div) {
                return s.length > 2 && !div ? CH_IDEXPR + (qstr.push(s) - 1) + '~' : s
              })
              .replace(/\s+/g, ' ').trim()
              .replace(/\ ?([[\({},?\.:])\ ?/g, '$1')

        if (expr) {
          var
            list = [],
            cnt = 0,
            match

          while (expr &&
                (match = expr.match(RE_CSNAME)) &&
                !match.index
            ) {
            var
              key,
              jsb,
              re = /,|([[{(])|$/g

            expr = RegExp.rightContext
            key  = match[2] ? qstr[match[2]].slice(1, -1).trim().replace(/\s+/g, ' ') : match[1]

            while (jsb = (match = re.exec(expr))[1]) skipBraces(jsb, re)

            jsb  = expr.slice(0, match.index)
            expr = RegExp.rightContext

            list[cnt++] = _wrapExpr(jsb, 1, key)
          }

          expr = !cnt ? _wrapExpr(expr, asText)
               : cnt > 1 ? '[' + list.join(',') + '].join(" ").trim()' : list[0]
        }
        return expr

        function skipBraces (ch, re) {
          var
            mm,
            lv = 1,
            ir = RE_BREND[ch]

          ir.lastIndex = re.lastIndex
          while (mm = ir.exec(expr)) {
            if (mm[0] === ch) ++lv
            else if (!--lv) break
          }
          re.lastIndex = lv ? expr.length : ir.lastIndex
        }
      }

      // istanbul ignore next: not both
      var // eslint-disable-next-line max-len
        JS_CONTEXT = '"in this?this:' + (typeof window !== 'object' ? 'global' : 'window') + ').',
        JS_VARNAME = /[,{][$\w]+:|(^ *|[^$\w\.])(?!(?:typeof|true|false|null|undefined|in|instanceof|is(?:Finite|NaN)|void|NaN|new|Date|RegExp|Math)(?![$\w]))([$_A-Za-z][$\w]*)/g,
        JS_NOPROPS = /^(?=(\.[$\w]+))\1(?:[^.[(]|$)/

      function _wrapExpr (expr, asText, key) {
        var tb

        expr = expr.replace(JS_VARNAME, function (match, p, mvar, pos, s) {
          if (mvar) {
            pos = tb ? 0 : pos + match.length

            if (mvar !== 'this' && mvar !== 'global' && mvar !== 'window') {
              match = p + '("' + mvar + JS_CONTEXT + mvar
              if (pos) tb = (s = s[pos]) === '.' || s === '(' || s === '['
            } else if (pos) {
              tb = !JS_NOPROPS.test(s.slice(pos))
            }
          }
          return match
        })

        if (tb) {
          expr = 'try{return ' + expr + '}catch(e){E(e,this)}'
        }

        if (key) {

          expr = (tb
              ? 'function(){' + expr + '}.call(this)' : '(' + expr + ')'
            ) + '?"' + key + '":""'

        } else if (asText) {

          expr = 'function(v){' + (tb
              ? expr.replace('return ', 'v=') : 'v=(' + expr + ')'
            ) + ';return v||v===0?v:""}.call(this)'
        }

        return expr
      }

      // istanbul ignore next: compatibility fix for beta versions
      _tmpl.parse = function (s) { return s }

      _tmpl.version = brackets.version = 'v2.4.0'

      return _tmpl

    })()

    /**
     * @module parsers
     */
    var parsers = function () {

      function _req(name) {
        var parser = window[name];

        if (parser) return parser;

        throw new Error(name + ' parser not found.');
      }

      function extend(obj, props) {
        if (props) {
          for (var prop in props) {
            /* istanbul ignore next */
            if (props.hasOwnProperty(prop)) {
              obj[prop] = props[prop];
            }
          }
        }
        return obj;
      }

      var _p = {
        html: {
          jade: function jade(html, opts, url) {
            opts = extend({
              pretty: true,
              filename: url,
              doctype: 'html'
            }, opts);
            return _req('jade').render(html, opts);
          }
        },

        css: {
          less: function less(tag, css, opts, url) {
            var ret;

            opts = extend({
              sync: true,
              syncImport: true,
              filename: url
            }, opts);
            _req('less').render(css, opts, function (err, result) {
              // istanbul ignore next
              if (err) throw err;
              ret = result.css;
            });
            return ret;
          }
        },

        js: {
          es6: function es6(js, opts) {
            opts = extend({
              blacklist: ['useStrict', 'strict', 'react'],
              sourceMaps: false,
              comments: false
            }, opts);
            return _req('babel').transform(js, opts).code;
          },
          babel: function babel(js, opts, url) {
            return _req('babel').transform(js, extend({ filename: url }, opts)).code;
          },
          coffee: function coffee(js, opts) {
            return _req('CoffeeScript').compile(js, extend({ bare: true }, opts));
          },
          livescript: function livescript(js, opts) {
            return _req('livescript').compile(js, extend({ bare: true, header: false }, opts));
          },
          typescript: function typescript(js, opts) {
            return _req('typescript')(js, opts);
          },
          none: function none(js) {
            return js;
          }
        }
      };

      _p.js.javascript = _p.js.none;
      _p.js.coffeescript = _p.js.coffee;

      return _p;
    }();

    /**
     * @module compiler
     */

    var S_LINESTR = /"[^"\n\\]*(?:\\[\S\s][^"\n\\]*)*"|'[^'\n\\]*(?:\\[\S\s][^'\n\\]*)*'/.source;

    var S_STRINGS = brackets.R_STRINGS.source;

    var HTML_ATTRS = / *([-\w:\xA0-\xFF]+) ?(?:= ?('[^']*'|"[^"]*"|\S+))?/g;

    var HTML_COMMS = RegExp(/<!--(?!>)[\S\s]*?-->/.source + '|' + S_LINESTR, 'g');

    var HTML_TAGS = /<(-?[A-Za-z][-\w\xA0-\xFF]*)(?:\s+([^"'\/>]*(?:(?:"[^"]*"|'[^']*'|\/[^>])[^'"\/>]*)*)|\s*)(\/?)>/g;

    var HTML_PACK = />[ \t]+<(-?[A-Za-z]|\/[-A-Za-z])/g;

    var RIOT_ATTRS = ['style', 'src', 'd'];

    var VOID_TAGS = /^(?:input|img|br|wbr|hr|area|base|col|embed|keygen|link|meta|param|source|track)$/;

    var PRE_TAGS = /<pre(?:\s+(?:[^">]*|"[^"]*")*)?>([\S\s]+?)<\/pre\s*>/gi;

    var SPEC_TYPES = /^"(?:number|date(?:time)?|time|month|email|color)\b/i;

    var TRIM_TRAIL = /[ \t]+$/gm;

    var RE_HASEXPR = /\x01#\d/;
    var RE_REPEXPR = /\x01#(\d+)/g;
    var CH_IDEXPR = '\x01#';
    var CH_DQCODE = '⁗';
    var DQ = '"';
    var SQ = "'";
    function cleanSource(src) {
      var mm,
          re = HTML_COMMS;

      if (~src.indexOf('\r')) {
        src = src.replace(/\r\n?/g, '\n');
      }

      re.lastIndex = 0;
      while (mm = re.exec(src)) {
        if (mm[0][0] === '<') {
          src = RegExp.leftContext + RegExp.rightContext;
          re.lastIndex = mm[3] + 1;
        }
      }
      return src;
    }

    function parseAttribs(str, pcex) {
      var list = [],
          match,
          type,
          vexp;

      HTML_ATTRS.lastIndex = 0;

      str = str.replace(/\s+/g, ' ');

      while (match = HTML_ATTRS.exec(str)) {
        var k = match[1].toLowerCase(),
            v = match[2];

        if (!v) {
          list.push(k);
        } else {

          if (v[0] !== DQ) {
            v = DQ + (v[0] === SQ ? v.slice(1, -1) : v) + DQ;
          }

          if (k === 'type' && SPEC_TYPES.test(v)) {
            type = v;
          } else {
            if (RE_HASEXPR.test(v)) {

              if (k === 'value') vexp = 1;else if (~RIOT_ATTRS.indexOf(k)) k = 'riot-' + k;
            }

            list.push(k + '=' + v);
          }
        }
      }

      if (type) {
        if (vexp) type = DQ + pcex._bp[0] + SQ + type.slice(1, -1) + SQ + pcex._bp[1] + DQ;
        list.push('type=' + type);
      }
      return list.join(' ');
    }

    function splitHtml(html, opts, pcex) {
      var _bp = pcex._bp;

      if (html && _bp[4].test(html)) {
        var jsfn = opts.expr && (opts.parser || opts.type) ? _compileJS : 0,
            list = brackets.split(html, 0, _bp),
            expr;

        for (var i = 1; i < list.length; i += 2) {
          expr = list[i];
          if (expr[0] === '^') {
            expr = expr.slice(1);
          } else if (jsfn) {
            expr = jsfn(expr, opts).trim();
            if (expr.slice(-1) === ';') expr = expr.slice(0, -1);
          }
          list[i] = CH_IDEXPR + (pcex.push(expr) - 1) + _bp[1];
        }
        html = list.join('');
      }
      return html;
    }

    function restoreExpr(html, pcex) {
      if (pcex.length) {
        html = html.replace(RE_REPEXPR, function (_, d) {

          return pcex._bp[0] + pcex[d].trim().replace(/[\r\n]+/g, ' ').replace(/"/g, CH_DQCODE);
        });
      }
      return html;
    }

    function _compileHTML(html, opts, pcex) {

      html = splitHtml(html, opts, pcex).replace(HTML_TAGS, function (_, name, attr, ends) {

        name = name.toLowerCase();

        ends = ends && !VOID_TAGS.test(name) ? '></' + name : '';

        if (attr) name += ' ' + parseAttribs(attr, pcex);

        return '<' + name + ends + '>';
      });

      if (!opts.whitespace) {
        var p = [];

        if (/<pre[\s>]/.test(html)) {
          html = html.replace(PRE_TAGS, function (q) {
            p.push(q);
            return '\u0002';
          });
        }

        html = html.trim().replace(/\s+/g, ' ');

        if (p.length) html = html.replace(/\u0002/g, function () {
          return p.shift();
        });
      }

      if (opts.compact) html = html.replace(HTML_PACK, '><$1');

      return restoreExpr(html, pcex).replace(TRIM_TRAIL, '');
    }

    function compileHTML(html, opts, pcex) {

      if (Array.isArray(opts)) {
        pcex = opts;
        opts = {};
      } else {
        if (!pcex) pcex = [];
        if (!opts) opts = {};
      }

      pcex._bp = brackets.array(opts.brackets);

      return _compileHTML(cleanSource(html), opts, pcex);
    }

    var JS_ES6SIGN = /^[ \t]*([$_A-Za-z][$\w]*)\s*\([^()]*\)\s*{/m;

    var JS_ES6END = RegExp('[{}]|' + brackets.S_QBLOCKS, 'g');

    var JS_COMMS = RegExp(brackets.R_MLCOMMS.source + '|//[^\r\n]*|' + brackets.S_QBLOCKS, 'g');

    function riotjs(js) {
      var parts = [],
          match,
          toes5,
          pos,
          name,
          RE = RegExp;

      if (~js.indexOf('/')) js = rmComms(js, JS_COMMS);

      while (match = js.match(JS_ES6SIGN)) {

        parts.push(RE.leftContext);
        js = RE.rightContext;
        pos = skipBody(js, JS_ES6END);

        name = match[1];
        toes5 = !/^(?:if|while|for|switch|catch|function)$/.test(name);
        name = toes5 ? match[0].replace(name, 'this.' + name + ' = function') : match[0];
        parts.push(name, js.slice(0, pos));
        js = js.slice(pos);

        if (toes5 && !/^\s*.\s*bind\b/.test(js)) parts.push('.bind(this)');
      }

      return parts.length ? parts.join('') + js : js;

      function rmComms(s, r, m) {
        r.lastIndex = 0;
        while (m = r.exec(s)) {
          if (m[0][0] === '/' && !m[1] && !m[2]) {
            s = RE.leftContext + ' ' + RE.rightContext;
            r.lastIndex = m[3] + 1;
          }
        }
        return s;
      }

      function skipBody(s, r) {
        var m,
            i = 1;

        r.lastIndex = 0;
        while (i && (m = r.exec(s))) {
          if (m[0] === '{') ++i;else if (m[0] === '}') --i;
        }
        return i ? s.length : r.lastIndex;
      }
    }

    function _compileJS(js, opts, type, parserOpts, url) {
      if (!/\S/.test(js)) return '';
      if (!type) type = opts.type;

      var parser = opts.parser || (type ? parsers.js[type] : riotjs);

      if (!parser) {
        throw new Error('JS parser not found: "' + type + '"');
      }
      return parser(js, parserOpts, url).replace(/\r\n?/g, '\n').replace(TRIM_TRAIL, '');
    }

    function compileJS(js, opts, type, userOpts) {
      if (typeof opts === 'string') {
        userOpts = type;
        type = opts;
        opts = {};
      }
      if (type && typeof type === 'object') {
        userOpts = type;
        type = '';
      }
      if (!userOpts) userOpts = {};

      return _compileJS(js, opts || {}, type, userOpts.parserOptions, userOpts.url);
    }

    var CSS_SELECTOR = RegExp('([{}]|^)[ ;]*([^@ ;{}][^{}]*)(?={)|' + S_LINESTR, 'g');

    function scopedCSS(tag, css) {
      var scope = ':scope';

      return css.replace(CSS_SELECTOR, function (m, p1, p2) {

        if (!p2) return m;

        p2 = p2.replace(/[^,]+/g, function (sel) {
          var s = sel.trim();

          if (!s || s === 'from' || s === 'to' || s.slice(-1) === '%') {
            return sel;
          }

          if (s.indexOf(scope) < 0) {
            s = tag + ' ' + s + ',[riot-tag="' + tag + '"] ' + s + ',[data-is="' + tag + '"] ' + s;
          } else {
            s = s.replace(scope, tag) + ',' + s.replace(scope, '[riot-tag="' + tag + '"]') + ',' + s.replace(scope, '[data-is="' + tag + '"]');
          }
          return s;
        });

        return p1 ? p1 + ' ' + p2 : p2;
      });
    }

    function _compileCSS(css, tag, type, opts) {
      var scoped = (opts || (opts = {})).scoped;

      if (type) {
        if (type === 'scoped-css') {
          scoped = true;
        } else if (parsers.css[type]) {
          css = parsers.css[type](tag, css, opts.parserOpts || {}, opts.url);
        } else if (type !== 'css') {
          throw new Error('CSS parser not found: "' + type + '"');
        }
      }

      css = css.replace(brackets.R_MLCOMMS, '').replace(/\s+/g, ' ').trim();

      if (scoped) {
        if (!tag) {
          throw new Error('Can not parse scoped CSS without a tagName');
        }
        css = scopedCSS(tag, css);
      }
      return css;
    }

    function compileCSS(css, type, opts) {
      if (type && typeof type === 'object') {
        opts = type;
        type = '';
      } else if (!opts) opts = {};

      return _compileCSS(css, opts.tagName, type, opts);
    }

    var TYPE_ATTR = /\stype\s*=\s*(?:(['"])(.+?)\1|(\S+))/i;

    var MISC_ATTR = '\\s*=\\s*(' + S_STRINGS + '|{[^}]+}|\\S+)';

    var END_TAGS = /\/>\n|^<(?:\/?-?[A-Za-z][-\w\xA0-\xFF]*\s*|-?[A-Za-z][-\w\xA0-\xFF]*\s+[-\w:\xA0-\xFF][\S\s]*?)>\n/;

    function _q(s, r) {
      if (!s) return "''";
      s = SQ + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + SQ;
      return r && ~s.indexOf('\n') ? s.replace(/\n/g, '\\n') : s;
    }

    function mktag(name, html, css, attr, js, opts) {
      var c = opts.debug ? ',\n  ' : ', ',
          s = '});';

      if (js && js.slice(-1) !== '\n') s = '\n' + s;

      return 'riot.tag2(\'' + name + SQ + c + _q(html, 1) + c + _q(css) + c + _q(attr) + ', function(opts) {\n' + js + s;
    }

    function splitBlocks(str) {
      if (/<[-\w]/.test(str)) {
        var m,
            k = str.lastIndexOf('<'),
            n = str.length;

        while (~k) {
          m = str.slice(k, n).match(END_TAGS);
          if (m) {
            k += m.index + m[0].length;
            return [str.slice(0, k), str.slice(k)];
          }
          n = k;
          k = str.lastIndexOf('<', k - 1);
        }
      }
      return ['', str];
    }

    function getType(attribs) {
      if (attribs) {
        var match = attribs.match(TYPE_ATTR);

        match = match && (match[2] || match[3]);
        if (match) {
          return match.replace('text/', '');
        }
      }
      return '';
    }

    function getAttrib(attribs, name) {
      if (attribs) {
        var match = attribs.match(RegExp('\\s' + name + MISC_ATTR, 'i'));

        match = match && match[1];
        if (match) {
          return (/^['"]/.test(match) ? match.slice(1, -1) : match
          );
        }
      }
      return '';
    }

    function unescapeHTML(str) {
      return str.replace('&amp;', /&/g).replace('&lt;', /</g).replace('&gt;', />/g).replace('&quot;', /"/g).replace('&#039;', /'/g);
    }

    function getParserOptions(attribs) {
      var opts = unescapeHTML(getAttrib(attribs, 'options'));

      return opts ? JSON.parse(opts) : null;
    }

    function getCode(code, opts, attribs, base) {
      var type = getType(attribs),
          src = getAttrib(attribs, 'src');

      if (src) return false;
      return _compileJS(code, opts, type, getParserOptions(attribs), base);
    }

    function cssCode(code, opts, attribs, url, tag) {
      var extraOpts = {
        parserOpts: getParserOptions(attribs),
        scoped: attribs && /\sscoped(\s|=|$)/i.test(attribs),
        url: url
      };

      return _compileCSS(code, tag, getType(attribs) || opts.style, extraOpts);
    }

    function compileTemplate(html, url, lang, opts) {
      var parser = parsers.html[lang];

      if (!parser) {
        throw new Error('Template parser not found: "' + lang + '"');
      }
      return parser(html, opts, url);
    }

    var CUST_TAG = RegExp(/^([ \t]*)<(-?[A-Za-z][-\w\xA0-\xFF]*)(?:\s+([^'"\/>]+(?:(?:@|\/[^>])[^'"\/>]*)*)|\s*)?(?:\/>|>[ \t]*\n?([\S\s]*)^\1<\/\2\s*>|>(.*)<\/\2\s*>)/.source.replace('@', S_STRINGS), 'gim');
    var SCRIPTS = /<script(\s+[^>]*)?>\n?([\S\s]*?)<\/script\s*>/gi;
    var STYLES = /<style(\s+[^>]*)?>\n?([\S\s]*?)<\/style\s*>/gi;
    function compile$1(src, opts, url) {
      var parts = [],
          included;

      if (!opts) opts = {};

      included = opts.exclude ? function (s) {
        return opts.exclude.indexOf(s) < 0;
      } : function () {
        return 1;
      };

      if (!url) url = '';

      var _bp = brackets.array(opts.brackets);

      if (opts.template) {
        src = compileTemplate(src, url, opts.template, opts.templateOptions);
      }

      src = cleanSource(src).replace(CUST_TAG, function (_, indent, tagName, attribs, body, body2) {
        var jscode = '',
            styles = '',
            html = '',
            pcex = [];

        pcex._bp = _bp;

        tagName = tagName.toLowerCase();

        attribs = attribs && included('attribs') ? restoreExpr(parseAttribs(splitHtml(attribs, opts, pcex), pcex), pcex) : '';

        if ((body || (body = body2)) && /\S/.test(body)) {

          if (body2) {

            if (included('html')) html = _compileHTML(body2, opts, pcex);
          } else {

            body = body.replace(RegExp('^' + indent, 'gm'), '');

            body = body.replace(STYLES, function (_m, _attrs, _style) {
              if (included('css')) {
                styles += (styles ? ' ' : '') + cssCode(_style, opts, _attrs, url, tagName);
              }
              return '';
            });

            body = body.replace(SCRIPTS, function (_m, _attrs, _script) {
              if (included('js')) {
                var code = getCode(_script, opts, _attrs, url);

                if (code) jscode += (jscode ? '\n' : '') + code;
              }
              return '';
            });

            var blocks = splitBlocks(body.replace(TRIM_TRAIL, ''));

            if (included('html')) {
              html = _compileHTML(blocks[0], opts, pcex);
            }

            if (included('js')) {
              body = _compileJS(blocks[1], opts, null, null, url);
              if (body) jscode += (jscode ? '\n' : '') + body;
            }
          }
        }

        jscode = /\S/.test(jscode) ? jscode.replace(/\n{3,}/g, '\n\n') : '';

        if (opts.entities) {
          parts.push({
            tagName: tagName,
            html: html,
            css: styles,
            attribs: attribs,
            js: jscode
          });
          return '';
        }

        return mktag(tagName, html, styles, attribs, jscode, opts);
      });

      if (opts.entities) return parts;

      return src;
    }

    var version = 'v3.0.0-alpha.1';

    var compiler = {
      compile: compile$1,
      compileHTML: compileHTML,
      compileCSS: compileCSS,
      compileJS: compileJS,
      parsers: parsers,
      version: version
    };

    var __VIRTUAL_DOM = [];
    var __TAG_IMPL = {};
    var GLOBAL_MIXIN = '__global_mixin';
    var RIOT_PREFIX = 'riot-';
    var RIOT_TAG = 'data-is';
    var RIOT_TAG_IS = 'data-is';
    var T_STRING = 'string';
    var T_OBJECT = 'object';
    var T_UNDEF = 'undefined';
    var T_FUNCTION = 'function';
    var WIN = typeof window == T_UNDEF ? undefined : window;
    var SPECIAL_TAGS_REGEX = /^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?|opt(?:ion|group))$/;
    var RESERVED_WORDS_BLACKLIST = /^(?:_(?:item|id|parent)|update|root|(?:un)?mount|mixin|is(?:Mounted|Loop)|tags|parent|opts|trigger|o(?:n|ff|ne))$/;
    var SVG_TAGS_LIST = ['altGlyph', 'animate', 'animateColor', 'circle', 'clipPath', 'defs', 'ellipse', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feFlood', 'feGaussianBlur', 'feImage', 'feMerge', 'feMorphology', 'feOffset', 'feSpecularLighting', 'feTile', 'feTurbulence', 'filter', 'font', 'foreignObject', 'g', 'glyph', 'glyphRef', 'image', 'line', 'linearGradient', 'marker', 'mask', 'missing-glyph', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect', 'stop', 'svg', 'switch', 'symbol', 'text', 'textPath', 'tref', 'tspan', 'use'];
    var BOOL_ATTRS = /^(?:disabled|checked|readonly|required|allowfullscreen|auto(?:focus|play)|compact|controls|default|formnovalidate|hidden|ismap|itemscope|loop|multiple|muted|no(?:resize|shade|validate|wrap)?|open|reversed|seamless|selected|sortable|truespeed|typemustmatch)$/;
    var IE_VERSION = (WIN && WIN.document || {}).documentMode | 0;
    var FIREFOX = WIN && !!WIN.InstallTrigger;

    /**
     * Attach an event to a DOM node
     * @param { String } name - event name
     * @param { Function } handler - event callback
     * @param { Object } dom - dom node
     * @param { Tag } tag - tag instance
     */
    function setEventHandler(name, handler, dom, tag) {

      dom[name] = function (e) {

        var ptag = tag._parent,
            item = tag._item;

        if (!item) while (ptag && !item) {
          item = ptag._item;
          ptag = ptag._parent;
        }

        // cross browser event fix
        e = e || WIN.event;

        // override the event properties
        if (isWritable(e, 'currentTarget')) e.currentTarget = dom;
        if (isWritable(e, 'target')) e.target = e.srcElement;
        if (isWritable(e, 'which')) e.which = e.charCode || e.keyCode;

        e.item = item;

        handler.call(tag, e);

        if (!e.preventUpdate) {
          getImmediateCustomParentTag(tag).update();
        }
      };
    }

    /**
     * Update the expressions in a Tag instance
     * @param   { Array } expressions - expression that must be re evaluated
     * @param   { Tag } tag - tag instance
     */
    function update$1(expressions, tag) {

      each(expressions, function (expr, i) {

        var dom = expr.dom,
            attrName = expr.attr,
            value = tmpl(expr.expr, tag),
            parent = dom && dom.parentNode,
            isValueAttr = attrName == 'value';

        if (expr.bool) value = value ? attrName : false;else if (value == null) value = '';

        if (expr._riot_id) {
          // if it's a tag
          if (expr.isMounted) {
            expr.update();

            // if it hasn't been mounted yet, do that now.
          } else {
              expr.mount();

              if (expr.root.tagName == 'VIRTUAL') {
                var frag = document.createDocumentFragment();
                makeVirtual(expr, frag);
                expr.root.parentElement.replaceChild(frag, expr.root);
              }
            }
          return;
        }

        if (expr.update) {
          expr.update();
          return;
        }

        var old = expr.value;
        expr.value = value;

        if (expr.isRtag && value) return updateRtag(expr, tag);

        // no change, so nothing more to do
        if (isValueAttr && dom.value == value || // was the value of this dom node changed?
        !isValueAttr && old === value // was the old value still the same?
        ) return;

        // textarea and text nodes have no attribute name
        if (!attrName) {
          // about #815 w/o replace: the browser converts the value to a string,
          // the comparison by "==" does too, but not in the server
          value += '';
          // test for parent avoids error with invalid assignment to nodeValue
          if (parent) {
            if (parent.tagName === 'TEXTAREA') {
              parent.value = value; // #1113
              if (!IE_VERSION) dom.nodeValue = value; // #1625 IE throws here, nodeValue
            } // will be available on 'updated'
            else dom.nodeValue = value;
          }
          return;
        }

        // remove original attribute
        remAttr(dom, attrName);
        // event handler
        if (isFunction(value)) {
          setEventHandler(attrName, value, dom, tag);

          // show / hide
        } else if (/^(show|hide)$/.test(attrName)) {
            if (attrName == 'hide') value = !value;
            dom.style.display = value ? '' : 'none';

            // field value
          } else if (attrName == 'value') {
              dom.value = value;

              // <img src="{ expr }">
            } else if (startsWith(attrName, RIOT_PREFIX) && attrName != RIOT_TAG) {

                if (value) setAttr(dom, attrName.slice(RIOT_PREFIX.length), value);
              } else {
                // <select> <option selected={true}> </select>
                if (attrName == 'selected' && parent && /^(SELECT|OPTGROUP)$/.test(parent.nodeName) && value) parent.value = dom.value;

                if (expr.bool) {
                  dom[attrName] = value;
                  if (!value) return;
                }

                if (value === 0 || value && typeof value !== T_OBJECT) setAttr(dom, attrName, value);
              }
      });
    }

    /**
     * Update dynamically created riot-tag with changing expressions
     * @param   { Object } expr - expression tag and expression info
     * @param   { Tag } parent - parent for tag creation
     */

    function updateRtag(expr, parent) {
      var tagName = tmpl(expr.value, parent),
          conf;

      if (expr.tag && expr.tagName == tagName) {
        expr.tag.update();
        return;
      }

      // sync _parent to accommodate changing tagnames
      if (expr.tag) {
        var delName = expr.tag.opts.riotTag,
            tags = expr.tag._parent.tags[delName];

        if (isArray(tags)) tags.splice(tags.indexOf(expr.tag), 1);else delete expr.tag._parent.tags[delName];
      }

      expr.impl = __TAG_IMPL[tagName];
      conf = { root: expr.dom, parent: parent, hasImpl: true, tagName: tagName };
      expr.tag = initChildTag(expr.impl, conf, expr.dom.innerHTML, parent);
      expr.tagName = tagName;
      expr.tag.mount();
      expr.tag.update();
    }

    function IfExpr(dom, parentTag, expr) {
      remAttr(dom, 'if');
      this.parentTag = parentTag;
      this.expr = expr;
      this.stub = document.createTextNode('');
      this.pristine = dom;

      var p = dom.parentNode;
      p.insertBefore(this.stub, dom);
      p.removeChild(dom);
    }

    IfExpr.prototype.update = function () {
      var newValue = tmpl(this.expr, this.parentTag);

      if (newValue && !this.current) {
        // insert
        this.current = this.pristine.cloneNode(true);
        this.stub.parentNode.insertBefore(this.current, this.stub);

        this.expressions = [];
        parseExpressions(this.current, this.parentTag, this.expressions, true);
      } else if (!newValue && this.current) {
        // remove
        unmountAll(this.expressions);
        this.current.parentNode.removeChild(this.current);
        this.current = null;
        this.expressions = [];
      }

      if (newValue) update$1(this.expressions, this.parentTag);
    };

    IfExpr.prototype.unmount = function () {
      unmountAll(this.expressions || []);
      delete this.pristine;
      delete this.parentNode;
      delete this.stub;
    };

    function NamedExpr(dom, attrName, attrValue, parent) {
      this.dom = dom;
      this.attr = attrName;
      this.rawValue = attrValue;
      this.parent = parent;
      this.customParent = getImmediateCustomParentTag(parent);
      this.hasExp = tmpl.hasExpr(attrValue);
      this.firstRun = true;
    }

    NamedExpr.prototype.update = function () {
      var value = this.rawValue;
      if (this.hasExp) value = tmpl(this.rawValue, this.parent);

      // if nothing changed, we're done
      if (!this.firstRun && value === this.value) return;

      // if the named element is a custom tag, then we set the tag itself, rather than DOM
      var tagOrDom = this.tag || this.dom;

      // the name changed, so we need to remove it from the old key (if present)
      if (!isBlank(this.value)) arrayishRemove(this.customParent, this.value, tagOrDom);

      if (isBlank(value)) {
        // if the value is blank, we remove it
        remAttr(this.dom, this.attr);
      } else {
        // add it to the parent tag, and set the actual DOM attr
        arrayishAdd(this.customParent, value, tagOrDom);
        setAttr(this.dom, this.attr, value);
      }
      this.value = value;
      this.firstRun = false;
    };

    NamedExpr.prototype.unmount = function () {
      var tagOrDom = this.tag || this.dom;
      if (!isBlank(this.value)) arrayishRemove(this.customParent, this.value, tagOrDom);
      delete this.dom;
      delete this.parent;
      delete this.customParent;
    };

    /**
     * Convert the item looped into an object used to extend the child tag properties
     * @param   { Object } expr - object containing the keys used to extend the children tags
     * @param   { * } key - value to assign to the new object returned
     * @param   { * } val - value containing the position of the item in the array
     * @param   { Object } base - prototype object for the new item
     * @returns { Object } - new object containing the values of the original item
     *
     * The variables 'key' and 'val' are arbitrary.
     * They depend on the collection type looped (Array, Object)
     * and on the expression used on the each tag
     *
     */
    function mkitem(expr, key, val, base) {
      var item = base ? Object.create(base) : {};
      item[expr.key] = key;
      if (expr.pos) item[expr.pos] = val;
      return item;
    }

    /**
     * Unmount the redundant tags
     * @param   { Array } items - array containing the current items to loop
     * @param   { Array } tags - array containing all the children tags
     * @param   { String } tagName - key used to identify the type of tag
     * @param   { Object } parent - parent tag to remove the child from
     */
    function unmountRedundant(items, tags, tagName, parent) {

      var i = tags.length,
          j = items.length,
          t;

      while (i > j) {
        t = tags[--i];
        tags.splice(i, 1);
        t.unmount();
        arrayishRemove(parent.tags, tagName, t, true);
      }
    }

    /**
     * Move the nested custom tags in non custom loop tags
     * @param   { Object } child - non custom loop tag
     * @param   { Number } i - current position of the loop tag
     */
    function moveNestedTags(child, i) {
      Object.keys(child.tags).forEach(function (tagName) {
        var tag = child.tags[tagName];
        if (isArray(tag)) each(tag, function (t) {
          moveChildTag(t, tagName, i);
        });else moveChildTag(tag, tagName, i);
      });
    }

    /**
     * Manage tags having the 'each'
     * @param   { Object } dom - DOM node we need to loop
     * @param   { Tag } parent - parent tag instance where the dom node is contained
     * @param   { String } expr - string contained in the 'each' attribute
     * @returns { Object } expression object for this each loop
     */
    function _each(dom, parent, expr) {

      // remove the each property from the original tag
      remAttr(dom, 'each');

      var mustReorder = typeof getAttr(dom, 'no-reorder') !== T_STRING || remAttr(dom, 'no-reorder'),
          tagName = getTagName(dom),
          impl = __TAG_IMPL[tagName] || { tmpl: getOuterHTML(dom) },
          useRoot = SPECIAL_TAGS_REGEX.test(tagName),
          root = dom.parentNode,
          ref = document.createTextNode(''),
          child = getTag(dom),
          isOption = tagName.toLowerCase() === 'option',
          // the option tags must be treated differently
      tags = [],
          oldItems = [],
          hasKeys,
          isVirtual = dom.tagName == 'VIRTUAL';

      // parse the each expression
      expr = tmpl.loopKeys(expr);
      expr.isLoop = true;

      var ifExpr = getAttr(dom, 'if');
      if (ifExpr) remAttr(dom, 'if');

      // insert a marked where the loop tags will be injected
      root.insertBefore(ref, dom);
      root.removeChild(dom);

      expr.update = function updateEach() {
        // get the new items collection
        var items = tmpl(expr.val, parent),

        // create a fragment to hold the new DOM nodes to inject in the parent tag
        frag = document.createDocumentFragment();
        root = ref.parentNode;

        // object loop. any changes cause full redraw
        if (!isArray(items)) {
          hasKeys = items || false;
          items = hasKeys ? Object.keys(items).map(function (key) {
            return mkitem(expr, key, items[key]);
          }) : [];
        }

        if (ifExpr) {
          items = items.filter(function (item, i) {
            var context = mkitem(expr, item, i, parent);
            return !!tmpl(ifExpr, context);
          });
        }

        // loop all the new items
        items.forEach(function (item, i) {
          // reorder only if the items are objects

          var _mustReorder = mustReorder && typeof item == T_OBJECT && !hasKeys,
              oldPos = oldItems.indexOf(item),
              pos = ~oldPos && _mustReorder ? oldPos : i,

          // does a tag exist in this position?
          tag = tags[pos],
              domToInsert;

          item = !hasKeys && expr.key ? mkitem(expr, item, i) : item;

          // new tag
          if (!_mustReorder && !tag // with no-reorder we just update the old tags
           || _mustReorder && ! ~oldPos || !tag // by default we always try to reorder the DOM elements
          ) {

              tag = new Tag(impl, {
                parent: parent,
                isLoop: true,
                hasImpl: !!__TAG_IMPL[tagName],
                root: useRoot ? root : dom.cloneNode(),
                item: item
              }, dom.innerHTML);

              tag.mount();
              domToInsert = tag.root;
              // this tag must be appended
              if (i == tags.length) {
                if (isVirtual) makeVirtual(tag, frag);else frag.appendChild(domToInsert);
              }
              // this tag must be insert
              else {
                  if (isVirtual) makeVirtual(tag, root, tags[i]);else root.insertBefore(domToInsert, tags[i].root);
                  oldItems.splice(i, 0, item);
                }

              tags.splice(i, 0, tag);
              if (child) arrayishAdd(parent.tags, tagName, tag, true);
              pos = i; // handled here so no move
            } else tag.update(item);

          // reorder the tag if it's not located in its previous position
          if (pos !== i && _mustReorder) {
            // update the DOM
            if (isVirtual) moveVirtual(tag, root, tags[i]);else root.insertBefore(tag.root, tags[i].root);
            // update the position attribute if it exists
            if (expr.pos) tag[expr.pos] = i;
            // move the old tag instance
            tags.splice(i, 0, tags.splice(pos, 1)[0]);
            // move the old item
            oldItems.splice(i, 0, oldItems.splice(pos, 1)[0]);
            // if the loop tags are not custom
            // we need to move all their custom tags into the right position
            if (!child && tag.tags) moveNestedTags(tag, i);
          }

          // cache the original item to use it in the events bound to this node
          // and its children
          tag._item = item;
          // cache the real parent tag internally
          defineProperty(tag, '_parent', parent);
        });

        // remove the redundant tags
        unmountRedundant(items, tags, tagName, parent);

        // insert the new nodes
        if (isOption) {
          root.appendChild(frag);

          // #1374 FireFox bug in <option selected={expression}>
          if (FIREFOX && !root.multiple) {
            for (var n = 0; n < root.length; n++) {
              if (root[n].__riot1374) {
                root.selectedIndex = n; // clear other options
                delete root[n].__riot1374;
                break;
              }
            }
          }
        } else root.insertBefore(frag, ref);

        // clone the items array
        oldItems = items.slice();
      };

      expr.unmount = function () {
        each(tags, function (t) {
          t.unmount();
        });
      };

      return expr;
    }

    function parseExpressions(root, tag, expressions, includeRoot) {
      var base = { parent: { children: expressions } };

      walk(root, function (dom, ctx) {
        var type = dom.nodeType,
            parent = ctx.parent,
            attr,
            expr,
            childTag;

        // text node
        if (type == 3 && dom.parentNode.tagName != 'STYLE' && tmpl.hasExpr(dom.nodeValue)) parent.children.push({ dom: dom, expr: dom.nodeValue });

        if (type != 1) return ctx; // not an element

        // loop. each does it's own thing (for now)
        if (attr = getAttr(dom, 'each')) {
          parent.children.push(_each(dom, tag, attr));
          return false;
        }

        // if-attrs become the new parent. Any following expressions (either on the current
        // element, or below it) become children of this expression.
        if (attr = getAttr(dom, 'if')) {
          parent.children.push(new IfExpr(dom, tag, attr));
          return false;
        }

        // attribute expressions
        var allAttrs = [],
            nameExps = [];
        each(dom.attributes, function (attr) {
          var name = attr.name,
              bool = BOOL_ATTRS.test(name);
          var hasExp = tmpl.hasExpr(attr.value);

          if (name === 'name' || name === 'id') {
            expr = new NamedExpr(dom, name, attr.value, tag);
            parent.children.push(expr);
            nameExps.push(expr);
            allAttrs.push(expr);
            return;
          }

          expr = { dom: dom, expr: attr.value, attr: attr.name, bool: bool };
          allAttrs.push(expr); // stores all attributes, even without expressions

          if (!hasExp) return; // no expressions here
          parent.children.push(expr);
          if (bool) {
            remAttr(dom, name);return false;
          }
        });

        if (expr = getAttr(dom, RIOT_TAG)) {
          if (tmpl.hasExpr(expr)) {
            attr = { isRtag: true, expr: expr, dom: dom, children: [] };
            parent.children.push(attr);
            parent = attr;
          }
        }

        // if this is a tag, stop traversing here.
        // we ignore the root, since parseExpressions is called while we're mounting that root
        var tagImpl = getTag(dom);
        if (tagImpl && (dom !== root || includeRoot)) {
          var conf = { root: dom, parent: tag, hasImpl: true, ownAttrs: allAttrs };
          childTag = initChildTag(tagImpl, conf, dom.innerHTML, tag);

          parent.children.push(childTag);
          each(nameExps, function (ex) {
            ex.tag = childTag;
          });
          return false;
        }

        // whatever the parent is, all child elements get the same parent.
        // If this element had an if-attr, that's the parent for all child elements
        return { parent: parent };
      }, base);
    }

    var reHasYield = /<yield\b/i;
    var reYieldAll = /<yield\s*(?:\/>|>([\S\s]*?)<\/yield\s*>|>)/ig;
    var reYieldSrc = /<yield\s+to=['"]([^'">]*)['"]\s*>([\S\s]*?)<\/yield\s*>/ig;
    var reYieldDest = /<yield\s+from=['"]?([-\w]+)['"]?\s*(?:\/>|>([\S\s]*?)<\/yield\s*>)/ig;
    var rootEls = { tr: 'tbody', th: 'tr', td: 'tr', col: 'colgroup' };
    var tblTags = IE_VERSION && IE_VERSION < 10 ? SPECIAL_TAGS_REGEX : /^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?)$/;
    var GENERIC = 'div';
    /*
      Creates the root element for table or select child elements:
      tr/th/td/thead/tfoot/tbody/caption/col/colgroup/option/optgroup
    */
    function specialTags(el, templ, tagName) {

      var select = tagName[0] === 'o',
          parent = select ? 'select>' : 'table>';

      // trim() is important here, this ensures we don't have artifacts,
      // so we can check if we have only one element inside the parent
      el.innerHTML = '<' + parent + templ.trim() + '</' + parent;
      parent = el.firstChild;

      // returns the immediate parent if tr/th/td/col is the only element, if not
      // returns the whole tree, as this can include additional elements
      if (select) {
        parent.selectedIndex = -1; // for IE9, compatible w/current riot behavior
      } else {
          // avoids insertion of cointainer inside container (ex: tbody inside tbody)
          var tname = rootEls[tagName];
          if (tname && parent.childElementCount === 1) parent = $(tname, parent);
        }
      return parent;
    }

    /*
      Replace the yield tag from any tag template with the innerHTML of the
      original tag in the page
    */
    function replaceYield(templ, html) {
      // do nothing if no yield
      if (!reHasYield.test(templ)) return templ;

      // be careful with #1343 - string on the source having `$1`
      var src = {};

      html = html && html.replace(reYieldSrc, function (_, ref, text) {
        src[ref] = src[ref] || text; // preserve first definition
        return '';
      }).trim();

      return templ.replace(reYieldDest, function (_, ref, def) {
        // yield with from - to attrs
        return src[ref] || def || '';
      }).replace(reYieldAll, function (_, def) {
        // yield without any "from"
        return html || def || '';
      });
    }

    /**
     * Creates a DOM element to wrap the given content. Normally an `DIV`, but can be
     * also a `TABLE`, `SELECT`, `TBODY`, `TR`, or `COLGROUP` element.
     *
     * @param   {string} templ  - The template coming from the custom tag definition
     * @param   {string} [html] - HTML content that comes from the DOM element where you
     *           will mount the tag, mostly the original tag in the page
     * @returns {HTMLElement} DOM element with _templ_ merged through `YIELD` with the _html_.
     */
    function mkdom(templ, html) {
      var match = templ && templ.match(/^\s*<([-\w]+)/),
          tagName = match && match[1].toLowerCase(),
          el = mkEl(GENERIC, isSVGTag(tagName));

      // replace all the yield tags with the tag inner html
      templ = replaceYield(templ, html);

      /* istanbul ignore next */
      if (tblTags.test(tagName)) el = specialTags(el, templ, tagName);else setInnerHTML(el, templ);

      el.stub = true;

      return el;
    }

    // counter to give a unique id to all the Tag instances
    var __uid = 0;

    function Tag(impl, conf, innerHTML) {

      var self = observable(this),
          opts = inherit(conf.opts) || {},
          parent = conf.parent,
          isLoop = conf.isLoop,
          hasImpl = conf.hasImpl,
          ownAttrs = conf.ownAttrs,
          // attributes on this tag (evaluated in parent context)
      item = cleanUpData(conf.item),
          expressions = [],
          root = conf.root,
          tagName = conf.tagName || root.tagName.toLowerCase(),
          attr = {},
          propsInSyncWithParent = [],
          dom;

      // only call unmount if we have a valid __TAG_IMPL (has name property)
      if (impl.name && root._tag) root._tag.unmount(true);

      // not yet mounted
      this.isMounted = false;
      root.isLoop = isLoop;
      this._hasImpl = hasImpl;

      // create a unique id to this tag
      // it could be handy to use it also to improve the virtual dom rendering speed
      defineProperty(this, '_riot_id', ++__uid); // base 1 allows test !t._riot_id

      extend(this, { parent: parent, root: root, opts: opts }, item);
      // protect the "tags" property from being overridden
      defineProperty(this, 'tags', {});

      // grab attributes
      each(root.attributes, function (el) {
        var val = el.value;
        // remember attributes with expressions only
        if (tmpl.hasExpr(val)) attr[el.name] = val;
      });

      dom = mkdom(impl.tmpl, innerHTML);

      // options
      function updateOpts() {
        var ctx = hasImpl && isLoop ? self : parent || self;

        // If we're nested beneath another tag, then our attributes are evaluated
        // in that parent context. Here, we copy them onto opts.
        if (ownAttrs) {
          each(ownAttrs || [], function (expr) {
            // if the attribute doesn't actually have an expression, there
            // won't be a value. Just use the string itself in this case.
            var v = expr.hasOwnProperty('value') ? expr.value : expr.expr;
            opts[toCamel(expr.attr)] = v;
          });
        } else {
          each(root.attributes, function (el) {
            var val = el.value,
                hasTmpl = tmpl.hasExpr(val);
            if (hasTmpl && ownAttrs) return; // already handled above
            opts[toCamel(el.name)] = hasTmpl ? tmpl(val, ctx) : val;
          });
        }
      }

      function normalizeData(data) {
        for (var key in item) {
          if (typeof self[key] !== T_UNDEF && isWritable(self, key)) self[key] = data[key];
        }
      }

      function inheritFromParent() {
        each(Object.keys(self.parent), function (k) {
          // some properties must be always in sync with the parent tag
          var mustSync = !RESERVED_WORDS_BLACKLIST.test(k) && contains(propsInSyncWithParent, k);
          if (typeof self[k] === T_UNDEF || mustSync) {
            // track the property to keep in sync
            // so we can keep it updated
            if (!mustSync) propsInSyncWithParent.push(k);
            self[k] = self.parent[k];
          }
        });
      }

      /**
       * Update the tag expressions and options
       * @param   { * }  data - data we want to use to extend the tag properties
       * @returns { self }
       */
      defineProperty(this, 'update', function tagUpdate(data) {
        if (isFunction(self.shouldUpdate) && !self.shouldUpdate()) return;

        // make sure the data passed will not override
        // the component core methods
        data = cleanUpData(data);
        // inherit properties from the parent, but only for anonymous tags
        if (isLoop && !hasImpl) inheritFromParent();
        // normalize the tag properties in case an item object was initially passed
        if (data && isObject(item)) {
          normalizeData(data);
          item = data;
        }
        extend(self, data);
        updateOpts();
        if (self.isMounted) self.trigger('update', data);
        update$1(expressions, self);
        if (self.isMounted) self.trigger('updated');

        return this;
      });

      defineProperty(this, 'mixin', function tagMixin() {
        each(arguments, function (mix) {
          var instance;

          mix = typeof mix === T_STRING ? mixin(mix) : mix;

          // check if the mixin is a function
          if (isFunction(mix)) {
            // create the new mixin instance
            instance = new mix();
            // save the prototype to loop it afterwards
            mix = mix.prototype;
          } else instance = mix;

          // loop the keys in the function prototype or the all object keys
          each(Object.getOwnPropertyNames(mix), function (key) {
            // bind methods to self
            if (key != 'init') self[key] = isFunction(instance[key]) ? instance[key].bind(self) : instance[key];
          });

          // init method will be called automatically
          if (instance.init) instance.init.bind(self)();
        });
        return this;
      });

      defineProperty(this, 'mount', function tagMount(forceUpdate) {

        updateOpts();

        // keep a reference to the tag just created
        // so we will be able to mount this tag multiple times
        root._tag = this;

        // add global mixin
        var globalMixin = mixin(GLOBAL_MIXIN);
        if (globalMixin) for (var i in globalMixin) {
          if (globalMixin.hasOwnProperty(i)) self.mixin(globalMixin[i]);
        } // initialiation
        if (impl.fn) impl.fn.call(self, opts);

        // update the root adding custom attributes coming from the compiler
        // it fixes also #1087
        if (impl.attrs) walkAttributes(impl.attrs, function (k, v) {
          setAttr(root, k, v);
        });
        if (impl.attrs || hasImpl) parseExpressions(self.root, self, expressions);

        // parse layout after init. fn may calculate args for nested custom tags
        parseExpressions(dom, self, expressions);

        self.update(item);

        // internal use only, fixes #403
        self.trigger('before-mount');

        if (isLoop && !hasImpl) {
          // update the root attribute for the looped elements
          self.root = root = dom.firstChild;
        } else {
          while (dom.firstChild) {
            root.appendChild(dom.firstChild);
          }if (root.stub) self.root = root = parent.root;
        }

        defineProperty(self, 'root', root);
        self.isMounted = true;

        // if it's not a child tag we can trigger its mount event
        if (!self.parent || self.parent.isMounted) {
          self.trigger('mount');
        }
        // otherwise we need to wait that the parent event gets triggered
        else self.parent.one('mount', function () {
            // avoid to trigger the `mount` event for the tags
            // not visible included in an if statement
            if (!isInStub(self.root)) {
              self.trigger('mount');
            }
          });
      });

      defineProperty(this, 'unmount', function tagUnmount(keepRootTag) {
        var el = self.root,
            p = el.parentNode,
            ptag,
            tagIndex = __VIRTUAL_DOM.indexOf(self);

        self.trigger('before-unmount');

        // remove this tag instance from the global virtualDom variable
        if (~tagIndex) __VIRTUAL_DOM.splice(tagIndex, 1);

        if (p) {

          if (parent) {
            ptag = getImmediateCustomParentTag(parent);
            arrayishRemove(ptag.tags, tagName, self);
          } else while (el.firstChild) {
            el.removeChild(el.firstChild);
          }if (!keepRootTag) p.removeChild(el);else {
            // the riot-tag and the data-is attributes aren't needed anymore, remove them
            remAttr(p, RIOT_TAG_IS);
            remAttr(p, RIOT_TAG); // this will be removed in riot 3.0.0
          }
        }

        if (this._virts) {
          each(this._virts, function (v) {
            if (v.parentNode) v.parentNode.removeChild(v);
          });
        }

        // allow expressions to unmount themselves
        unmountAll(expressions);

        self.trigger('unmount');
        self.off('*');
        self.isMounted = false;
        delete self.root._tag;
      });
    }

    /**
     * Specialized function for looping an array-like collection with `each={}`
     * @param   { Array } els - collection of items
     * @param   {Function} fn - callback function
     * @returns { Array } the array looped
     */
    function each(els, fn) {
      var len = els ? els.length : 0;

      for (var i = 0, el; i < len; i++) {
        el = els[i];
        // return false -> current item was removed by fn during the loop
        if (el != null && fn(el, i) === false) i--;
      }
      return els;
    }

    /**
     * Detect if the argument passed is a function
     * @param   { * } v - whatever you want to pass to this function
     * @returns { Boolean } -
     */
    function isFunction(v) {
      return typeof v === T_FUNCTION || false; // avoid IE problems
    }

    /**
     * Get the outer html of any DOM node SVGs included
     * @param   { Object } el - DOM node to parse
     * @returns { String } el.outerHTML
     */
    function getOuterHTML(el) {
      if (el.outerHTML) return el.outerHTML;
      // some browsers do not support outerHTML on the SVGs tags
      else {
          var container = mkEl('div');
          container.appendChild(el.cloneNode(true));
          return container.innerHTML;
        }
    }

    /**
     * Set the inner html of any DOM node SVGs included
     * @param { Object } container - DOM node where we will inject the new html
     * @param { String } html - html to inject
     */
    function setInnerHTML(container, html) {
      if (typeof container.innerHTML != T_UNDEF) container.innerHTML = html;
      // some browsers do not support innerHTML on the SVGs tags
      else {
          var doc = new DOMParser().parseFromString(html, 'application/xml');
          container.appendChild(container.ownerDocument.importNode(doc.documentElement, true));
        }
    }

    /**
     * Checks wether a DOM node must be considered part of an svg document
     * @param   { String }  name - tag name
     * @returns { Boolean } -
     */
    function isSVGTag(name) {
      return ~SVG_TAGS_LIST.indexOf(name);
    }

    /**
     * Detect if the argument passed is an object, exclude null.
     * NOTE: Use isObject(x) && !isArray(x) to excludes arrays.
     * @param   { * } v - whatever you want to pass to this function
     * @returns { Boolean } -
     */
    function isObject(v) {
      return v && typeof v === T_OBJECT; // typeof null is 'object'
    }

    /**
     * Detect if a value is empty. Different from falsy, because we dont consider 0 or false to be blank
     * @param { * } v - value to check
     * @returns { Boolean } -
     */
    function isBlank(v) {
      return typeof v === T_UNDEF || v === null || v === '';
    }

    /**
     * Remove any DOM attribute from a node
     * @param   { Object } dom - DOM node we want to update
     * @param   { String } name - name of the property we want to remove
     */
    function remAttr(dom, name) {
      dom.removeAttribute(name);
    }

    /**
     * Convert a string containing dashes to camel case
     * @param   { String } string - input string
     * @returns { String } my-string -> myString
     */
    function toCamel(string) {
      return string.replace(/-(\w)/g, function (_, c) {
        return c.toUpperCase();
      });
    }

    /**
     * Get the value of any DOM attribute on a node
     * @param   { Object } dom - DOM node we want to parse
     * @param   { String } name - name of the attribute we want to get
     * @returns { String | undefined } name of the node attribute whether it exists
     */
    function getAttr(dom, name) {
      return dom.getAttribute(name);
    }

    /**
     * Set any DOM attribute
     * @param { Object } dom - DOM node we want to update
     * @param { String } name - name of the property we want to set
     * @param { String } val - value of the property we want to set
     */
    function setAttr(dom, name, val) {
      dom.setAttribute(name, val);
    }

    /**
     * Detect the tag implementation by a DOM node
     * @param   { Object } dom - DOM node we need to parse to get its tag implementation
     * @returns { Object } it returns an object containing the implementation of a custom tag (template and boot function)
     */
    function getTag(dom) {
      return dom.tagName && __TAG_IMPL[getAttr(dom, RIOT_TAG_IS) || getAttr(dom, RIOT_TAG) || dom.tagName.toLowerCase()];
    }

    /**
     * Move the position of a custom tag in its parent tag
     * @param   { Object } tag - child tag instance
     * @param   { String } tagName - key where the tag was stored
     * @param   { Number } newPos - index where the new tag will be stored
     */
    function moveChildTag(tag, tagName, newPos) {
      var parent = tag.parent,
          tags;
      // no parent no move
      if (!parent) return;

      tags = parent.tags[tagName];

      if (isArray(tags)) tags.splice(newPos, 0, tags.splice(tags.indexOf(tag), 1)[0]);else arrayishAdd(parent.tags, tagName, tag);
    }

    /**
     * Create a new child tag including it correctly into its parent
     * @param   { Object } child - child tag implementation
     * @param   { Object } opts - tag options containing the DOM node where the tag will be mounted
     * @param   { String } innerHTML - inner html of the child node
     * @param   { Object } parent - instance of the parent tag including the child custom tag
     * @param   { Boolean } skipName - hack to ignore the name attribute when attaching to parent
     * @returns { Object } instance of the new child tag just created
     */
    function initChildTag(child, opts, innerHTML, parent) {
      var tag = new Tag(child, opts, innerHTML),
          tagName = opts.tagName || getTagName(opts.root, true),
          ptag = getImmediateCustomParentTag(parent);
      // fix for the parent attribute in the looped elements
      tag.parent = ptag;
      // store the real parent tag
      // in some cases this could be different from the custom parent tag
      // for example in nested loops
      tag._parent = parent;

      // add this tag to the custom parent tag
      arrayishAdd(ptag.tags, tagName, tag);

      // and also to the real parent tag
      if (ptag !== parent) arrayishAdd(parent.tags, tagName, tag);

      // empty the child node once we got its template
      // to avoid that its children get compiled multiple times
      opts.root.innerHTML = '';

      return tag;
    }

    /**
     * Loop backward all the parents tree to detect the first custom parent tag
     * @param   { Object } tag - a Tag instance
     * @returns { Object } the instance of the first custom parent tag found
     */
    function getImmediateCustomParentTag(tag) {
      var ptag = tag;
      while (!ptag._hasImpl) {
        if (!ptag.parent) break;
        ptag = ptag.parent;
      }
      return ptag;
    }

    function unmountAll(expressions) {
      var i,
          expl = expressions.length,
          expr;
      for (i = 0; i < expl; i++) {
        expr = expressions[i];
        if (expr instanceof Tag) expr.unmount(true);else if (expr.unmount) expr.unmount();
      }
    }

    /**
     * Helper function to set an immutable property
     * @param   { Object } el - object where the new property will be set
     * @param   { String } key - object key where the new property will be stored
     * @param   { * } value - value of the new property
    * @param   { Object } options - set the propery overriding the default options
     * @returns { Object } - the initial object
     */
    function defineProperty(el, key, value, options) {
      Object.defineProperty(el, key, extend({
        value: value,
        enumerable: false,
        writable: false,
        configurable: true
      }, options));
      return el;
    }

    /**
     * Get the tag name of any DOM node
     * @param   { Object } dom - DOM node we want to parse
     * @param   { Boolean } skipName - hack to ignore the name attribute when attaching to parent
     * @returns { String } name to identify this dom node in riot
     */
    function getTagName(dom, skipName) {
      var child = getTag(dom),
          namedTag = !skipName && getAttr(dom, 'name'),
          tagName = namedTag && !tmpl.hasExpr(namedTag) ? namedTag : child ? child.name : dom.tagName.toLowerCase();

      return tagName;
    }

    /**
     * Extend any object with other properties
     * @param   { Object } src - source object
     * @returns { Object } the resulting extended object
     *
     * var obj = { foo: 'baz' }
     * extend(obj, {bar: 'bar', foo: 'bar'})
     * console.log(obj) => {bar: 'bar', foo: 'bar'}
     *
     */
    function extend(src) {
      var obj,
          args = arguments;
      for (var i = 1; i < args.length; ++i) {
        if (obj = args[i]) {
          for (var key in obj) {
            // check if this property of the source object could be overridden
            if (isWritable(src, key)) src[key] = obj[key];
          }
        }
      }
      return src;
    }

    /**
     * Check whether an array contains an item
     * @param   { Array } arr - target array
     * @param   { * } item - item to test
     * @returns { Boolean } Does 'arr' contain 'item'?
     */
    function contains(arr, item) {
      return ~arr.indexOf(item);
    }

    /**
     * Check whether an object is a kind of array
     * @param   { * } a - anything
     * @returns {Boolean} is 'a' an array?
     */
    function isArray(a) {
      return Array.isArray(a) || a instanceof Array;
    }

    /**
     * Detect whether a property of an object could be overridden
     * @param   { Object }  obj - source object
     * @param   { String }  key - object property
     * @returns { Boolean } is this property writable?
     */
    function isWritable(obj, key) {
      var props = Object.getOwnPropertyDescriptor(obj, key);
      return typeof obj[key] === T_UNDEF || props && props.writable;
    }

    /**
     * With this function we avoid that the internal Tag methods get overridden
     * @param   { Object } data - options we want to use to extend the tag instance
     * @returns { Object } clean object without containing the riot internal reserved words
     */
    function cleanUpData(data) {
      if (!(data instanceof Tag) && !(data && typeof data.trigger == T_FUNCTION)) return data;

      var o = {};
      for (var key in data) {
        if (!RESERVED_WORDS_BLACKLIST.test(key)) o[key] = data[key];
      }
      return o;
    }

    /**
     * Walk down recursively all the children tags starting dom node
     * @param   { Object }   dom - starting node where we will start the recursion
     * @param   { Function } fn - callback to transform the child node just found
     * @param   { Object }   context - fn can optionally return an object, which is passed to children
     */
    function walk(dom, fn, context) {
      if (dom) {
        var res = fn(dom, context),
            next;
        // stop the recursion
        if (res === false) return;else {
          dom = dom.firstChild;

          while (dom) {
            next = dom.nextSibling;
            walk(dom, fn, res);
            dom = next;
          }
        }
      }
    }

    /**
     * Minimize risk: only zero or one _space_ between attr & value
     * @param   { String }   html - html string we want to parse
     * @param   { Function } fn - callback function to apply on any attribute found
     */
    function walkAttributes(html, fn) {
      var m,
          re = /([-\w]+) ?= ?(?:"([^"]*)|'([^']*)|({[^}]*}))/g;

      while (m = re.exec(html)) {
        fn(m[1].toLowerCase(), m[2] || m[3] || m[4]);
      }
    }

    /**
     * Check whether a DOM node is in stub mode, useful for the riot 'if' directive
     * @param   { Object }  dom - DOM node we want to parse
     * @returns { Boolean } -
     */
    function isInStub(dom) {
      while (dom) {
        if (dom.inStub) return true;
        dom = dom.parentNode;
      }
      return false;
    }

    /**
     * Create a generic DOM node
     * @param   { String } name - name of the DOM node we want to create
     * @param   { Boolean } isSvg - should we use a SVG as parent node?
     * @returns { Object } DOM node just created
     */
    function mkEl(name, isSvg) {
      return isSvg ? document.createElementNS('http://www.w3.org/2000/svg', 'svg') : document.createElement(name);
    }

    /**
     * Shorter and fast way to select multiple nodes in the DOM
     * @param   { String } selector - DOM selector
     * @param   { Object } ctx - DOM node where the targets of our search will is located
     * @returns { Object } dom nodes found
     */
    function $$(selector, ctx) {
      return (ctx || document).querySelectorAll(selector);
    }

    /**
     * Shorter and fast way to select a single node in the DOM
     * @param   { String } selector - unique dom selector
     * @param   { Object } ctx - DOM node where the target of our search will is located
     * @returns { Object } dom node found
     */
    function $(selector, ctx) {
      return (ctx || document).querySelector(selector);
    }

    /**
     * Simple object prototypal inheritance
     * @param   { Object } parent - parent object
     * @returns { Object } child instance
     */
    function inherit(parent) {
      function Child() {}
      Child.prototype = parent;
      return new Child();
    }

    /**
     * Set the property of an object for a given key. If something already
     * exists there, then it becomes an array containing both the old and new value.
     * @param { Object } obj - object on which to set the property
     * @param { String } key - property name
     * @param { Object } value - the value of the property to be set
     * @param { Boolean } ensureArray - ensure that the property remains an array
     */
    function arrayishAdd(obj, key, value, ensureArray) {
      var dest = obj[key];
      var isArr = isArray(dest);

      if (dest && dest === value) return;

      // if the key was never set, set it once
      if (!dest && ensureArray) obj[key] = [value];else if (!dest) obj[key] = value;
      // if it was an array and not yet set
      else if (!isArr || isArr && !contains(dest, value)) {
          if (isArr) dest.push(value);else obj[key] = [dest, value];
        }
    }

    /**
     * Removes an item from an object at a given key. If the key points to an array,
     * then the item is just removed from the array.
     * @param { Object } obj - object on which to remove the property
     * @param { String } key - property name
     * @param { Object } value - the value of the property to be removed
     * @param { Boolean } ensureArray - ensure that the property remains an array
    */
    function arrayishRemove(obj, key, value, ensureArray) {
      if (isArray(obj[key])) {
        each(obj[key], function (item, i) {
          if (item === value) obj[key].splice(i, 1);
        });
        if (!obj[key].length) delete obj[key];else if (obj[key].length == 1 && !ensureArray) obj[key] = obj[key][0];
      } else delete obj[key]; // otherwise just delete the key
    }

    /**
     * Faster String startsWith alternative
     * @param   { String } src - source string
     * @param   { String } str - test string
     * @returns { Boolean } -
     */
    function startsWith(src, str) {
      return src.slice(0, str.length) === str;
    }

    /**
     * Mount a tag creating new Tag instance
     * @param   { Object } root - dom node where the tag will be mounted
     * @param   { String } tagName - name of the riot tag we want to mount
     * @param   { Object } opts - options to pass to the Tag instance
     * @returns { Tag } a new Tag instance
     */
    function mountTo(root, tagName, opts) {
      var tag = __TAG_IMPL[tagName],

      // cache the inner HTML to fix #855
      innerHTML = root._innerHTML = root._innerHTML || root.innerHTML;

      // clear the inner html
      root.innerHTML = '';

      var conf = { root: root, opts: opts };
      if (opts && opts.parent) conf.parent = opts.parent;
      if (tag && root) tag = new Tag(tag, conf, innerHTML);

      if (tag && tag.mount) {
        tag.mount(true);
        // add this tag to the virtualDom variable
        if (!contains(__VIRTUAL_DOM, tag)) __VIRTUAL_DOM.push(tag);
      }

      return tag;
    }

    /**
     * Adds the elements for a virtual tag
     * @param { Tag } tag - the tag whose root's children will be inserted or appended
     * @param { Node } src - the node that will do the inserting or appending
     * @param { Tag } target - only if inserting, insert before this tag's first child
     */
    function makeVirtual(tag, src, target) {
      var head = document.createTextNode(''),
          tail = document.createTextNode(''),
          sib,
          el;
      tag._head = tag.root.insertBefore(head, tag.root.firstChild);
      tag._tail = tag.root.appendChild(tail);
      el = tag._head;
      tag._virts = [];
      while (el) {
        sib = el.nextSibling;
        if (target) src.insertBefore(el, target._head);else src.appendChild(el);

        tag._virts.push(el); // hold for unmounting
        el = sib;
      }
    }

    /**
     * Move virtual tag and all child nodes
     * @param { Tag } tag - first child reference used to start move
     * @param { Node } src  - the node that will do the inserting
     * @param { Tag } target - insert before this tag's first child
     */
    function moveVirtual(tag, src, target) {
      var el = tag._head,
          sib;
      while (el) {
        sib = el.nextSibling;
        src.insertBefore(el, target._head);
        el = sib;
        if (el == tag._tail) {
          src.insertBefore(el, target._head);
          break;
        }
      }
    }

    var styleNode;
    var cssTextProp;
    var stylesToInject = '';
    // skip the following code on the server
    if (WIN) {
      styleNode = function () {
        // create a new style element with the correct type
        var newNode = mkEl('style');
        setAttr(newNode, 'type', 'text/css');

        // replace any user node or insert the new one into the head
        var userNode = $('style[type=riot]');
        if (userNode) {
          if (userNode.id) newNode.id = userNode.id;
          userNode.parentNode.replaceChild(newNode, userNode);
        } else document.getElementsByTagName('head')[0].appendChild(newNode);

        return newNode;
      }();
      cssTextProp = styleNode.styleSheet;
    }

    /**
     * Object that will be used to inject and manage the css of every tag instance
     */
    var styleManager = {
      styleNode: styleNode,
      /**
       * Save a tag style to be later injected into DOM
       * @param   { String } css [description]
       */
      add: function add(css) {
        if (WIN) stylesToInject += css;
      },
      /**
       * Inject all previously saved tag styles into DOM
       * innerHTML seems slow: http://jsperf.com/riot-insert-style
       */
      inject: function inject() {
        if (stylesToInject && WIN) {
          if (cssTextProp) cssTextProp.cssText += stylesToInject;else styleNode.innerHTML += stylesToInject;
          stylesToInject = '';
        }
      }
    };

    /**
     * Riot public api
     */

    var observable$1 = observable;

    // export the brackets.settings
    var settings = brackets.settings;
    // share methods for other riot parts, e.g. compiler
    var util = {
      tmpl: tmpl,
      brackets: brackets,
      styleNode: styleManager.styleNode
    };

    /**
     * Create a mixin that could be globally shared across all the tags
     */
    var mixin = function () {
      var mixins = {},
          globals = mixins[GLOBAL_MIXIN] = {},
          _id = 0;

      /**
       * Create/Return a mixin by its name
       * @param   { String }  name - mixin name (global mixin if object)
       * @param   { Object }  mix - mixin logic
       * @param   { Boolean } g - is global?
       * @returns { Object }  the mixin logic
       */
      return function (name, mix, g) {
        // Unnamed global
        if (isObject(name)) {
          mixin('__unnamed_' + _id++, name, true);
          return;
        }

        var store = g ? globals : mixins;

        // Getter
        if (!mix) {
          if (typeof store[name] === T_UNDEF) {
            throw new Error('Unregistered mixin: ' + name);
          }
          return store[name];
        }
        // Setter
        if (isFunction(mix)) {
          extend(mix.prototype, store[name] || {});
          store[name] = mix;
        } else {
          store[name] = extend(store[name] || {}, mix);
        }
      };
    }();

    /**
     * Create a new riot tag implementation
     * @param   { String }   name - name/id of the new riot tag
     * @param   { String }   tmpl - tag template
     * @param   { String }   css - custom tag css
     * @param   { String }   attrs - root tag attributes
     * @param   { Function } fn - user function
     * @returns { String } name/id of the tag just created
     */
    function tag(name, tmpl, css, attrs, fn) {
      if (isFunction(attrs)) {
        fn = attrs;
        if (/^[\w\-]+\s?=/.test(css)) {
          attrs = css;
          css = '';
        } else attrs = '';
      }
      if (css) {
        if (isFunction(css)) fn = css;else styleManager.add(css);
      }
      name = name.toLowerCase();
      __TAG_IMPL[name] = { name: name, tmpl: tmpl, attrs: attrs, fn: fn };
      return name;
    }

    /**
     * Export the Tag constructor
     * TODO: make a better tag constructor
     */
    // export function Tag() {}

    /**
     * Create a new riot tag implementation (for use by the compiler)
     * @param   { String }   name - name/id of the new riot tag
     * @param   { String }   tmpl - tag template
     * @param   { String }   css - custom tag css
     * @param   { String }   attrs - root tag attributes
     * @param   { Function } fn - user function
     * @returns { String } name/id of the tag just created
     */
    function tag2(name, tmpl, css, attrs, fn) {
      if (css) styleManager.add(css);
      //if (bpair) riot.settings.brackets = bpair
      __TAG_IMPL[name] = { name: name, tmpl: tmpl, attrs: attrs, fn: fn };
      return name;
    }

    /**
     * Mount a tag using a specific tag implementation
     * @param   { String } selector - tag DOM selector
     * @param   { String } tagName - tag implementation name
     * @param   { Object } opts - tag logic
     * @returns { Array } new tags instances
     */
    function mount$1(selector, tagName, opts) {

      var els,
          allTags,
          tags = [];

      // helper functions

      function addRiotTags(arr) {
        var list = '';
        each(arr, function (e) {
          if (!/[^-\w]/.test(e)) {
            e = e.trim().toLowerCase();
            list += ',[' + RIOT_TAG_IS + '="' + e + '"],[' + RIOT_TAG + '="' + e + '"]';
          }
        });
        return list;
      }

      function selectAllTags() {
        var keys = Object.keys(__TAG_IMPL);
        return keys + addRiotTags(keys);
      }

      function pushTags(root) {
        if (root.tagName) {
          var riotTag = getAttr(root, RIOT_TAG_IS) || getAttr(root, RIOT_TAG);

          // have tagName? force riot-tag to be the same
          if (tagName && riotTag !== tagName) {
            riotTag = tagName;
            setAttr(root, RIOT_TAG_IS, tagName);
            setAttr(root, RIOT_TAG, tagName); // this will be removed in riot 3.0.0
          }
          var tag = mountTo(root, riotTag || root.tagName.toLowerCase(), opts);

          if (tag) tags.push(tag);
        } else if (root.length) {
          each(root, pushTags); // assume nodeList
        }
      }

      // ----- mount code -----

      // inject styles into DOM
      styleManager.inject();

      if (isObject(tagName)) {
        opts = tagName;
        tagName = 0;
      }

      // crawl the DOM to find the tag
      if (typeof selector === T_STRING) {
        if (selector === '*')
          // select all the tags registered
          // and also the tags found with the riot-tag attribute set
          selector = allTags = selectAllTags();else
          // or just the ones named like the selector
          selector += addRiotTags(selector.split(/, */));

        // make sure to pass always a selector
        // to the querySelectorAll function
        els = selector ? $$(selector) : [];
      } else
        // probably you have passed already a tag or a NodeList
        els = selector;

      // select all the registered and mount them inside their root elements
      if (tagName === '*') {
        // get all custom tags
        tagName = allTags || selectAllTags();
        // if the root els it's just a single tag
        if (els.tagName) els = $$(tagName, els);else {
          // select all the children for all the different root elements
          var nodeList = [];
          each(els, function (_el) {
            nodeList.push($$(tagName, _el));
          });
          els = nodeList;
        }
        // get rid of the tagName
        tagName = 0;
      }

      pushTags(els);

      return tags;
    }

    /**
     * Update all the tags instances created
     * @returns { Array } all the tags instances
     */
    function update() {
      return each(__VIRTUAL_DOM, function (tag) {
        tag.update();
      });
    }

    function unregister(name) {
      delete __TAG_IMPL[name];
    }

    /**
     * Export the Virtual DOM
     */
    var vdom = __VIRTUAL_DOM;

var r$1 = Object.freeze({
      observable: observable$1,
      settings: settings,
      util: util,
      mixin: mixin,
      tag: tag,
      tag2: tag2,
      mount: mount$1,
      update: update,
      unregister: unregister,
      vdom: vdom
    });

    function mount(a, b, c) {
      var ret;
      compile(function () {
        ret = mount$1(a, b, c);
      });
      return ret;
    }

    /*
      Compilation for the browser
    */
    var compile = function () {

      var promise, // emits the 'ready' event and runs the first callback
      ready; // all the scripts were compiled?

      // gets the source of an external tag with an async call
      function GET(url, fn, opts) {
        var req = new XMLHttpRequest();

        req.onreadystatechange = function () {
          if (req.readyState === 4 && (req.status === 200 || !req.status && req.responseText.length)) {
            fn(req.responseText, opts, url);
          }
        };
        req.open('GET', url, true);
        req.send('');
      }

      // evaluates a compiled tag within the global context
      function globalEval(js, url) {
        if (typeof js === T_STRING) {
          var node = mkEl('script'),
              root = document.documentElement;

          // make the source available in the "(no domain)" tab
          // of Chrome DevTools, with a .js extension
          if (url) js += '\n//# sourceURL=' + url + '.js';

          node.text = js;
          root.appendChild(node);
          root.removeChild(node);
        }
      }

      // compiles all the internal and external tags on the page
      function compileScripts(fn, xopt) {
        var scripts = $$('script[type="riot/tag"]'),
            scriptsAmount = scripts.length;

        function done() {
          promise.trigger('ready');
          ready = true;
          if (fn) fn();
        }

        function compileTag(src, opts, url) {
          var code = compiler.compile(src, opts, url);

          globalEval(code, url);
          if (! --scriptsAmount) done();
        }

        if (!scriptsAmount) done();else {
          for (var i = 0; i < scripts.length; ++i) {
            var script = scripts[i],
                opts = extend({ template: getAttr(script, 'template') }, xopt),
                url = getAttr(script, 'src');

            url ? GET(url, compileTag, opts) : compileTag(script.innerHTML, opts);
          }
        }
      }

      //// Entry point -----

      return function (arg, fn, opts) {

        if (typeof arg === T_STRING) {

          // 2nd parameter is optional, but can be null
          if (isObject(fn)) {
            opts = fn;
            fn = false;
          }

          // `riot.compile(tag [, callback | true][, options])`
          if (/^\s*</m.test(arg)) {
            var js = compiler.compile(arg, opts);
            if (fn !== true) globalEval(js);
            if (isFunction(fn)) fn(js, arg, opts);
            return js;
          }

          // `riot.compile(url [, callback][, options])`
          GET(arg, function (str, opts, url) {
            var js = compiler.compile(str, opts, url);
            globalEval(js, url);
            if (fn) fn(js, str, opts);
          });
        } else {

          // `riot.compile([callback][, options])`
          if (isFunction(arg)) {
            opts = fn;
            fn = arg;
          } else {
            opts = arg;
            fn = undefined;
          }

          if (ready) {
            return fn && fn();
          }

          if (promise) {
            if (fn) promise.on('ready', fn);
          } else {
            promise = observable();
            compileScripts(fn, opts);
          }
        }
      };
    }();

    // extend the default riot methods
    var r = extend({}, r$1, {
      compile: compile,
      mount: mount,
      parsers: compiler.parsers
    });

    return r;

}));
