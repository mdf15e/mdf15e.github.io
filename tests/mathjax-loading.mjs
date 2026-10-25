import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const mainSource = (await read('js/main.js'))
    .replace(/^import[\s\S]*?from '[^']+';\s*/gm, '')
    .replace(/^main\(\);/m, '');
const mathSource = (await read('js/mathjax.js'))
    .replace(/^import[^\n]+\n/m, '').replace(/export /g, '');
const config = JSON.parse(await read('data/config.json'));
const settings = JSON.parse(await read('data/settings.json'));
const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
};
const flush = async () => { for (let i = 0; i < 50; i++) await Promise.resolve(); };

async function scenario({ tags = 'mathjax', fail = false, failStartup = false, failTypeset = false } = {}) {
    const events = [];
    const configReady = deferred();
    const download = deferred();
    const startup = deferred();
    const context = vm.createContext({
        console: { error: (...args) => events.push('error'), warn() {} },
        URLSearchParams,
        location: { pathname: '/en/index.html', search: '' },
        document: { body: { dataset: { tags } }, documentElement: { style: { setProperty() {} } } },
        window: { pluralize: word => word + 's', location: { search: '' } },
        fetch: async url => {
            await configReady.promise;
            return { json: async () => url.includes('config.json') ? config : url.includes('settings.json') ? settings : {} };
        },
        importOneScript: async () => {
            events.push('math-download');
            assert.equal(context.window.MathJax.startup.typeset, false);
            await download.promise;
            context.window.MathJax = {
                startup: { promise: startup.promise },
                typesetPromise: async () => {
                    events.push('typeset');
                    assert.ok(events.includes('interpolate'));
                    assert.ok(events.includes('startup-ready'));
                    if (failTypeset) throw new Error('Typesetting failure');
                },
            };
        },
        tagMatchingValuation: async (contexts, fn) => {
            if (fn === context.importOneScript) {
                assert.ok(contexts.every(c => !('MathJax' in c)));
                events.push('other-scripts');
            } else events.push('partials');
        },
        loadOneHTMLPartial() {},
        loadContentsList: async () => events.push('contents'),
        loadPublications: async () => events.push('publications'),
        loadPresentations: async () => events.push('presentations'),
        applyInterpolateToDOM: async () => {
            for (const required of ['partials', 'contents', 'publications', 'presentations']) assert.ok(events.includes(required));
            events.push('interpolate');
        },
        wrapFirstLetter() {}, wrapInitials() {},
        setupLanguageSwitcher: () => events.push('switcher'),
    });
    vm.runInContext(mathSource + '\n' + mainSource, context);
    const complete = vm.runInContext('main()', context);
    complete.catch(() => {});
    await flush();
    assert.ok(events.includes('publications'), 'Publications must not wait for configuration');
    assert.ok(events.includes('presentations'), 'Presentations must not wait for configuration');
    assert.ok(!events.includes('math-download'));
    configReady.resolve();
    await flush();
    assert.ok(events.includes('switcher'), 'Body must finish before MathJax resolves');
    assert.ok(!events.includes('typeset'));
    if (tags.includes('mathjax')) {
        if (fail) download.reject(new Error('CDN unavailable'));
        else {
            download.resolve();
            await flush();
            assert.ok(!events.includes('typeset'), 'Wait for MathJax startup, not just script onload');
            if (failStartup) startup.reject(new Error('Startup failure'));
            else { events.push('startup-ready'); startup.resolve(); }
        }
    }
    await complete;
    assert.equal(events.filter(e => e === 'typeset').length, tags.includes('mathjax') && !fail && !failStartup ? 1 : 0);
    if (!tags.includes('mathjax')) assert.ok(!events.includes('math-download'));
    assert.equal(events.includes('error'), fail || failStartup || failTypeset);
}
await scenario();
await scenario({ fail: true });
await scenario({ failStartup: true });
await scenario({ failTypeset: true });
await scenario({ tags: '' });
await scenario({ tags: 'notes-list mathjax' });
console.log('PASS: delayed CDN/startup, CDN/startup/typesetting failures, non-math page, content-list page; body independent and exactly one typeset.');
