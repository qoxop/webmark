import {setAfterMark, render, setMarkTagName, setDefaultClass} from './core';
import {MarkInfo} from './types';

let pageHashPrefix = 'qoxop_mark_';

interface Config {
    uPageHash?: (href: string) => string,
    pageHashPrefix?: string
    getPageInfo?: () => any,
    markTagName?: string,
    defaultClassName?: string,
    [key: string]: any
}
const config: Config = {
    pageHashPrefix,
    uPageHash: (href: string) => pageHashPrefix + href.replace(location.origin, ''),
    getPageInfo: () => ({title: document.title})
}
interface Store {
    [key: string]: {
        marks: MarkInfo[],
        pageInfo: any
    }
}
const AllMarkInfosMap:Store = {};

function getAllMarks() {
    const {uPageHash, getPageInfo} = config;
    const hash = uPageHash(window.location.href)
    if (!AllMarkInfosMap[hash]) {
        AllMarkInfosMap[hash] = JSON.parse(window.localStorage.getItem(hash)) || {marks: [], pageInfo: getPageInfo()}
    }
    return AllMarkInfosMap[hash];
}

function setConfig(options: Config = {}) {
    Object.keys(options).forEach(key => {
        const value = options[key];
        if (config[key]) {
            config[key] = value;
        } else if (key === 'markTagName') {
            setMarkTagName(value);
        } else if (key === 'defaultClassName') {
            setDefaultClass(value);
        }
    })
    pageHashPrefix = config.pageHashPrefix;
    return config;
}

function renderAllMarks() {
    return getAllMarks().marks.every(item => render(item))
}
function delMark(id: string, allRmHandler?: (clear: Function, marks: MarkInfo[]) => void) {
    const allMarks = getAllMarks()
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
            const {uPageHash} = config;
            const hash = uPageHash(window.location.href);
            allRmHandler(() => {
                allMarks.marks = [];
                window.localStorage.setItem(hash, JSON.stringify(allMarks))
            }, allMarks.marks)
        }   
    }
}

function exportToJson() {
    return Object.keys(localStorage)
        .filter(key => key.indexOf(pageHashPrefix) === 0)
        .reduce((dateset, key) => ({...dateset, [key]: localStorage[key]}), {})

}
// TODO 优化清除页面副作用的方式
function clearAllMark() {
    Object.keys(localStorage)
        .filter(key => key.indexOf(pageHashPrefix) === 0)
        .forEach(key => localStorage.removeItem(key));
    window.location.reload();
}

setAfterMark((mi: MarkInfo) => {
    const {uPageHash, getPageInfo} = config;
    const hash = uPageHash(mi.href);
    // @ts-ignore
    const storeMi = {...mi, container: {...mi.container, elem: undefined}, textNodes: {...mi.textNodes, all: undefined}}
    if (!AllMarkInfosMap[hash]) {
        AllMarkInfosMap[hash] = {
            marks: [storeMi],
            pageInfo: getPageInfo()
        }
    } else {
        AllMarkInfosMap[hash].marks.push(storeMi)
    }
    window.localStorage.setItem(hash, JSON.stringify(AllMarkInfosMap[hash]))
})
export {
    Config,
    delMark,
    setConfig,
    exportToJson,
    clearAllMark,
    renderAllMarks,
}