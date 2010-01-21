function getWindowDimension(name) {
    if (document.compatMode === "CSS1Compat")
        return document.documentElement["client" + name];

    return document.body["client" + name];
}

function getWindowHeight() {
    return getWindowDimension("Height");
}

function getWindowWidth() {
    return getWindowDimension("Width");
}

var supportsFixed = true;

function checkSupport() {
    var body = document.body,
        div = document.createElement("div");

    div.style.position = "fixed";
    div.style.margin = 0;
    div.style.top = "20px";

    body.appendChild(div, body.firstChild);
    supportsFixed = div.offsetTop == 20;
    body.removeChild(div);
}

window.onload = function() {
    checkSupport();

    var div = document.createElement("div");

    div.style.position = "fixed";
    div.style.top = 0;
    div.style.left = 0;
    div.style.margin = 0;
    div.style.padding = 0;
    div.style.background = "#fe5";
    div.style.width = getWindowWidth() + "px";
    div.style.height = getWindowHeight() + "px";

    if (!supportsFixed) {
        div.style.position = "absolute";
        window.attachEvent("onscroll", function() {
            div.style.top = document.documentElement.scrollTop + "px";
            div.style.left = document.documentElement.scrollLeft + "px";
        });
    }

    div.innerHTML = '<div style="position:relative;height:100%;width:100%;background:#f5e;">Relative</div>';

    document.body.appendChild(div);
}
