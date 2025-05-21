export async function applyInterpolateToDOM(root, env) {
    for (const node of root.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = await interpolate(node.textContent, env);
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            for (const attr of node.attributes) {
                attr.value = await interpolate(attr.value, env);
            }

            await applyInterpolateToDOM(node, env);
        }
    }
}

async function buildContentSummary(filename, meta, index, contentTypeS, template, env) {
    const {config, lang, t} = env;
    const pathToContent = `${contentTypeS}/${filename}`;
    const res = await fetch(pathToContent);
    if (!res.ok) {
        console.warn(`Missing file: ${pathToContent}`);
        return null;
    }

    const html = await res.text();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const title = tempDiv.querySelector('.content-title')?.textContent.trim() || t.noTitle;
    const mainText = tempDiv.querySelector('.content-text') || (() => {
        const fallback = document.createElement('div');
        fallback.innerHTML = t.noIntro;
        return fallback;
    })();

    const introLength = config.contentSummary.introLength[lang] ?? config.contentSummary.introLength['ja'];
    const intro = extractHtmlSnippet(
        mainText,
        introLength,
        ` <a href="${pathToContent}" class="read-more-link">......${t.readMore}</a>`
    );

    const summaryHTML = template
        .replace(/{{title}}/g, title)
        .replace(/{{createdOn}}/g, t.createdOn)
        .replace(/{{createdDate}}/g, meta.created)
        .replace(/{{intro}}/g, intro)
        .replace(/{{link}}/g, pathToContent);

    const summaryDiv = document.createElement('div');
    summaryDiv.innerHTML = summaryHTML;

    return { index, element: summaryDiv };
}

function createSystemMessage(message, classToAdd, title="") {
    const div = document.createElement('div');
    if (title && title.length > 0) {
        const divTitle = document.createElement('h3');
        divTitle.className = `box-title`;
        divTitle.textContent = title;
        div.append(divTitle);
        div.append(document.createElement('hr'));
    }
    div.className = `box system-message ${classToAdd}`;
    const divMessage = document.createElement('p');
    divMessage.className = "system-message-text";
    divMessage.textContent = message;
    div.append(divMessage);
    return div
}

function extractHtmlSnippet(domNode, limit = 100, suffix = '') {
    let count = 0;
    let reachedLimit = false;

    function cloneWithLimit(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (reachedLimit) return null;

            const text = node.textContent;
            const remaining = limit - count;

        if (text.length <= remaining) {
            count += text.length;
            return document.createTextNode(text);
        } else {
            count += remaining;
            reachedLimit = true;
            return document.createTextNode(text.slice(0, remaining));
        }
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            if (
                node.tagName.toLowerCase() === 'p'
                || node.tagName.toLowerCase() === 'div'
                && node.classList.contains('content-text')
            ) {
                const fragment = document.createDocumentFragment();
                for (const child of node.childNodes) {
                    const limitedChild = cloneWithLimit(child);
                    if (limitedChild) fragment.appendChild(limitedChild);
                    if (reachedLimit) break;
                }
            return fragment;
            }

            const clone = node.cloneNode(false);
            for (const child of node.childNodes) {
                const limitedChild = cloneWithLimit(child);
                if (limitedChild) clone.appendChild(limitedChild);
                if (reachedLimit) break;
            }
        return clone;
        }

        return null;
    }

    const snippetNode = cloneWithLimit(domNode);
    if (!snippetNode) return '';

    const wrapper = document.createElement('div');
    wrapper.appendChild(snippetNode);
    if (reachedLimit && suffix) {
        const suffixSpan = document.createElement('span');
        suffixSpan.innerHTML = suffix;
        wrapper.appendChild(suffixSpan);
    }

    return wrapper.outerHTML;
}

export function importOneScript(url, deferFlag = true) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src = "${url}"]`)){
        resolve();
        return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.defer = deferFlag;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
    });
}

export async function interpolate(template, env) {
    const config = env.config;
    const lang = env.lang;
    const unknown = '???';

    const specialKeys = {
        lang: () => lang ?? unknown,
        langLabel: () => config.langs?.[lang] ?? unknown,
        altlang: () => lang === 'ja' ? 'en' : 'ja',
        altlangLabel: () => {
            const alt = lang === 'ja' ? 'en' : 'ja';
            return config.langs?.[alt] ?? unknown;
        }
    };

    async function getValueFromPath(arg) {
        const [maybeUrl, maybePath] = arg.split(':');

        if (maybePath !== undefined) {
            const res = await fetch(maybeUrl);
            if (!res.ok) throw new Error(`Failed to fetch config at ${maybeUrl}`);
            const remoteConfig = await res.json();
            return maybePath.split('.').reduce((acc, key) => {
                return acc && typeof acc === 'object' && key in acc ? acc[key] : undefined;
            }, remoteConfig);
        } else {
            return maybeUrl.split('.').reduce((acc, key) => {
                return acc && typeof acc === 'object' && key in acc ? acc[key] : undefined;
            }, config);
        }
    }

    const matches = [...template.matchAll(/{{(.*?)}}/g)];

    const replacements = await Promise.all(
        matches.map(async ([fullMatch, key]) => {
            const trimmedKey = key.trim();
            let value;

            if (trimmedKey in specialKeys) {
                value = specialKeys[trimmedKey]();
            } else {
                try {
                    value = await getValueFromPath(trimmedKey);
                } catch (e) {
                    console.error(e);
                    value = unknown;
                }
            }

            return { match: fullMatch, value: value !== undefined ? value : unknown };
        })
    );

    let result = template;
    for (const { match, value } of replacements) {
        result = result.replaceAll(match, value);
    }

    return result;
}

async function loadContents(contentType, pluralize, env, currentPage) {
    const contentTypeS = pluralize(contentType).toLowerCase();
    const contentsList = document.getElementById(`${contentTypeS}-list`);
    if (!contentsList) {
        throw new Error(`Element with id ${contentTypeS}-list is not found.`);
    }

    const { config, lang, t } = env;
    const listRes = await fetch(`/data/contents_list/${contentTypeS}.json`);
    const allContentsObj = await listRes.json();
    if (!allContentsObj || typeof allContentsObj !== 'object') {
        throw new Error("JSON file is not found or is not a valid object.");
    }

    // entries: [filename, metadata]
    const allContents = Object.entries(allContentsObj);

    const orderedContents = allContents
        .filter(([_, meta]) => Array.isArray(meta.lang) && meta.lang.includes(lang))
        .sort((a, b) => new Date(b[1].created) - new Date(a[1].created));

    if (orderedContents.length === 0) {
        const message = t.noContents.replace(
            "{{contentType}}", config.contentTypes[contentType][lang]
        ) ?? 'No contents here.';
        const noContentsMessage = createSystemMessage(message, 'no-contents-message');
        contentsList.appendChild(noContentsMessage);
        return { renderPromise: Promise.resolve(), totalItems: 0 };
    }

    const itemsPerPage = config.contentSummary.itemsPerPage;
    const start = itemsPerPage * (currentPage - 1);
    const end = itemsPerPage * currentPage;
    const contents = orderedContents.slice(start, end);

    const templateRes = await fetch(`/includes/content-summary.html`);
    const template = await templateRes.text();

    const summaries = await Promise.all(
        contents.map(([filename, meta], index) =>
            buildContentSummary(filename, meta, index, contentTypeS, template, env)
        )
    );

    summaries
        .filter(Boolean)
        .sort((a, b) => a.index - b.index)
        .forEach(({ element }) => contentsList.appendChild(element));

    return orderedContents.length;
}

export async function loadContentsList(pluralize, env) {
    const config = env.config
    const tagsListRaw = document.body.dataset.tags || "";
    const tagsList = tagsListRaw.split(/\s+/).map(tag => tag.toLowerCase());
    const contentTypesList = Object.keys(config.contentTypes);
    try {
        const validTypes = contentTypesList.filter(word => tagsList.includes(pluralize(word) + "-list"));
        const rawPage = env.params.page;
        const page = Number.isInteger(Number(rawPage)) ? Number(rawPage) : 1;
        const promises = validTypes.map(contentType => renderPage(page, contentType, pluralize, env));
        await Promise.all(promises);
    } catch (err) {
        console.error(`loadContentsList error:`, err);
    }
}

export async function loadOneHTMLPartial(url, target, position) {
    const response = await fetch(url);
    const html = await response.text();

    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const container = document.querySelector(target);
    if (container) {
        container.insertAdjacentElement(position, tmp);
    } else {
        console.warn(`Target element "${target}" not found for partial "${url}"`);
    }
}

async function renderPage(page, contentType, pluralize, env) {
    const totalItems = await loadContents(contentType, pluralize, env, page);
    renderPagination(
        totalItems,
        env.config.contentSummary.itemsPerPage,
        page,
    );
}

function renderPagination(
    totalItems,
    itemsPerPage,
    currentPage,
    ) {
    if (!Number.isInteger(totalItems)) return;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages < 2 ) return;
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const createButton = (text, page) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = (page === currentPage) ? 'active' : '';

        btn.addEventListener('click', () => {
            const url = new URL(window.location.href);
            url.searchParams.set('page', page);
            window.location.href = url.toString();
        });

        return btn;
    };

    const createDots = () => {
        const dots = document.createElement('button');
        dots.textContent = "･･････";
        dots.className = "virtual-button";
        dots.disabled = true;
        return dots;
    };

    const integer = 1;
    const allBtns = integer * 2 + 1;
    if (totalPages <= allBtns + 4) {
        for (let i = 1; i <= totalPages; i++) {
            pagination.appendChild(createButton(String(i), i));
        }
    } else if (0 < currentPage && currentPage < allBtns + 2) {
        for (let i = 1; i <= allBtns + 2; i++) {
            pagination.appendChild(createButton(String(i), i));
        }
        pagination.appendChild(createDots());
        pagination.appendChild(createButton(String(totalPages), totalPages));
    } else if (allBtns + 2 <= currentPage && currentPage <= totalPages - allBtns -1) {
        pagination.appendChild(createButton(String(1), 1));
        pagination.appendChild(createDots());
        for (let i = currentPage - integer; i <= currentPage + integer; i++) {
            pagination.appendChild(createButton(String(i), i));
        }
        pagination.appendChild(createDots());
        pagination.appendChild(createButton(String(totalPages), totalPages));
    } else if (totalPages - allBtns - 1 < currentPage && currentPage <= totalPages) {
        pagination.appendChild(createButton(String(1), 1));
        pagination.appendChild(createDots());
        for (let i = totalPages - allBtns -1; i <= totalPages; i++) {
            pagination.appendChild(createButton(String(i), i));
        }
    } else {
        throw new Error('Page number is out of range');
    }
}

export function setupLanguageSwitcher() {
    const buttons = document.querySelectorAll('#language-switcher button')
    buttons.forEach(btn => btn.addEventListener('click', () => {
        const targetLang = btn.dataset.lang
        const currentPath = location.pathname;
        const currentLang = currentPath.split('/')[1];
        const newPath = currentPath.replace(`${currentLang}`,`${targetLang}`);
        location.pathname = newPath;
    }));
}

export async function tagMatchingValuation(contextsList, func, args, kwargs) {
    if (typeof func !== 'function') {
        throw new Error('Second argument must be a function');
    }
    const tagsListRaw = document.body.dataset.tags || "";
    const tagsList = tagsListRaw.split(/\s+/).map(tag => tag.toLowerCase());

    const shouldLoadScript = (item) => {
        if (item.loadToAllPages === true) return true;
        if (!Array.isArray(item.tags)) return false;
        return item.tags.some(tag => {
            if (tag.includes("__PLACEHOLDER__")) {
                const pattern = tag.replace("__PLACEHOLDER__", ".*");
                const regex = new RegExp(`^${pattern}$`, 'i');
                return item.tags.some(itemtag => regex.test(itemtag));
            }
            return tagsList.includes(tag.toLowerCase());
        });
    };

    const valuate = (context) => {
        return Object.values(context)
            .filter(shouldLoadScript)
            .map(item => {
                const newArgs = args.map(key => item[key]);
                return func(...newArgs, ...([kwargs] ? [kwargs] : []));
            });
    };

    const promises = contextsList.flatMap(valuate);
    await Promise.all(promises);
}

export function wrapFirstLetter(targetTag, doneClass, classToAdd) {
    const targets = document.querySelectorAll(targetTag);
    function findFirstTextNode(node) {
        for (let child of node.childNodes) {
            if (child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 0) {
                return child;
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const result = findFirstTextNode(child);
                if (result) return result;
            }
        }
        return null;
    }
    targets.forEach(target => {
        if (target.classList.contains(doneClass)) return;

        const textNode = findFirstTextNode(target);
        if (!textNode) return;

        const text = textNode.textContent.trim();
        if (!text || text.length === 0) return;

        const firstLetter = text.charAt(0);
        const rest = text.slice(1);

        const span = document.createElement('span');
        span.className = classToAdd;
        span.textContent = firstLetter;

        const restText = document.createTextNode(rest);

        const parent = textNode.parentNode;
        parent.insertBefore(span, textNode);
        parent.insertBefore(restText, textNode);
        parent.removeChild(textNode);

        target.classList.add(doneClass);
    });
}

export function wrapInitials(targetTag, doneClass, classToAdd) {
    const targets = document.querySelectorAll(targetTag);

    targets.forEach(el => {
        if (el.classList.contains(doneClass)) return;

        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
            acceptNode: node => {
            if (node.textContent.trim()) return NodeFilter.FILTER_ACCEPT;
            return NodeFilter.FILTER_REJECT;
            }
        });

        const textNodes = [];
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }

        textNodes.forEach(textNode => {
            const parts = textNode.textContent.split(/([ \-･/]+)/);

            const fragment = document.createDocumentFragment();

            parts.forEach(part => {
                if (part.match(/([ \-･/]+)/)) {
                    fragment.appendChild(document.createTextNode(part));
                } else if (part.length > 0) {
                    const span = document.createElement('span');
                    span.className = classToAdd;
                    span.textContent = part.charAt(0);
                    fragment.appendChild(span);
                    if (part.length > 1) {
                        fragment.appendChild(document.createTextNode(part.slice(1)));
                    }
                }
            });

            textNode.parentNode.replaceChild(fragment, textNode);
        });

        el.classList.add(doneClass);
    });
}