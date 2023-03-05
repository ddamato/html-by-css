import { readFileSync } from 'fs';
import { resolve } from 'path';
import { expect } from 'chai';
import { load } from 'cheerio';
import { analyze } from '@projectwallace/css-analyzer';

import htmlByCss from '../dist/index.mjs';

function read(fixturePath) {
  return readFileSync(resolve('test', 'fixtures', fixturePath), 'utf8');
}

function fixture(path, options = { legacy: true }) {
  const { html, css } = htmlByCss(read(path), options);
  return {
    html: load(html, null, false),
    css: analyze(css),
  };
}

describe('html-by-css', function () {
  it('should be a function', function () {
    expect(htmlByCss).to.be.a('function');
  });

  it('should generate strings', function () {
    const source = read('basic.css');
    const { html, css } = htmlByCss(source);
    expect(html).to.be.a('string');
    expect(css).to.be.a('string');
  });

  describe('html', function () {
    it('should generate valid HTML from single selector', function (){
      const { html: $ } = fixture('basic.css');
      const { name } = $('main').get(0);
      expect(name).to.equal('main');
    });

    it('should generate valid HTML from nested selectors', function () {
      const { html: $ } = fixture('nested.css');
      const li = $('ul').children();
      expect(li.length).to.equal(1);
      const { name, attributes } = $('a').parent().get(0);
      expect(name).to.equal('li');
      const [className] = attributes;
      expect(className.value).to.equal('item');
    });

    it('should generate additional nodes using emmet', function () {
      const { html: $ } = fixture('emmet.css');
      const li = $('ul').children();
      expect(li.length).to.equal(5);
      const hrefs = li.map(function() {
        return $(this).children().first().attr('href')
      }).get();
      expect(hrefs.join('')).to.equal('#####');
    });

    it('should generate content', function () {
      const { html: $ } = fixture('content.css');
      const content = $('h1').text();
      expect(content).to.equal('Hello world!');
    });
  });

  describe('css', function () {
    it('should maintain nesting by default (legacy: false)', function () {
      const source = read('nested.css');
      const { css } = htmlByCss(source);
      expect(css).to.include('& li.item');
    });

    it('should generate valid CSS from single selector', function () {
      const { css } = fixture('basic.css');
      expect(css.rules.total).to.equal(1);
      expect(css.selectors.total).to.equal(1);
      expect(css.declarations.total).to.equal(3);
    });

    it('should generate valid CSS from nested selectors', function () {
      const { css } = fixture('nested.css');
      expect(css.rules.total).to.equal(2);
      expect(css.selectors.total).to.equal(2);
      expect(css.declarations.total).to.equal(4);
    });

    it('should not generate emmet selectors', function () {
      const { css } = fixture('emmet.css');
      expect(css.rules.total).to.equal(2);
      expect(css.selectors.total).to.equal(2);
      expect(css.declarations.total).to.equal(5);
    });

    it('should not include content with non-psuedo' , function () {
      const source = read('content.css');
      const { css } = htmlByCss(source);
      expect(css).to.include("content: '';");
      expect(css).to.not.include("content: Hello world!;");
    });
  });
});