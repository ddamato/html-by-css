'use strict';

const require$$0$1 = require('postcss');
const require$$1 = require('postcss-nesting');
const require$$2 = require('himalaya');
const require$$0 = require('css-what');

const { parse } = require$$0;
function getTagName(result) {
  const tree = [].concat(result).flat().filter(Boolean);
  const tag = tree.find(({ type }) => type === "tag");
  if (!tag) {
    const pseudo = tree.find(({ type }) => type === "pseudo");
    return pseudo ? getTagName(pseudo?.data) : "div";
  }
  return tag.name;
}
function getAttributes(result) {
  const tree = [].concat(result).flat().filter(Boolean);
  const attr = tree.filter(({ type }) => type === "attribute").map(({ name, value }) => {
    return { key: name, value };
  });
  const pseudos = tree.filter(({ type }) => type === "pseudo").map((pseudo) => {
    return getAttributes(pseudo?.data);
  });
  return attr.concat(pseudos).flat().reduce((acc, { key, value }) => {
    const target = acc.find((attr2) => attr2.key === key);
    if (!target)
      return acc.concat({ key, value });
    target.value = [target.value, value].filter(Boolean).join(" ").trim();
    return acc;
  }, []);
}
function transformer$1(selector) {
  const result = parse(selector.replace("&", "")).flat();
  const entry = {
    type: "element",
    tagName: getTagName(result),
    attributes: getAttributes(result),
    children: []
  };
  return entry;
}
var transformer_1 = transformer$1;

function rename$1(options) {
  const {
    replace = (r) => r
  } = options;
  return (tree) => {
    tree.walkRules((rule) => {
      rule.selector = replace(rule.selector);
    });
  };
}
var rename_1 = rename$1;

function remove$1(options) {
  const {
    filter = Function.prototype,
    property = null
  } = options;
  return (tree) => {
    tree.walkRules((rule) => {
      rule.walkDecls((decl) => {
        filter(decl.parent.selector) && [].concat(property).includes(decl.prop) && decl.remove();
      });
    });
  };
}
var remove_1 = remove$1;

const postcss = require$$0$1;
const postcssNesting = require$$1;
const { stringify } = require$$2;
const transformer = transformer_1;
const rename = rename_1;
const remove = remove_1;
const DEFAULT_PLUGINS = [
  // Removing the emmet syntax
  rename({ replace: (raw) => raw.replace(/\*\d+$/, "") }),
  // Remove content on non-pseudos
  remove({ property: "content", filter: (sel) => !/(.*::?)(after|before)/.test(sel) })
];
function parseMultiplier(selector) {
  const { groups } = selector.match(/[^*]+\*(?<multi>\d+)/, "gmisu") || {};
  return groups ? Number(groups.multi) : 1;
}
function walk(node, results) {
  node.each((child) => {
    if (child.type === "decl" && child.prop === "content" && !/:before|:after/.test(child.parent.selector)) {
      results.push({
        type: "text",
        content: child.value
      });
      child.remove();
    }
    if (child.selector) {
      Array.from({ length: parseMultiplier(child.selector) }, () => {
        const entry = transformer(child.selector);
        results.push(entry);
        if (child?.nodes?.length) {
          return walk(child, entry.children);
        }
      });
    }
    return results;
  });
  return results;
}
function htmlByCss(source, options) {
  const {
    legacy,
    plugins
  } = { legacy: false, plugins: [], ...options };
  const _plugins = [...DEFAULT_PLUGINS];
  if (legacy) {
    _plugins.push(postcssNesting());
  }
  const parsed = postcss.parse(source);
  const html = stringify(walk(parsed, []));
  const { css } = postcss(_plugins.concat(plugins)).process(source, { from: void 0 });
  return { html, css };
}
var src = htmlByCss;

module.exports = src;
