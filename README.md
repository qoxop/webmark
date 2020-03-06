# webmark (waiting....)

简单易用的网页文本标记工具。

标记原理是使用`window.getSelection` API 获取到选中的文本节点，并包裹一层自定义的标签(默认是<marks class="qoxop_highlight" />), 默认标签名和样式名可以通过 `init` 或 `setConfig` 方法修改。

**说明**：默认使用`localStorage`对`mark数据`进行存储管理。由于同一个域下一般存在多个页面(或者一些spa的场景)，所以每一个页面的`mark数据`对应`localStorage`的某一项。如果不想使用存储功能可以直接引入 `webmark/lib/core.js`文件。



## 安装

使用`npm`
```
npm install webmark --save
```
使用浏览器, 下载 [webmark.js](http://files.codcats.com/webmark.js) 直接在html中引入
```html
 <script src="./webmark.js"></script>
```


## API
- `setConfig` : 设置默认值
- `init` : 设置默认值，配置初始化渲染时机
- `mark` : 标记通过鼠标或触控板选中的文本
- `remove` : 通过 `mark_id` 删除一个标记
- `removeAll` : 移除所有的
- `renderAll` : 渲染所有存在localStorage中的标记信息
- `query` : 一个标记查询对象

### setConfig(config: Config)

设置默认值，告诉 `webmark` 怎样存储和标记


```typescript
interface Config {
    pageHash?: (href: string) => string, // 获取当前页面的唯一标识函数，该标识将用于存储的key值
    pageHashPrefix?: string,             // 用于localStorage的key值前缀，必须足够特别，避免冲突
    getPageInfo?: () => any,             // 获取当前页面信息
    markTagName?: string,                // 默认 tagname         
    defaultClassName?: string,           // 默认 className
    [key: string]: any
}

```

### init(options: Options)

`init` 内部会调用 `setConfig` 方法对默认值进行设置，同时如果设置 `immediate = true`, 将会在页面加载结束( `DOMContentLoaded` )时自动渲染存储在 `localStorage` 中的 `mark数据`

如果是`spa`等单页应用，可以自行调用`setConfig` 和 `renderAll` 方法自行决定渲染时机。

```typescript
interface Options extends Config {
    immediate?: boolean,                // 页面加载结束立即渲染
    onUrlChange?: boolean,              // url 变化时自动渲染(等待dom结构稳定)
    delay?: number,                     // 等待时间
}

```

### mark(options?: MarkOptions)

调用 `mark` 方法对选中文本进行标记，如果不存在选中的文本`mark()`返回`false`。
你可以传入参数设置它的样式或者其他信息。

注意`mark`的调用时机，onclick事件或者ontouch事件会使Selections失去焦点，导致标记失败，正确的做法是利用onmousedown、ontouchstart或键盘事件等来触发
`mark` 方法。
```typescript
interface MarkOptions {
    style?: any,            // style对象（键名用驼峰命名）
    className?: string,     // css类名
    meta?: string,          // 额外信息，将会对mark标签调用 setAttribute('meta_data', JSON.stringify(mark.meta))
}
```

### remove(markId: string)

每一个`marks`元素上都有一个 `mark_id` 属性，可以通过`markElem.getAttribute('mark_id')` 获取得到，将它传递给`remove` 方法就一个删除一个标记了.

注意：`remove` 并不会真正清除标记对页面的副作用(marks标签还是挂在dom结构上)，它仅仅只是移除了该标记所有的样式，除非标记全部删除(此时将会对页面的marks标签进行一次清除，并调用 `document.normalize()` 修复被分隔的文本)

### removeAll(options?: RemoveAllOpt)

清空所有的标记，并解除页面副作用，默认只清空当前页面。

当开启了 `retainTexts` 文本将会以字符串数组的形式存储在`localStorage`里，`key` 值的格式：`history_${pageHashPrefix}_xxxxx}`,
```
interface MarkOptions {
    domain?: boolean,       // 是否清空当前域名下的所有mark数据
    retainTexts?: boolean   // 是否保留标记的文本信息
}
```

### renderAll()

将当前页面存储于`localStorage`中的`mark数据`进行渲染,渲染成功返回 `true`，如果页面结构已经发生改变，那么渲染失败，会调用 `removeAll({retainTexts:  true})`并返回 `false`

### query

用于获取`marks数据`的对象，包含如下两个方法：

- `query.marks(): Store`: 返回返回当前域名下所有的`marks数据`
- `query.texts(includeHistory?: boolean): TextSet`: 返回返回当前域名下所有标记文本

## 数据类型

- 对选中区域的的描述
```typescript
interface SelectionInfo {
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

```
- 对标记文本的描述
```typescript
interface MarkOptions {
    style?: any,
    className?: string,
    meta?: string,
}
type MarkInfo = SelectionInfo & MarkOptions
```

- `mark数据`在 `localStorage` 的存储结构
```typescript
interface Store {
    [PrefixPageHash: string]: {
        marks: MarkInfo[],
        pageInfo: any       // === Config.getPageInfo()
    }
}
```
- 历史标记文本或者导出文本的数据结构
```
interface TextSet {
    [historyOrPageKey: string]: string[] 
    // history_${pageHashPrefix}
}
```