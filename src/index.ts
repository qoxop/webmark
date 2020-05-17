import mark from './core';
import {setConfig, Config, remove, removeAll, renderAll, query} from './localManager';

const DOMContentLoaded = new Promise(resolve => {
    window.addEventListener('load', function() {
        const styleElement = document.createElement('style');
        styleElement.innerHTML = `.qoxop_highlight {background: #f3f308;}`;
        document.head.appendChild(styleElement);
        setTimeout(() => {
            resolve();
        }, 10);
    });
});

interface Options extends Config {
    immediate?: boolean,
    onUrlChange?: boolean,
    delay?: number,
}

function init(options: Options = {}) {
    const config = setConfig(options);
    let pageId = config.pageHash(window.location.href);
    const {immediate, onUrlChange, delay = 500} = options;
    let cancelKey = 0;
    if (immediate) {
        DOMContentLoaded.then(renderAll);
    }
    if (onUrlChange) {
        const observer = new MutationObserver(() => {
            if (cancelKey !== 0) {
                clearTimeout(cancelKey);
            }
            // @ts-ignore
            cancelKey = setTimeout(() => {
                cancelKey = 0;
                const newPageId = config.pageHash(window.location.href);
                if (pageId !== newPageId) {
                    pageId = newPageId;
                    renderAll();
                }
            }, delay);
        });
        observer.observe(document.body, {childList: true, subtree: true });
    }
}
export {
    init,
    mark,
    remove,
    setConfig,
    removeAll,
    renderAll,
    query
}