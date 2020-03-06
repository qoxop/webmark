export interface MarkOptions {
    style?: any,
    className?: string,
    meta?: string,
}

/**
 * 选中区域的描述信息
 */
export interface SelectionInfo {
    id: string,
    unused?: boolean,    
    container: { index: number, tagname: string, elem?: HTMLElement | Node},
    textNodes: {
        start: {index: number, split: number}
        end: {index: number, split: number}
        all?: Text[]
        startEndChunk: string
    },
    href: string,
    time: number,
    text: string
}
export type MarkInfo = SelectionInfo & MarkOptions