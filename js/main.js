import { extractHtmlSnippet, insertContentHeading, loadSnsLinks, setFavicon, switchLang, wrapContentTitle, wrapDesignedText} from './utils.js';

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
function readPage() {
  wrapContentTitle();
  observeContentTitles();
  wrapDesignedText();
  observeDesignedText();
  applyTheme();
  loadHeader();
  loadFooter();
  loadSnsLinks(siteSettings.sns);
  loadArticles();
  insertContentHeading(siteSettings.contentTypes);
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

// headerの読み込み
function loadHeader() {
  fetch('/includes/header.html')
    .then(response => response.text())
    .then(html => {
      // const siteName = wrapInitialLetters(siteSettings.siteName);
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
function loadFooter() {
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

// 記事一覧の作成
function loadArticles() {
  const articleList = document.getElementById('article-list');
  if (!articleList) return;

  fetch('/data/articles.json')
    .then(response => response.json())
    .then(allArticles => {
      const articles = allArticles
        .filter(article => article.lang.includes(lang))
        .sort((a, b) => new Date(b.created) - new Date(a.created));

      fetch('/includes/article-summary.html')
        .then(response => response.text())
        .then(template => {
          articles.forEach(file => {
            fetch("articles/" + file.filename)
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
                length = siteSettings.introLength[lang] ?? siteSettings.introLength.default;

                const intro = extractHtmlSnippet(
                  mainText,
                  length,
                  ` <a href="articles/${file.filename}" class="read-more-link">......${t.readMore}</a>`
                );

                const summary = template
                  .replace(/{{title}}/g, title)
                  .replace(/{{intro}}/g, intro)
                  .replace(/{{link}}/g, "articles/" + file.filename)

                const summaryDiv = document.createElement('div');
                summaryDiv.innerHTML = summary;
                articleList.appendChild(summaryDiv);
              })
              .catch(err => console.error('Error loading article:', err));
          });
        })
        .catch(err => console.error('Error loading article template:', err));
    })
    .catch(err => console.error('Error loading articles data:', err));
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