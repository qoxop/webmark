import * as webmark from '../src/index'
window.addEventListener('load', () => {
    window.webmark = webmark
    webmark.init({
        immediate: true
    });
    var tipsBar = document.getElementById('mark_tips_bar');
    var tipsBarShowing = false;
    var curSelection = null;
    window.addEventListener('mouseup', event => {
        curSelection = window.getSelection()
        if (!curSelection.isCollapsed && !tipsBarShowing) {
            tipsBarShowing = true;
            tipsBar.style.display = 'inline-flex';
            tipsBar.style.top = `${event.clientY}px`;
            tipsBar.style.left = `${event.clientX}px`;
        } else {
            tipsBarShowing = false;
            tipsBar.style.display = 'none';
        }
    })
    tipsBar.onmousedown = (event) => {
        event.preventDefault();
        tipsBarShowing = false;
        tipsBar.style.display = 'none';
        console.log(webmark.mark({
            className: event.target.getAttribute('class'),
            selection: curSelection
        }))
    }
})