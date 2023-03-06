/**
 * Removes empty declarations
 * 
 * @returns {Function} - PostCSS plugin
 */
function empty() {
  return (tree) => tree.walkRules((rule) => ancestors(rule));
}

/**
 * Recursively traverses up node tree to remove newly empty nodes.
 * 
 * @param {Node} rule - PostCSS tree node
 * @returns {Undefined}
 */
function ancestors(rule) {
  const { parent } = rule;
  if (rule.nodes.length) return;
  rule.remove();
  parent && ancestors(parent);
}

module.exports = empty;