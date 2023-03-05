/**
 * Allows for incoming selector to be renamed.
 * 
 * @param {Object} options - Configuration object 
 * @param {Function} options.replace - Incoming selector, return new selector
 * @returns {Function} - PostCSS plugin
 */
function rename(options) {
  const {
    replace = (r) => r,
  } = options;

  return (tree) => {
    tree.walkRules((rule) => {
      rule.selector = replace(rule.selector);
    });
  }
}

module.exports = rename;