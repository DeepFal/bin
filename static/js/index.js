const body = document.querySelector('body');
const form = document.querySelector('form');
const grid_form = document.querySelector('.grid_form');
const fileUpload = document.querySelector('.fileUpload');
const fileInput = document.querySelector('input#file-upload');
const upload_card = document.querySelector('#upload_card');
const textarea = document.getElementById('textarea_content');
const select = document.getElementById('ext');
const submitButton = document.querySelector('button[type="submit"]');
const searchWrapper = document.querySelector('.search-wrapper');

window.onload = () => {
    if (localStorage["forkText"] !== null) {
        const textArea = document.getElementById('textarea_content');
        textArea.textContent = localStorage["forkText"];
        localStorage.clear();
        onInput();
    }
}

const onInput = () => {
    const hasContent = !!textarea.value;
    submitButton.classList.toggle('hidden', !hasContent);
    select.classList.toggle('hidden', !hasContent);
    searchWrapper.classList.toggle('hidden', !hasContent);
    fileUpload.classList.toggle('hidden', hasContent);
}

textarea.addEventListener('input', onInput);
onInput();

const indent = (spaces = 4) => {
    let cursorPosition = textarea.selectionStart;
    const before = textarea.value.substring(0, cursorPosition);
    const after = textarea.value.substring(cursorPosition, textarea.value.length);

    // add 4 spaces
    textarea.value = before + ' '.repeat(spaces) + after;
    cursorPosition += spaces;

    // place the cursor accordingly
    textarea.selectionStart = cursorPosition;
    textarea.selectionEnd = cursorPosition;
    textarea.focus();
}

document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        form.submit();
    }
    if (e.key === 'Tab' && !e.ctrlKey) {
        preventDefaults(e);
        indent();
    }
});

async function postData(url = '', data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data
    });

    const text = await response.text();
    return text;
}

function preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
}

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    form.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

// highlight the dragarea
['dragenter', 'dragover'].forEach(eventName => {
    form.addEventListener(eventName, highlight, false);
});

// unhighlight the dragarea
['dragleave'].forEach(eventName => {
    form.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    form.classList.add('highlight');
    grid_form.classList.add('hidden');
}

function unhighlight(e) {
    form.classList.remove('highlight');
    grid_form.classList.remove('hidden');
}

function upload(file) {
    const ext = file.name.split(".")[1];
    var url = window.location.href;

    return postData(url, file)
        .then(data => {
            window.location.href = data + (ext ? "." + ext : '');
        })
        .catch(function (err) {
            console.info(err + " url: " + url);
        });
}

// Files are dropped
function dropHandler(ev) {
    ev.preventDefault();

    // Give a visual cue
    upload_card.classList.add('show');
    grid_form.classList.add('hidden');

    if (ev.dataTransfer.items) {
        var item = ev.dataTransfer.items[0];
        var blob = item.getAsFile();

        upload(blob).then(() => {
            // remove the jazz for if user returns to the prev page
            upload_card.classList.remove('show');
            grid_form.classList.remove('hidden');
            form.classList.remove('highlight');
        });
    }
}


// pasting files from the clipboard
document.onpaste = function (pasteEvent) {
    var item = pasteEvent.clipboardData.items[0];
    var blob = item.getAsFile();

    if (blob !== null && blob !== '') {
        upload(blob);
    }
}

// upload from the button
fileInput.onchange = function (e) {
    const file = e.target.files[0];

    if (file) {
        upload(file);
    }
}

// 添加搜索功能
document.getElementById('languageSearch').addEventListener('input', function(e) {
    const searchText = e.target.value.toLowerCase();
    const options = select.options;

    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const text = option.text.toLowerCase();
        const value = option.value.toLowerCase();
        
        const match = text.includes(searchText) || value.includes(searchText);
        option.style.display = match ? '' : 'none';
    }
});

// 添加快捷键聚焦
document.addEventListener('keydown', function(e) {
    // 按下 Ctrl + / 时聚焦到搜索框
    if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        document.getElementById('languageSearch').focus();
    }
});
