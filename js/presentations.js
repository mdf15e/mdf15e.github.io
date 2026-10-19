// Number the complete list before selecting invited presentations for Home.
export function preparePresentations(source, invitedOnly = false) {
    const list = source.querySelector('ol.bracketed').cloneNode(true);
    const presentations = [...list.children];
    presentations.forEach((item, index) => {
        item.value = presentations.length - index;
        if (invitedOnly && !item.querySelector('.talk-invited')) item.remove();
    });
    list.reversed = true;
    if (list.firstElementChild) list.start = list.firstElementChild.value;
    return list;
}

export async function loadPresentations(language) {
    const containers = [...document.querySelectorAll('[data-presentations]')];
    if (!containers.length) return;

    try {
        const response = await fetch('/includes/presentations.html');
        if (!response.ok) throw new Error(`Presentations: HTTP ${response.status}`);
        const source = new DOMParser().parseFromString(await response.text(), 'text/html').body;
        if (!source.querySelector('ol.bracketed > li')) throw new Error('Presentation list is empty');
        containers.forEach(container => {
            container.replaceChildren(preparePresentations(
                source, container.hasAttribute('data-presentations-invited-only')
            ));
        });
    } catch (error) {
        console.error('Unable to load presentations:', error);
        containers.forEach(container => {
            const message = document.createElement('p');
            message.setAttribute('role', 'alert');
            message.textContent = language === 'ja'
                ? '発表一覧を読み込めませんでした。ページを再読み込みしてください。'
                : 'Unable to load presentations. Please reload the page.';
            container.replaceChildren(message);
        });
    }
}
