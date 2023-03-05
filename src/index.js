const postcss = require('postcss');
const postcssNesting = require('postcss-nesting');
const { stringify } = require('himalaya');
const transformer = require('./transformer.js');
const rename = require('./rename.js');
const remove = require('./remove.js');

const DEFAULT_PLUGINS = [
  // Removing the emmet syntax
  rename({ replace: (raw) => raw.replace(/\*\d+$/, '') }),
  // Remove content on non-pseudos
  remove({ property: 'content', filter: (sel) => !/(.*::?)(after|before)/.test(sel) })
];

/**
 * Determine the number of nodes to generate using emmet selector syntax
 * 
 * @example 'li.item*5' => 5
 * @param {String} selector - CSS Selector which may include emmet notation
 * @returns {Number} - Number of nodes to generate
 */
function parseMultiplier(selector) {
  const { groups } = (selector.match(/[^*]+\*(?<multi>\d+)/, 'gmisu') || {});
  return groups ? Number(groups.multi) : 1;
}

/**
 * Creates a tree of nodes using himalaya schema
 * 
 * @param {Node} node - PostCSS node
 * @param {Array<Object>} results - Tree of node entries
 * @returns {Array<Object>} - Tree of node entries based on himalaya schema
 */
function walk(node, results) {
  node.each((child) => {
    if (child.type === 'decl'
      && child.prop === 'content'
      && !/:before|:after/.test(child.parent.selector)
    ) {
      results.push({
        type: 'text',
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

/**
 * Generate HTML and CSS from source css using nesting syntax
 * 
 * @param {String} source - CSS to be processed
 * @param {Object} [options] - Configuration object
 * @param {Boolean} [options.legacy] - If true, includes the postcss-nesting plugin to coerce nesting syntax into legacy CSS.
 * @param {Array} [options.plugins] - Array of additional plugins to adjust resulting CSS. Does not affect HTML.
 * @returns {Object} - { html, css } 
 */
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
  const { css } = postcss(_plugins.concat(plugins)).process(source, { from: undefined });
  return { html, css };
}

module.exports = htmlByCss;