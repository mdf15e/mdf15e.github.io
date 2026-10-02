// The HTML partial is the single source of publication content, newest first.
export function preparePublications(source, language, limit = Infinity) {
    const fragment = source.cloneNode(true);
    fragment.querySelectorAll('[data-publication-lang]').forEach(element => {
        if (element.dataset.publicationLang !== language) element.remove();
    });

    const papers = [...fragment.querySelectorAll('ol.bracketed > li')];
    papers.forEach((paper, index) => { paper.value = papers.length - index; });
    fragment.querySelectorAll('ol.bracketed').forEach(list => {
        list.reversed = true;
        if (list.firstElementChild) list.start = list.firstElementChild.value;
    });

    if (Number.isFinite(limit)) {
        const list = fragment.querySelector('ol.bracketed').cloneNode(false);
        list.replaceChildren(...papers.slice(0, limit));
        fragment.replaceChildren(list);
    }
    return fragment;
}

export async function loadPublications(language) {
    const containers = [...document.querySelectorAll('[data-publications]')];
    if (!containers.length) return;

    try {
        const response = await fetch('/includes/publications.html');
        if (!response.ok) throw new Error(`Publications: HTTP ${response.status}`);
        const source = new DOMParser().parseFromString(await response.text(), 'text/html').body;
        if (!source.querySelector('ol.bracketed > li')) throw new Error('Publication list is empty');

        containers.forEach(container => {
            const limit = container.hasAttribute('data-publications-limit')
                ? Number(container.dataset.publicationsLimit) : Infinity;
            const content = preparePublications(source, language, limit);
            container.replaceChildren(...content.childNodes);
        });
    } catch (error) {
        console.error('Unable to load publications:', error);
        containers.forEach(container => {
            const message = document.createElement('p');
            message.setAttribute('role', 'alert');
            message.textContent = language === 'ja'
                ? '論文一覧を読み込めませんでした。ページを再読み込みしてください。'
                : 'Unable to load publications. Please reload the page.';
            container.replaceChildren(message);
        });
    }
}
