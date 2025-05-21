import {
    applyInterpolateToDOM,
    importOneScript,
    loadContentsList,
    loadOneHTMLPartial,
    setupLanguageSwitcher,
    tagMatchingValuation,
    wrapFirstLetter,
    wrapInitials
} from './utils.js';

let config = {};
let lang = 'ja';
let params = {}
let settings = {};
let t = {};
let env = {
    "config": config,
    "lang": lang,
    "params": params,
    "settings": settings,
    "t": t
}

main();

async function main() {
    await initAppData();
    await loadDOM();
    await afterLoadingDOM();
}

async function initAppData() {
    await loadAppData();
    applyTheme();
}

async function loadDOM() {
    await addToHead();
    await Promise.all([
        addToBody(),
    ])
}

async function afterLoadingDOM() {
    // 変数の置き換え
    await applyInterpolateToDOM(document, env);

    // 文字の装飾
    wrapFirstLetter('h3','deco-done','first-letter');
    wrapInitials('h1','deco-done','initials');
    wrapInitials('h2','deco-done','initials');

    //言語切り替え
    setupLanguageSwitcher();

    // MathJaxのtypeset
    if (window.MathJax?.typesetPromise) {
        await MathJax.typesetPromise();
    } else {
        console.warn("MathJax.typesetPromise is not found.");
    }
}

// in beforeLoadDOM
async function loadAppData() {
    lang = location.pathname.split('/')[1];
    [config, settings, t] = await Promise.all([
        fetch('/data/config.json').then(res => res.json()),
        fetch('/data/settings.json').then(res => res.json()),
        fetch(`/locales/${lang}.json`).then(res => res.json()),
    ]);
    env.config = config;
    env.lang = lang;
    env.params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
    env.settings = settings;
    env.t = t;
}

function applyTheme() {
    const root = document.documentElement;
    const themeName = config.colors.theme;
    const themeData = config.colors.colorBook[themeName];

    if (!themeData) {
        console.warn(`Theme "${themeName}" not found in config.colors.colorBook`);
        return;
    }

    const cssVarMap = {
        '--theme-dark': 'themeDarkColor',
        '--theme-light': 'themeLightColor',
        '--theme-tp-dark': 'themeTransparentDarkColor',
        '--theme-tp-light': 'themeTransparentLightColor',
        '--theme-text': 'themeTextColor',
        '--theme-bg': 'themeBackgroundColor',
        '--theme-tp-bg': 'themeTransparentBackground',
        '--accent-color': 'accentColor',
    };

    for (const [cssVar, jsonKey] of Object.entries(cssVarMap)) {
        if (themeData[jsonKey]) {
            root.style.setProperty(cssVar, themeData[jsonKey]);
        }
    }

    root.style.setProperty('--icon-image-dark', `url(${themeData.iconImageDark})`);
    root.style.setProperty('--icon-image-light', `url(${themeData.iconImageLight})`);
}

// in loadDOM
async function addToHead () {
    if (document.body.dataset.tags?.includes('mathjax')) {
        window.MathJax = {
            tex: {
            inlineMath: config.mathjax.tex.inlineMath,
            displayMath: config.mathjax.tex.displayMath,
            processEscapes: config.mathjax.tex.processEscapes,
            tags: config.mathjax.tex.tags
            },
            options: {
            skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
            renderActions: {
                addMenu: []
            }
            }
        };
    }

    try {
        await tagMatchingValuation(
            [settings.scripts,config.scripts],
            importOneScript,
            ['url','defer']
        );
    } catch (err) {
        console.error('importScripts error:', err);
    }
}

async function addToBody() {
    try {
        await tagMatchingValuation(
            [settings.htmlPartials,config.htmlPartials],
            loadOneHTMLPartial,
            ['url','target','position']
        );
    } catch (err) {
        console.error('loadOneHTMLPartial error:', err);
    }
    try {
        if (!window.pluralize) {
            throw new Error("window.pluralize is not available");
        }
        await loadContentsList(window.pluralize, env);
    } catch (err) {
        console.error("addToBody error:", err);
    }
}