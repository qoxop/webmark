import mark from './core';
import {setConfig, Config, delMark, clearAllMark, renderAllMarks, exportToJson} from './localManager';

interface Options extends Config {
    immediate?: boolean,
    onUrlChange?: boolean,
    delay?: number,
}

function init(options: Options) {
    const config = setConfig(options);
    let pageId = config.uPageHash(window.location.href);
    const {immediate, onUrlChange, delay = 500} = options;
    let cancelKey = 0;
    if (immediate) {
        window.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                renderAllMarks()
            })
        })
    }
    if (onUrlChange) {
        const observer = new MutationObserver(() => {
            if (cancelKey !== 0) {
                clearTimeout(cancelKey);
            }
            cancelKey = setTimeout(() => {
                cancelKey = 0;
                const newPageId = config.uPageHash(window.location.href);
                if (pageId !== newPageId) {
                    pageId = newPageId;
                    renderAllMarks();
                }
            }, delay)
        });
        observer.observe(document.body, {childList: true, subtree: true })
    }
}
export {
    init,
    delMark,
    setConfig,
    exportToJson,
    clearAllMark,
    renderAllMarks,
}

export default mark;