window.addEventListener('load', () => {
    webmark.init({
        immediate: true
    });
    var tipsBar = document.getElementById('mark_tips_bar');
    var tipsBarShowing = false;
    var curSelection = null;
    window.addEventListener('mouseup', event => {
        curSelection = window.getSelection()
        if (!curSelection.isCollapsed && !tipsBarShowing && event.button === 0) {
            tipsBarShowing = true;
            tipsBar.style.display = 'inline-flex';
            tipsBar.style.top = `${event.clientY}px`;
            tipsBar.style.left = `${event.clientX}px`;
        } else {
            tipsBarShowing = false;
            tipsBar.style.display = 'none';
        }
    })
    var delBtn = document.getElementById('del_mark_btn')
    window.oncontextmenu = function(e) {
        var id = e.target.getAttribute ? e.target.getAttribute('mark_id') : ''
        if (!!id) {
            delBtn.style.top = (e.clientY - 40) + 'px';
            delBtn.style.left = (e.clientX - 15) + 'px';
            delBtn.style.display = 'block';
            delBtn.onclick = () => webmark.remove(id)
            e.preventDefault();
            return false;
        } else {
            delBtn.style.display = 'none';
        }
    }
    document.onclick = () => {
        delBtn.style.display = 'none';
    }
    tipsBar.onmousedown = (event) => {
        event.preventDefault();
        tipsBarShowing = false;
        tipsBar.style.display = 'none';
        webmark.mark({
            className: event.target.getAttribute('class'),
            selection: curSelection
        })
    }
    document.getElementById('clear_marks_btn').onclick = function () {
        webmark.removeAll()
    }
})