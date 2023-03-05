# html-by-css

Generate html by writing css.

## Install

```sh
npm i html-by-css
```


## Usage

```js
import generate from 'html-by-css';

const source = `
  ul#list {
    list-style: none;
    margin: 0;
    padding: 0;

    & li.item*3 {
      padding: .5rem;

      :is(a[href="#"]) {
        content: Link;
        color: inherit;
      }
    }
  }
`;

const { html, css } = generate(source);
```

HTML
```html
<ul id="list">
  <li class="item">
    <a href="#">Link</a>
  </li>
  <li class="item">
    <a href="#">Link</a>
  </li>
  <li class="item">
    <a href="#">Link</a>
  </li>
</ul>
```
CSS
```css
/* legacy: false (default) */
ul#list {
  list-style: none;
  margin: 0;
  padding: 0;
  & li.item {
    padding: .5rem;
    :is(a[href="#"]) {
      color: inherit;
    }
  }
}

/* legacy: true */
ul#list {
  list-style: none;
  margin: 0;
  padding: 0;
}

ul#list li.item {
  padding: .5rem;
}

ul#list li.item :is(a[href="#"]) {
  color: inherit;
}
```

## How it works

- Use [`postcss`] to parse and walk through source.
- On target nodes, process data as HTML:
  - Find `content` on non-pseudo elements and inject as text.
  - Find [`emmet`] syntax and duplicate elements.
  - Parse selector using [`css-what`].
  - Transform selector to [`himalaya`] schema.
- Process source as valid CSS:
  - Remove `content` on non-pseudo elements.
  - Remove [`emmet`] syntax.
  - Optionally, use [`postcss-nesting`] plugin to transform into legacy, non-nested CSS.
  - Apply additional plugins as provided.
- Return object with `{ html, css }`.

## Features

### Nesting
The nesting should be prepared using [the current w3 CSS Nesting specification](https://www.w3.org/TR/css-nesting-1/). The most important concept is that a nested selector **must start with a symbol**.

```css
.foo {
  /* ❌ invalid */
  span {
    color: hotpink;
  }

  /* ✅ valid */
  & span {
    color: hotpink;
  }

  /* ❌ invalid */
  span & {
    color: hotpink;
  }

  /* ✅ valid */
  :is(span) & {
    color: hotpink;
  }
}	
```

If you wish to collapse the nesting for the CSS output, set `legacy: true` in the options. This uses [`postcss-nesting`] with the default options.

```js
const { html, css } = generate(source, { legacy: true });
```

If you want to set your own options, provide your own version of the [`postcss-nesting`] plugin and configure.

```js
import nesting from 'postcss-nesting';
import generate from 'html-by-css';

const postcssPlugins = [nesting({
  noIsPseudoSelector: true
})];
const { html, css } = generate(source, { plugins: postcssPlugins });
```

> **Warning**
>
> Do not use `legacy: true` with your own [`postcss-nesting`] configuration. The internal (`legacy`) usage will run first. Either do not declare or explicitly set `legacy: false`. This is only when using a custom [`postcss-nesting`], all other plugins can be used with `legacy: true`.

### PostCSS plugins

You can include additional [`postcss`] plugins. Example below helps with [removing duplicate declarations](https://www.npmjs.com/package/postcss-discard-duplicates).

```js
import dedupe from 'postcss-discard-duplicates';
import generate from 'html-by-css';

const postcssPlugins = [dedupe()];
const { html, css } = generate(source, { plugins: postcssPlugins });
```

This is helpful if you have several similar elements with different contents.

```css
ul#list {
  & li.item {
    & a*0 {
      color: inherit;
    }

    & a[href="/home"] {
      content: Home;
    }

    & a[href="/about"] {
      content: About;
    }

    & a[href="/contact"] {
      content: Contact
    }
  }
}
```

> **Note**
>
> The use of `a*0` says _write the styles found here, but don't write HTML_. When you use this, the represented node and it's children will not be written as HTML.

### Duplicate nodes

To create multiple elements, use [`emmet`] syntax.

```css
ul {
  li*5 {
    /* Makes 5 <li/> elements */
  }
}
```
This `li*5` selector is not valid CSS and is transformed during processing to `li`.
### Text content

To add text content, use the `content` property on non-pseudo elements.

```css
main {
  & h1 {
    content: Hello world!;
  }
}
```

```html
<main>
  <h1>Hello world!</h1>
</main>
```

> **Note**
>
> There are no quotes around the string. Adding quotes would _include the quotes_ in the output.

The `content` property is not valid on non-pseudo elements and is removed from these declarations during processing.

## Testing

```sh
npm t
```

- Using [`cheerio`] to traverse HTML in tests.
- Using [`@projectwallace/css-analyzer`] to analyze returned CSS.

There's definitely some cases not covered in the tests yet.

- [ ] `content` prop and nested selector (both text and children).
- [ ] Other pseudo-selectors (`:nth-child()`, `:checked`).

## Why

> Your scientists were so preoccupied with whether they could, they didn't stop to think if they should.

There's a few projects out there that are HTML preprocessors ([Haml](https://haml.info/), [Pug](https://pugjs.org/api/getting-started.html)) which have their own (sometimes CSS-like) syntax. I wondered if we could get closer to just writing CSS to produce HTML. With the new nesting specification and the power of [`postcss`], it looks like we can!

[`@projectwallace/css-analyzer`]: (https://www.npmjs.com/package/@projectwallace/css-analyzer)
[`cheerio`]: (https://www.npmjs.com/package/cheerio);
[`css-what`]: (https://www.npmjs.com/package/css-what)
[`emmet`]: (https://docs.emmet.io)
[`himalaya`]: (https://www.npmjs.com/package/himalaya)
[`postcss`]: (https://www.npmjs.com/package/postcss)
[`postcss-nesting`]: (https://www.npmjs.com/package/postcss-nesting)