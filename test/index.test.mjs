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
  const _css = analyze(css);
  _css.toString = function () { return css };
  return {
    html: load(html, null, false),
    css: _css,
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
      console.log($.html());
      const { name } = $('main').get(0);
      expect(name).to.equal('main');
    });

    it('should generate valid HTML from nested selectors', function () {
      const { html: $ } = fixture('nested.css');
      console.log($.html());
      const li = $('ul').children();
      expect(li.length).to.equal(1);
      const { name, attributes } = $('a').parent().get(0);
      expect(name).to.equal('li');
      const [className] = attributes;
      expect(className.value).to.equal('item');
    });

    it('should generate additional nodes using emmet', function () {
      const { html: $ } = fixture('emmet.css');
      console.log($.html());
      const li = $('ul').find('li');
      expect(li.length).to.equal(5);
      const hrefs = li.map(function() {
        return $(this).children().first().attr('href')
      }).get();
      expect(hrefs.join('')).to.equal('#####');
    });

    it('should skip HTML rendering using *0', function () {
      const { html: $ } = fixture('skip.css');
      console.log($.html());
      const { length } = $('ul').find('a');
      expect(length).to.equal(3);
    });

    it('should generate content', function () {
      const { html: $ } = fixture('content.css');
      console.log($.html());
      const content = $('h1').text();
      expect(content).to.equal('Hello world!');
    });

    it('should generate elements that have no CSS', function () {
      const { html: $ } = fixture('empty.css');
      console.log($.html());
      const li = $('ul').find('li');
      expect(li.length).to.equal(3);
      const hrefs = li.map(function() {
        return $(this).children().first().attr('href')
      }).get();
      expect(hrefs.join('')).to.equal('###');
    });
  });

  describe('css', function () {
    it('should maintain nesting by default (legacy: false)', function () {
      const source = read('nested.css');
      const { css } = htmlByCss(source, { legacy: false });
      console.log(css);
      expect(css).to.include('& li.item');
    });

    it('should generate valid CSS from single selector', function () {
      const { css } = fixture('basic.css');
      console.log(String(css));
      expect(css.rules.total).to.equal(1);
      expect(css.selectors.total).to.equal(1);
      expect(css.declarations.total).to.equal(3);
    });

    it('should generate valid CSS from nested selectors', function () {
      const { css } = fixture('nested.css');
      console.log(String(css));
      expect(css.rules.total).to.equal(2);
      expect(css.selectors.total).to.equal(2);
      expect(css.declarations.total).to.equal(4);
    });

    it('should not generate emmet selectors', function () {
      const { css } = fixture('emmet.css');
      console.log(String(css));
      expect(css.rules.total).to.equal(3);
      expect(css.selectors.total).to.equal(3);
      expect(css.declarations.total).to.equal(8);
    });

    it('should include rendering using *0', function () {
      const { css } = fixture('skip.css');
      console.log(String(css));
      expect(css.rules.total).to.equal(3);
      expect(css.selectors.total).to.equal(3);
      expect(css.declarations.total).to.equal(8);
    });

    it('should not include content with non-psuedo' , function () {
      const source = read('content.css');
      const { css } = htmlByCss(source, { legacy: true });
      console.log(css);
      expect(css).to.include("content: '';");
      expect(css).to.not.include("content: Hello world!;");
    });

    it('should remove empty declarations', function () {
      const { css } = fixture('empty.css');
      console.log(String(css));
      expect(css.rules.total).to.equal(0);
      expect(css.selectors.total).to.equal(0);
      expect(css.declarations.total).to.equal(0);
    });
  });
});