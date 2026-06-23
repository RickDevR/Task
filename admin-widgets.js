function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 400);
    }, 1800);
}

function createSwitch(defaultState = false, onChange = null) {
    const sw = document.createElement("div");
    sw.className = "switch";
    if (defaultState) sw.classList.add("on");

    sw.onclick = () => {
        sw.classList.toggle("on");
        if (onChange) onChange(sw.classList.contains("on"));
    };

    return sw;
}
