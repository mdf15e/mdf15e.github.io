import { importOneScript } from './utils.js';

export async function startMathJax(config, settings) {
    const tags = (document.body.dataset.tags || '').toLowerCase().split(/\s+/);
    if (!tags.includes('mathjax')) return null;

    // Configure before loading the script; render only after dynamic content is ready.
    window.MathJax = {
        startup: { typeset: false },
        tex: { ...config.mathjax.tex },
        options: {
            skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
            renderActions: { addMenu: [] },
        },
    };
    try {
        const script = config.scripts.MathJax || settings.scripts.MathJax;
        await importOneScript(script.url, script.defer);
        await window.MathJax.startup.promise;
        return window.MathJax;
    } catch (error) {
        // Handle failures immediately even while the page is still being assembled.
        console.error('Unable to load MathJax:', error);
        return null;
    }
}

export async function typesetMath(mathReady) {
    const math = await mathReady;
    if (!math) return;
    try {
        await math.typesetPromise();
    } catch (error) {
        console.error('Unable to typeset mathematics:', error);
    }
}
