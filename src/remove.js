/**
 * Allows for incoming selector to have properties removed.
 * 
 * @param {Object} options - Configuration object 
 * @param {Function} options.filter - Filter by incoming selector
 * @param {String|Array<String>} options.property - Property to be removed on filtered selectors
 * @returns {Function} - PostCSS plugin
 */
function remove(options) {
  const {
    filter = Function.prototype,
    property = null,
  } = options;

  return (tree) => {
    tree.walkRules((rule) => {
      rule.walkDecls((decl) => {
        filter(decl.parent.selector)
        && [].concat(property).includes(decl.prop)
        && decl.remove();
      });
    });
  }
}

module.exports = remove;