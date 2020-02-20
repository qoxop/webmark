
import {MarkInfo, MarkOptions, SelectionInfo} from './types'
let CustomTagName = 'marks';
let HighLightClass = 'qoxop_highlight';


/**
 * 获取首尾节点的字符串，用于校验标记是否作废
 * @param start
 * @param end 
 */
function countStartEndChunk(start: Node, end: Node) {
    return `${start.nodeValue}${end.nodeValue}`.trim()
}


/**
 * 查询node下的所有文本节点
 * @param {Node} node 
 */
function QueryAllTextNodes(node: Node): Text[] {
    const texts = []
    if (node) {
        if (document.createNodeIterator) {
            const textIterator = document.createNodeIterator(node, NodeFilter.SHOW_TEXT);
            let textNode = textIterator.nextNode();
            while(textNode) {
                texts.push(textNode);
                textNode = textIterator.nextNode();
            }
            return texts as Text[];
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                if (node.childNodes[i].hasChildNodes()) {
                    texts.push(...QueryAllTextNodes(node.childNodes[i]))
                } else if (node.childNodes[i].nodeType === Node.TEXT_NODE) {
                    texts.push(node.childNodes[i])
                }
            }
        }
    }
    return texts as Text[]
}

export function countSelectionInfo(): SelectionInfo|boolean  {
    const selection = window.getSelection()
    if (!selection.isCollapsed) {
        const range = selection.getRangeAt(0)
        const {startOffset, endOffset} = range;

        const selectionInfo: SelectionInfo = {
            id: window.btoa(`${Date.now() * Math.random()}${(Math.random()*100).toFixed(2)}`),
            container: { index: -1, tagname: ''},
            textNodes: {start: null, end: null, startEndChunk: ''},
            href: window.location.href,
            time: Date.now(),
            text: selection.toString()
        }
        // 寻找容器元素
        let containerElem: HTMLElement|Node  = range.commonAncestorContainer;
        while (true) {
            if(containerElem.nodeType === Node.ELEMENT_NODE || !containerElem) {
                break;
            }
            containerElem = containerElem.parentElement
        }

        // 记住node位置            
        const allTextNodes = QueryAllTextNodes(containerElem);
        for(let i = 0; i < allTextNodes.length; i++) {
            if (allTextNodes[i] === range.startContainer) {

                selectionInfo.textNodes.start = {
                    index: i,
                    split: startOffset
                };
            }
            if (allTextNodes[i] === range.endContainer) {
                selectionInfo.textNodes.end = {
                    index: i,
                    split: endOffset
                };
                break;
            }
        }
        selectionInfo.textNodes.all = allTextNodes
        selectionInfo.textNodes.startEndChunk = countStartEndChunk(range.startContainer, range.endContainer)
        // 记住元素位置
        const tags = document.getElementsByTagName(containerElem.nodeName);
        for (let i = 0; i < tags.length; i++) {
            if (tags.item(i) === containerElem) {
                selectionInfo.container.index = i;
                selectionInfo.container.tagname = containerElem.nodeName;
                selectionInfo.container.elem = containerElem;
                break;
            }
        }
        selection.removeAllRanges();
        return selectionInfo;
    }
    return false;
}



/**
 * 渲染标记文本
 * @param MarkInfo 
 */
function render(mark: MarkInfo): boolean {
    const {container, textNodes} = mark;
    const {start, end} = textNodes;
    const Wrp = document.createElement(CustomTagName)
    const className = `${HighLightClass} ${mark.className ? mark.className : ''}`
    Wrp.setAttribute(
        'class', 
        `${mark.unused ? '' : className} ${mark.id}`
    )
    Wrp.setAttribute('mark_id', mark.id)
    if (mark.style) {
        Object.keys(mark.style).forEach(key => {
            // @ts-ignore
            Wrp.style[key] = mark.style[key]
        })
    }
    if (mark.meta) {
        Wrp.setAttribute('meta_data', JSON.stringify(mark.meta))
    }
    if (!textNodes.all || textNodes.all.length < 1) {
        if (!(container.elem instanceof Element)) {
            const elems = document.getElementsByTagName(container.tagname);
            container.elem = elems.item(container.index)
        }
        textNodes.all = QueryAllTextNodes(container.elem)
        // check chunk
        if (textNodes.all &&  textNodes.all[start.index] && textNodes.all[end.index]) {
            const startEndChunk = countStartEndChunk(textNodes.all[start.index], textNodes.all[end.index]);
            if (textNodes.startEndChunk !== startEndChunk) {
                return false;
            }
        }
    }
    const WrpFn = (text: Node) => {
        const wrp: HTMLElement = Wrp.cloneNode() as HTMLElement ;
        wrp.innerHTML = text.nodeValue;
        text.parentNode.replaceChild(wrp, text);
    }
    if (start.index === end.index) {
        const nextText = textNodes.all[start.index].splitText(start.split).splitText(end.split - start.split)
        WrpFn(nextText.previousSibling)
        return true;
    }
    // containe
    for (let i = start.index + 1; i < end.index; i++) {
        WrpFn(textNodes.all[i])
    }
    const startText = textNodes.all[start.index].splitText(start.split);
    const endText = textNodes.all[end.index].splitText(end.split).previousSibling;
    WrpFn(startText);
    WrpFn(endText);
    return true;
}

const {setAfterMark, runAfters} = (() => {
    type AfterFn = (mi: MarkInfo, lastRes?: any) => any
    let fns: Array<AfterFn> = [];
    return {
        setAfterMark: (fn: AfterFn) => {
            fns.push(fn)
        },
        runAfters: (mi: MarkInfo) => {
            fns.reduce((old, fn) => (fn(mi, old)), null)
        }
    }
})()

const setMarkTagName= (tagname: string) => CustomTagName = tagname;
const setDefaultClass = (className: string) => HighLightClass = className;

export {
    render,
    setAfterMark,
    setMarkTagName,
    setDefaultClass,
}
export default function(options: MarkOptions = {}, callback?: (mi: MarkInfo, success: boolean) => any): MarkInfo|boolean| any  {
    const info = countSelectionInfo()
    let success = false;
    if (info !== false) {
        const mi = {...(info as SelectionInfo), ...options}
        success = render(mi)
        if (success) {
            runAfters(mi);
        }
        if (typeof callback === 'function') {
            callback(mi, success)
        }
    }
    return success;
}

