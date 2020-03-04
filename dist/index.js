(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.webmark = {}));
}(this, (function (exports) { 'use strict';

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }

      return arr2;
    }
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

  function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

  var CustomTagName = 'marks';
  var HighLightClass = 'qoxop_highlight';
  /**
   * 获取首尾节点的字符串，用于校验标记是否作废
   * @param start
   * @param end 
   */

  function countStartEndChunk(start, end) {
    return "".concat(start.nodeValue).concat(end.nodeValue).trim();
  }
  /**
   * 查询node下的所有文本节点
   * @param {Node} node 
   */


  function QueryAllTextNodes(node) {
    var texts = [];

    if (node) {
      if (document.createNodeIterator) {
        var textIterator = document.createNodeIterator(node, NodeFilter.SHOW_TEXT);
        var textNode = textIterator.nextNode();

        while (textNode) {
          texts.push(textNode);
          textNode = textIterator.nextNode();
        }

        return texts;
      } else {
        for (var i = 0; i < node.childNodes.length; i++) {
          if (node.childNodes[i].hasChildNodes()) {
            texts.push.apply(texts, _toConsumableArray(QueryAllTextNodes(node.childNodes[i])));
          } else if (node.childNodes[i].nodeType === Node.TEXT_NODE) {
            texts.push(node.childNodes[i]);
          }
        }
      }
    }

    return texts;
  }

  function countSelectionInfo(selection) {
    if (!selection) {
      selection = window.getSelection();
    }

    if (!selection.isCollapsed) {
      var range = selection.getRangeAt(0);
      var startOffset = range.startOffset,
          endOffset = range.endOffset;
      var selectionInfo = {
        id: window.btoa("".concat(Date.now() * Math.random()).concat((Math.random() * 100).toFixed(2))),
        container: {
          index: -1,
          tagname: ''
        },
        textNodes: {
          start: null,
          end: null,
          startEndChunk: ''
        },
        href: window.location.href,
        time: Date.now(),
        text: selection.toString()
      }; // 寻找容器元素

      var containerElem = range.commonAncestorContainer;

      while (true) {
        if (containerElem.nodeType === Node.ELEMENT_NODE || !containerElem) {
          break;
        }

        containerElem = containerElem.parentElement;
      } // 记住node位置            


      var allTextNodes = QueryAllTextNodes(containerElem);

      for (var i = 0; i < allTextNodes.length; i++) {
        if (allTextNodes[i] === range.startContainer) {
          selectionInfo.textNodes.start = {
            index: i,
            split: startOffset
          };
        }

        if (allTextNodes[i] === range.endContainer) {
          selectionInfo.textNodes.end = {
            index: i,
            split: endOffset
          };
          break;
        }
      }

      selectionInfo.textNodes.all = allTextNodes;
      selectionInfo.textNodes.startEndChunk = countStartEndChunk(range.startContainer, range.endContainer); // 记住元素位置

      var tags = document.getElementsByTagName(containerElem.nodeName);

      for (var _i = 0; _i < tags.length; _i++) {
        if (tags.item(_i) === containerElem) {
          selectionInfo.container.index = _i;
          selectionInfo.container.tagname = containerElem.nodeName;
          selectionInfo.container.elem = containerElem;
          break;
        }
      }

      selection.removeAllRanges();
      return selectionInfo;
    }

    return false;
  }
  /**
   * 渲染标记文本
   * @param MarkInfo 
   */

  function render(mark) {
    var container = mark.container,
        textNodes = mark.textNodes;
    var start = textNodes.start,
        end = textNodes.end;
    var Wrp = document.createElement(CustomTagName);
    var className = "".concat(HighLightClass, " ").concat(mark.className ? mark.className : '');
    Wrp.setAttribute('class', "".concat(mark.unused ? '' : className, " ").concat(mark.id));
    Wrp.setAttribute('mark_id', mark.id);

    if (mark.style) {
      Object.keys(mark.style).forEach(function (key) {
        // @ts-ignore
        Wrp.style[key] = mark.style[key];
      });
    }

    if (mark.meta) {
      Wrp.setAttribute('meta_data', JSON.stringify(mark.meta));
    }

    if (!textNodes.all || textNodes.all.length < 1) {
      if (!(container.elem instanceof Element)) {
        var elems = document.getElementsByTagName(container.tagname);
        container.elem = elems.item(container.index);
      }

      textNodes.all = QueryAllTextNodes(container.elem); // check chunk

      if (textNodes.all && textNodes.all[start.index] && textNodes.all[end.index]) {
        var startEndChunk = countStartEndChunk(textNodes.all[start.index], textNodes.all[end.index]);

        if (textNodes.startEndChunk !== startEndChunk) {
          return false;
        }
      } else {
        return false;
      }
    }

    var WrpFn = function WrpFn(text) {
      var wrp = Wrp.cloneNode();
      wrp.innerHTML = text.nodeValue;
      text.parentNode.replaceChild(wrp, text);
    };

    try {
      if (start.index === end.index) {
        var nextText = textNodes.all[start.index].splitText(start.split).splitText(end.split - start.split);
        WrpFn(nextText.previousSibling);
        return true;
      }

      for (var i = start.index + 1; i < end.index; i++) {
        WrpFn(textNodes.all[i]);
      }

      var startText = textNodes.all[start.index].splitText(start.split);
      var endText = textNodes.all[end.index].splitText(end.split).previousSibling;
      WrpFn(startText);
      WrpFn(endText);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  var _ref = function () {
    var afns = [];
    return {
      setAfterMark: function setAfterMark(fn) {
        afns.push(fn);
      },
      runAfters: function runAfters(mi) {
        afns.reduce(function (old, fn) {
          return fn(mi, old);
        }, null);
      }
    };
  }(),
      setAfterMark = _ref.setAfterMark,
      runAfters = _ref.runAfters;

  var setMarkTagName = function setMarkTagName(tagname) {
    return CustomTagName = tagname;
  };

  var setDefaultClass = function setDefaultClass(className) {
    return HighLightClass = className;
  };
  function core () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var callback = arguments.length > 1 ? arguments[1] : undefined;
    var info = countSelectionInfo(options.selection);
    var success = false;

    if (info !== false) {
      var _mi = _objectSpread({}, info, {}, options);

      success = render(_mi);

      if (success) {
        runAfters(_mi);
      }

      if (typeof callback === 'function') {
        callback(_mi, success);
      }
    }

    return success;
  }

  function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

  function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$1(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
  var pageHashPrefix = 'qoxop_mark_';
  var config = {
    pageHashPrefix: pageHashPrefix,
    pageHash: function pageHash(href) {
      return pageHashPrefix + href.replace(location.origin, '');
    },
    getPageInfo: function getPageInfo() {
      return {
        title: document.title
      };
    }
  };
  var MarkStore = {};
  /**
   *  清除页面副作用
   * @param marks 
   */

  function clearDomSideEffect(marks) {
    marks.reverse().forEach(function (item) {
      var domArray = Array.from(document.getElementsByClassName(item.id) || []);
      domArray.forEach(function (elem) {
        return elem.parentNode.replaceChild(elem.firstChild, elem);
      });
    });
    document.normalize();
  }
  /**
   * 获取当前页面的所有标记
   */


  function getCurrentPageMarks() {
    var pageHash = config.pageHash,
        getPageInfo = config.getPageInfo;
    var hash = pageHash(window.location.href);

    if (!MarkStore[hash]) {
      MarkStore[hash] = JSON.parse(window.localStorage.getItem(hash)) || {
        marks: [],
        pageInfo: getPageInfo()
      };
    }

    return MarkStore[hash];
  }
  /**
   * 设置配置项
   * @param options 
   */


  function setConfig() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    Object.keys(options).forEach(function (key) {
      var value = options[key];

      if (config[key]) {
        config[key] = value;
      } else if (key === 'markTagName') {
        setMarkTagName(value);
      } else if (key === 'defaultClassName') {
        setDefaultClass(value);
      }
    });
    pageHashPrefix = config.pageHashPrefix;
    return config;
  }
  /**
   * 渲染当前页的所有标记
   */


  function renderAll() {
    var allmarks = getCurrentPageMarks();

    if (!allmarks || !allmarks.marks || allmarks.marks.length === 0) {
      return true;
    }

    var elems = document.getElementsByClassName(config.defaultClassName);

    if (elems && elems.length > 0) {
      return true;
    }

    if (!allmarks.marks.every(function (item) {
      return render(item);
    })) {
      removeAll({
        allPage: false,
        retainTexts: true
      });
    }

    return true;
  }
  /**
   * 移除标记
   * @param id 
   * @param allRmHandler 
   */


  function remove(id, allRmHandler) {
    var allMarks = getCurrentPageMarks();
    allMarks.marks.some(function (item) {
      if (id === item.id && !item.unused) {
        var elems = document.getElementsByClassName(id); // 删除class

        var elemArr = Array.prototype.slice.call(elems);
        elemArr.forEach(function (elem) {
          return elem.setAttribute('class', id);
        });
        item.unused = true;
        return true;
      }
    });

    if (allMarks.marks.every(function (item) {
      return item.unused;
    })) {
      if (allRmHandler) {
        allRmHandler(function () {
          allMarks.marks = [];
          removeAll({
            allPage: false,
            retainTexts: false
          });
        }, allMarks.marks);
      } else {
        removeAll({
          allPage: false,
          retainTexts: false
        });
      }
    } else {
      var pageHash = config.pageHash;
      var hash = pageHash(window.location.href);
      window.localStorage.setItem(hash, JSON.stringify(allMarks));
    }
  }
  /**
   * 导出标记内容
   * @param params 
   */


  function exportToJson() {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var _type$onlyHistory$par = _objectSpread$1({
      type: 'text',
      onlyHistory: false
    }, params),
        type = _type$onlyHistory$par.type,
        onlyHistory = _type$onlyHistory$par.onlyHistory;

    var alls = Object.keys(localStorage).filter(function (key) {
      return key.indexOf(pageHashPrefix) === 0;
    }).reduce(function (dateset, key) {
      return _objectSpread$1({}, dateset, _defineProperty({}, key, JSON.parse(localStorage[key])));
    }, {});

    if (type === 'all') {
      return alls;
    }

    if (type === 'text') {
      var historys = Object.keys(localStorage).filter(function (key) {
        return key.indexOf("history_".concat(pageHashPrefix, "_")) === 0;
      }).reduce(function (dateset, key) {
        return _objectSpread$1({}, dateset, _defineProperty({}, key, JSON.parse(localStorage[key])));
      }, {});

      if (onlyHistory === true) {
        return historys;
      }

      return Object.keys(alls).reduce(function (dataset, key) {
        return _objectSpread$1({}, dataset, _defineProperty({}, key, alls[key].marks.map(function (m) {
          return m.text;
        })));
      }, historys);
    }

    return null;
  }
  /**
   * 清除所有标记
   * @param params 
   */


  function removeAll() {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var _allPage$retainTexts$ = _objectSpread$1({
      allPage: false,
      retainTexts: false
    }, params),
        allPage = _allPage$retainTexts$.allPage,
        retainTexts = _allPage$retainTexts$.retainTexts;

    var pageHash = config.pageHash(window.location.href);
    var markSet = [];
    Object.keys(localStorage).filter(function (key) {
      if (allPage === true) {
        return key.indexOf(pageHashPrefix) === 0;
      } else {
        return key === pageHash;
      }
    }).forEach(function (key) {
      try {
        var _marks = JSON.parse(localStorage.getItem(key) || '{}').marks;
        markSet = markSet.concat(_marks);

        if (retainTexts) {
          // 保存文本备份
          localStorage.setItem("history_".concat(pageHashPrefix, "_").concat(Date.now(), "@").concat(Math.random().toFixed(2)), JSON.stringify(_marks.map(function (item) {
            return item.text;
          })));
        }
      } catch (error) {
        console.error(error);
      }

      localStorage.removeItem(key);
    }); // 清除页面副作用的方式

    clearDomSideEffect(markSet);
  }
  /**
   * 标记后存储
   */


  setAfterMark(function (mi) {
    var pageHash = config.pageHash,
        getPageInfo = config.getPageInfo;
    var hash = pageHash(mi.href); // @ts-ignore

    var storeMi = _objectSpread$1({}, mi, {
      selection: undefined,
      container: _objectSpread$1({}, mi.container, {
        elem: undefined
      }),
      textNodes: _objectSpread$1({}, mi.textNodes, {
        all: undefined
      })
    });

    if (!MarkStore[hash]) {
      MarkStore[hash] = {
        marks: [storeMi],
        pageInfo: getPageInfo()
      };
    } else {
      MarkStore[hash].marks.push(storeMi);
    }

    window.localStorage.setItem(hash, JSON.stringify(MarkStore[hash]));
  });

  var DOMContentLoaded = new Promise(function (resolve) {
    window.addEventListener('DOMContentLoaded', function () {
      var styleElement = document.createElement('style');
      styleElement.innerHTML = ".qoxop_highlight {background: #f3f308;}";
      document.head.appendChild(styleElement);
      setTimeout(function () {
        resolve();
      });
    });
  });

  function init() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var config = setConfig(options);
    var pageId = config.pageHash(window.location.href);
    var immediate = options.immediate,
        onUrlChange = options.onUrlChange,
        _options$delay = options.delay,
        delay = _options$delay === void 0 ? 500 : _options$delay;
    var cancelKey = 0;

    if (immediate) {
      DOMContentLoaded.then(renderAll);
    }

    if (onUrlChange) {
      var observer = new MutationObserver(function () {
        if (cancelKey !== 0) {
          clearTimeout(cancelKey);
        } // @ts-ignore


        cancelKey = setTimeout(function () {
          cancelKey = 0;
          var newPageId = config.pageHash(window.location.href);

          if (pageId !== newPageId) {
            pageId = newPageId;
            renderAll();
          }
        }, delay);
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  exports.exportToJson = exportToJson;
  exports.init = init;
  exports.mark = core;
  exports.remove = remove;
  exports.removeAll = removeAll;
  exports.renderAll = renderAll;
  exports.setConfig = setConfig;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
