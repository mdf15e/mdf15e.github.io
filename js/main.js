import {
  extractHtmlSnippet,
  importPluralize,
  importExternalScript,
  insertContentHeading,
  loadSnsLinks,
  setFavicon,
  switchLang,
  wrapContentTitle,
  wrapDesignedText
} from './utils.js';

let siteSettings = {};  // サイトの設定情報を格納する変数
let t = {};  // 翻訳データ
let lang = 'ja';  // 言語設定

// 設定ファイルと翻訳ファイルの読み込み
Promise.all([
  fetch('/data/site-settings.json').then(response => response.json()),
  fetch('/i18n/for_js.json').then(response => response.json())
])
  .then(([config, allTexts]) => {
    siteSettings = config;
    const pathLang = location.pathname.split('/')[1];
    lang = siteSettings.langs.includes(pathLang) ? pathLang : 'ja';
    t = allTexts[lang] || allTexts['ja'];

    setFavicon(siteSettings.iconImage);
    if (!document.title || document.title === '') document.title = siteSettings.siteTitle;

    readPage();  // ページの読み込み処理を呼び出す
  })
  .catch(err => {
    console.error('Error loading settings or translation:', err);
  });

// ページの読み込み
async function readPage() {
  await addToHead();
  wrapContentTitle();
  observeContentTitles();
  wrapDesignedText();
  observeDesignedText();
  applyTheme();
  await loadHeader();
  await loadFooter();
  loadSnsLinks(siteSettings.sns);
  await loadContentsList();
  insertContentHeading(siteSettings.contentTypes);

  if (document.body.dataset.useMathjax === 'true') {
    if (window.MathJax) {
      await MathJax.typesetPromise();
    }
  }
}

// テーマの設定
function applyTheme() {
  const root = document.documentElement;

  root.style.setProperty('--theme-dark', siteSettings.colors.themeDarkColor);
  root.style.setProperty('--theme-light', siteSettings.colors.themeLightColor);
  root.style.setProperty('--theme-transparent-dark', siteSettings.colors.themeTransparentDarkColor);
  root.style.setProperty('--theme-transparent-light', siteSettings.colors.themeTransparentLightColor);
  root.style.setProperty('--theme-text', siteSettings.colors.themeTextColor);
  root.style.setProperty('--accent-color', siteSettings.colors.accentColor);
  root.style.setProperty('--title-font', siteSettings.fonts.titleFont);
  root.style.setProperty('--body-font', siteSettings.fonts.bodyFont);
  root.style.setProperty('--icon-image', `url(${siteSettings.iconImage})`);
}

function addToHead() {
  window.MathJax = {
    tex: {
      inlineMath: siteSettings.mathjax.tex.inlineMath,
      displayMath: siteSettings.mathjax.tex.inlineMath,
      tags: 'ams'
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
      renderActions: {
        addMenu: []
      }
    }
  };

  return importExternalScript('https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js')
    .catch(err => console.error('Error loading MathJax:', err));
}

// headerの読み込み
async function loadHeader() {
  fetch('/includes/header.html')
    .then(response => response.text())
    .then(html => {
      html = html
        .replace(/{{siteName}}/g, siteSettings.siteName)
        .replace(/{{lang}}/g, lang)
      document.getElementById('header').innerHTML = html;

      setupLanguageSwitcher();
      loadSnsLinks(siteSettings.sns);
    })
    .catch(err => console.error('Error loading header:', err));
}

// footerの読み込み
async function loadFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  fetch('/includes/footer.html')
    .then(response => response.text())
    .then(html => {
      footer.innerHTML = html;
      loadSnsLinks(siteSettings.sns);
    })
    .catch(err => console.error('Error loading footer:', err));
}

// コンテンツ一覧の読み込み
function loadContents(contentType, pluralize) {
  const contentTypeS = pluralize(contentType).toLowerCase();
  const contentsList = document.getElementById(`${contentTypeS}-list`);
  if (!contentsList) return Promise.resolve();

  return fetch(`/data/contents_list/${contentTypeS}.json`)
    .then(response => response.json())
    .then(allContents => {
      if (!allContents || !Array.isArray(allContents) || allContents.length === 0) {
        const noContentsMessage = document.createElement('div');
        noContentsMessage.className = 'content no-contents-message';
        noContentsMessage.textContent = t.noContents ?? 'No contents here.';
        contentsList.appendChild(noContentsMessage);
        return;
      }

      const contents = allContents
        .filter(contents => contents.lang.includes(lang))
        .sort((a, b) => new Date(b.created) - new Date(a.created));

      return fetch(`/includes/content-summary.html`)
        .then(response => response.text())
        .then(template => {
          const renderPromises = contents.map(file => {
            const pathToContent = contentTypeS + '/' + file.filename;

            return fetch(pathToContent)
              .then(response => response.text())
              .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const title = tempDiv.querySelector('.content-title')?.textContent.trim() || t.noTitle;
                const mainText = tempDiv.querySelector('.content-text') || (() => {
                  const fallback = document.createElement('div');
                  fallback.innerHTML = t.noIntro;
                  return fallback;
                })();
                const introLength = siteSettings.introLength[lang] ?? siteSettings.introLength.default;

                const intro = extractHtmlSnippet(
                  mainText,
                  introLength,
                  ` <a href="${contentTypeS}/${file.filename}" class="read-more-link">......${t.readMore}</a>`
                );

                const summary = template
                  .replace(/{{title}}/g, title)
                  .replace(/{{intro}}/g, intro)
                  .replace(/{{link}}/g, pathToContent);

                const summaryDiv = document.createElement('div');
                summaryDiv.innerHTML = summary;
                contentsList.appendChild(summaryDiv);
              })
              .catch(err => console.error(`Error loading ${contentType}:`, err));
          });

          return Promise.all(renderPromises);
        })
        .catch(err => console.error(`Error loading ${contentTypeS} summary template:`, err));
    })
    .catch(err => console.error(`Error loading ${contentType} data:`, err));
}

async function loadContentsList() {
  try {
    const pluralize = await importPluralize();
    const contentTypes = Object.keys(siteSettings.contentTypes);

    await Promise.all(
      contentTypes.map(contentType => loadContents(contentType, pluralize))
    );

    if (window.MathJax) {
      await MathJax.typesetPromise();
    }
  } catch (err) {
    console.error(`loadContentsList error:`, err);
  }
}

// 言語切り替えボタンの設定
function setupLanguageSwitcher() {
  const buttons = document.querySelectorAll('#language-switcher button');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetLang = btn.dataset.lang.toLowerCase();
      switchLang(targetLang, siteSettings.langs);
    });
  });
}

function observeContentTitles() {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1) {return;} else {
          if (node.matches('.content-title') || node.querySelector('.content-title')) {
            wrapContentTitle();
          }
        };
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function observeDesignedText() {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;

        if (node.matches('.designed') || node.querySelector('.designed')) {
          wrapDesignedText();
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}