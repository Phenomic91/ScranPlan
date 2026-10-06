import { decodeEntities, htmlToText, readPageText } from './html';

describe('decodeEntities', () => {
  it('decodes named and numeric entities', () => {
    expect(decodeEntities('Fish &amp; chips &#8211; it&#39;s &frac12; price&nbsp;&#x2014;')).toBe(
      "Fish & chips – it's ½ price —",
    );
  });

  it('leaves unknown entities alone', () => {
    expect(decodeEntities('&madeup;')).toBe('&madeup;');
  });
});

describe('htmlToText', () => {
  it('keeps block breaks and drops scripts', () => {
    expect(htmlToText('<p>One</p><script>var x;</script><p>Two <b>words</b></p>')).toBe(
      'One\nTwo words',
    );
  });
});

describe('readPageText', () => {
  it('prefers the article over menus', () => {
    const html =
      '<title>Soup</title><nav>Home Menu</nav><article><h1>Soup</h1><p>Boil water.</p></article>';
    expect(readPageText(html, 1000)).toBe('Soup\nSoup\nBoil water.');
  });

  it('cuts long pages to the limit', () => {
    expect(readPageText(`<body>${'a'.repeat(500)}</body>`, 100)).toHaveLength(100);
  });
});
