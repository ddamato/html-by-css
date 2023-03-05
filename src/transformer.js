const { parse } = require('css-what');

function getTagName(result) {
  const tree = [].concat(result).flat().filter(Boolean);
  const tag = tree.find(({ type }) => type === 'tag');
  if (!tag) {
    const pseudo = tree.find(({ type }) => type === 'pseudo');
    return pseudo ? getTagName(pseudo?.data) : 'div';
  }
  return tag.name;
}

function getAttributes(result) {
  const tree = [].concat(result).flat().filter(Boolean);
  const attr = tree.filter(({ type }) => type === 'attribute').map(({ name, value }) => {
    return { key: name, value }
  });
  const pseudos = tree.filter(({ type }) => type === 'pseudo').map((pseudo) => {
    return getAttributes(pseudo?.data);
  });
  return attr.concat(pseudos).flat().reduce((acc, { key, value }) => {
    const target = acc.find((attr) => attr.key === key);
    if (!target) return acc.concat({ key, value });
    target.value = [target.value, value].filter(Boolean).join(' ').trim();
    return acc;
  }, []);
}

function transformer (selector) {
  const result = parse(selector.replace('&', '')).flat();

  const entry = {
    type: 'element',
    tagName: getTagName(result),
    attributes: getAttributes(result),
    children: []
  }

  return entry;
}

module.exports = transformer;