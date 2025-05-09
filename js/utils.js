export function extractHtmlSnippet(domNode, limit = 100, suffix = '') {
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
      if (node.tagName.toLowerCase() === 'p' || node.tagName.toLowerCase() === 'div' && node.classList.contains('content-text')) {
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

  const wrapper = document.createElement('div'); // 外側に1つだけ <p>
  wrapper.appendChild(snippetNode);
  if (reachedLimit && suffix) {
    const suffixSpan = document.createElement('span');
    suffixSpan.innerHTML = suffix;
    wrapper.appendChild(suffixSpan);
  }

  return wrapper.outerHTML;
}

export function importPluralize() {
  return new Promise((resolve, reject) => {
    if (window.pluralize) {
      resolve(window.pluralize); // 👈 関数を返す
      return;
    }

    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/pluralize@8.0.0/pluralize.min.js";
    script.onload = () => resolve(window.pluralize);
    script.onerror = () => reject(new Error("Failed to load pluralize"));
    document.head.appendChild(script);
  });
}

export function insertContentHeading(typeToLabel) {
  document.querySelectorAll('div.content[data-content-type]').forEach(div => {
    const previous = div.previousElementSibling;
    if (previous?.classList.contains('content-heading')) return;

    const type = div.dataset.contentType?.toLowerCase();
    const label = typeToLabel[type];

    if (!label) return;

    const heading = document.createElement('h2');
    heading.className = 'designed content-heading';
    heading.textContent = label;

    div.parentNode.insertBefore(heading, div);
  });
}

export function loadSnsLinks(snsdata){
  const snsLinks = document.querySelectorAll('.sns-link');
  if (snsLinks.length === 0) return;

  snsLinks.forEach(link => {
    const platform = link.dataset.platform.toLowerCase();
    
    if(snsdata[platform] && snsdata[platform].url && snsdata[platform].url !== ''){
      const url = snsdata[platform].url;

      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      const icon = snsdata[platform].icon;
      if(icon){
        const img = document.createElement('img');
        img.src = icon;
        img.alt = platform;
        img.style.width = '1.5em';
        img.style.height = '1.5em';
        img.style.margin = '0 0.2em';
        a.appendChild(img);
      } else {
        a.textContent = platform;
      };

      link.replaceWith(a);
    } else {
      console.warn(`SNS link for ${platform} not found in site settings.`);
    }
  })
}

export async function safeAsync(promise) {
  try {
    const result = await promise;
    return [null, result];
  } catch (err) {
    return [err, null];
  }
}

export function setFavicon(url, type) {
  let favicon = document.querySelector('link[rel="icon"]');
  if (favicon) return;

  favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.href = url;
  favicon.type = type ? type : 'image/' + url.split('.').pop();
  document.head.appendChild(favicon);
}

export function switchLang(targetLang, supportedLangs) {
    const currentPath = location.pathname;
    const currentLang = currentPath.split('/')[1];
  
    if (!supportedLangs.includes(targetLang)) {
      console.warn('Unsupported language:', targetLang);
      return;
    }

    let newPath;
    if (supportedLangs.includes(currentLang)) {
      newPath = currentPath.replace(`/${currentLang}/`, `/${targetLang}/`);
    } else {
      newPath = `/${targetLang}${currentPath}`;
    }
  
    location.pathname = newPath;
}

export function wrapContentTitle() {
  const titles = document.querySelectorAll('.content .content-title');
  titles.forEach(title => {
    if (title.querySelector('.first-letter')) return;

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

    const textNode = findFirstTextNode(title);
    if (!textNode) return;

    const text = textNode.textContent.trim();
    if (!text || text.length === 0) return;

    const firstLetter = text.charAt(0);
    const rest = text.slice(1);

    const span = document.createElement('span');
    span.className = 'first-letter';
    span.textContent = firstLetter;

    const restText = document.createTextNode(rest);

    const parent = textNode.parentNode;
    parent.insertBefore(span, textNode);
    parent.insertBefore(restText, textNode);
    parent.removeChild(textNode);
  });
}

export function wrapDesignedText() {
  const targets = document.querySelectorAll('.designed');

  targets.forEach(el => {
    if (el.querySelector('.initial')) return;

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
      const parts = textNode.textContent.split(/([ \-･]+)/);

      const fragment = document.createDocumentFragment();

      parts.forEach(part => {
        if (part.match(/([ \-･]+)/)) {
          fragment.appendChild(document.createTextNode(part));
        } else if (part.length > 0) {
          const span = document.createElement('span');
          span.className = 'initial';
          span.textContent = part.charAt(0);
          fragment.appendChild(span);
          if (part.length > 1) {
            fragment.appendChild(document.createTextNode(part.slice(1)));
          }
        }
      });

      textNode.parentNode.replaceChild(fragment, textNode);
    });

    el.classList.remove('designed');
    el.classList.add('design-done');
  });
}
