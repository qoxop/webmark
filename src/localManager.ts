import {setAfterMark, render, setMarkTagName, setDefaultClass} from './core';
import {MarkInfo} from './types';

let pageHashPrefix = 'qoxop_mark_';

interface Config {
    pageHash?: (href: string) => string,
    pageHashPrefix?: string,
    getPageInfo?: () => any,
    markTagName?: string,
    defaultClassName?: string,
    [key: string]: any
}
const config: Config = {
    pageHashPrefix,
    pageHash: (href: string) => pageHashPrefix + href.replace(location.origin, ''),
    getPageInfo: () => ({title: document.title})
}
interface Store {
    [PrefixPageHash: string]: {
        marks: MarkInfo[],
        pageInfo: any
    }
}
const MarkStore:Store = {};

/**
 *  清除页面副作用
 * @param marks 
 */
function clearDomSideEffect(marks: MarkInfo[]) {
    marks.reverse().forEach(item => {
        const domArray = Array.from(document.getElementsByClassName(item.id) || []);
        domArray.forEach(elem => elem.replaceWith(elem.firstChild))
    })
    document.normalize();
}

/**
 * 获取当前页面的所有标记
 */
function getCurrentPageMarks() {
    const {pageHash, getPageInfo} = config;
    const hash = pageHash(window.location.href)
    if (!MarkStore[hash]) {
        MarkStore[hash] = JSON.parse(window.localStorage.getItem(hash)) || {marks: [], pageInfo: getPageInfo()}
    }
    return MarkStore[hash];
}

/**
 * 设置配置项
 * @param options 
 */
function setConfig(options: Config = {}) {
    const obj = Object.assign({markTagName: 'span', defaultClassName: 'qoxop_highlight'}, options)
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (key === 'markTagName') {
            setMarkTagName(value);
        } else if (key === 'defaultClassName') {
            setDefaultClass(value);
        } else {
            config[key] = value;
        } 
    })
    pageHashPrefix = config.pageHashPrefix;
    return config;
}

/**
 * 渲染当前页的所有标记
 */
function renderAll() {
    document.normalize();
    const allmarks = getCurrentPageMarks();
    console.log(allmarks)
    if (!allmarks || !allmarks.marks || allmarks.marks.length === 0) {
        return true;
    }
    const elems = document.getElementsByClassName(allmarks.marks[0].id);
    if (elems && elems.length > 0) {
        return true;
    }
    if (!allmarks.marks.every(item => render(item))) {
        removeAll({domain: false, retainTexts: true})
    }
    return true;
}

/**
 * 移除标记
 * @param id 
 * @param allRmHandler 
 */
function remove(id: string, allRmHandler?: (clear: Function, marks: MarkInfo[]) => void) {
    const allMarks = getCurrentPageMarks()
    allMarks.marks.some(item => {
        if (id === item.id && !item.unused) {
            const elems = document.getElementsByClassName(id)
            // 删除class
            const elemArr: HTMLElement[] = Array.prototype.slice.call(elems);
            elemArr.forEach(elem => elem.setAttribute('class', id));
            item.unused = true;
            return true;
        }
    })

    if (allMarks.marks.every(item => item.unused)) {
        if (allRmHandler) {
            allRmHandler(() => {
                allMarks.marks = [];
                removeAll({domain: false, retainTexts: false})
            }, allMarks.marks)
        } else {
            removeAll({domain: false, retainTexts: false})
        }
    } else {
        const {pageHash} = config;
        const hash = pageHash(window.location.href);
        window.localStorage.setItem(hash, JSON.stringify(allMarks))
    }
}

interface TextSet {
    [key: string]: string[]
}
/**
 * 标记文本查询
 */
const query = {
    marks() {
        return Object.keys(localStorage)
        .filter(key => key.indexOf(pageHashPrefix) === 0)
        .reduce((dateset, key) => ({
            ...dateset,
            [key]: JSON.parse(localStorage[key])
        }), {}) as Store;
    },
    texts(includeHistory?: boolean) {
        let historys = {};
        if (includeHistory) {
            historys = Object.keys(localStorage)
                .filter(key => key.indexOf(`history_${pageHashPrefix}_`) === 0)
                .reduce((dateset, key) => ({
                    ...dateset,
                    [key]: JSON.parse(localStorage[key])
                }), {})
        }
        const marks = query.marks();
        return Object.keys(marks).reduce((dataset, key) => ({
            ...dataset,
            [key]: marks[key].marks.map(m => m.text)
        }), historys) as TextSet; 
    }
}

interface RemoveAllOpt {
    domain?: boolean,
    retainTexts?: boolean
}
/**
 * 清除所有标记
 * @param params 
 */
function removeAll(options: RemoveAllOpt = {}) {
    const {domain, retainTexts} = ({domain: false, retainTexts: false, ...options})
    const pageHash = config.pageHash(window.location.href);
    let markSet: MarkInfo[] = [];
    Object.keys(localStorage)
        .filter(key => {
            if (domain === true) {
                return key.indexOf(pageHashPrefix) === 0;
            } else {
                return key === pageHash
            }
        })
        .forEach(key => {
            try {
                const marks: MarkInfo[] = JSON.parse(localStorage.getItem(key) || '{}').marks
                markSet = markSet.concat(marks);
                if (retainTexts) { // 保存文本备份
                    const historys = JSON.parse(localStorage.getItem(`history_${pageHashPrefix}`) || '[]')
                    localStorage.setItem(
                        `history_${pageHashPrefix}`,
                        JSON.stringify(historys.concat(marks.map(item => item.text)))
                    )
                }
            } catch (error) {
                console.error(error)
            }
            localStorage.removeItem(key);
            delete MarkStore[key]
        });
    // 清除页面副作用的方式
    clearDomSideEffect(markSet)
}

/**
 * 标记后存储
 */
setAfterMark((mi: MarkInfo) => {
    const {pageHash, getPageInfo} = config;
    const hash = pageHash(mi.href);
    const storeMi = mi;
    delete storeMi.textNodes.all;
    delete storeMi.container.elem;
    if (!MarkStore[hash]) {
        MarkStore[hash] = {
            marks: [storeMi],
            pageInfo: getPageInfo()
        }
    } else {
        MarkStore[hash].marks.push(storeMi)
    }
    window.localStorage.setItem(hash, JSON.stringify(MarkStore[hash]))
})
export {
    Config,
    remove,
    setConfig,
    removeAll,
    renderAll,
    query
} 