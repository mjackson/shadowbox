Shadowbox.init({ skipSetup: true });

window.onload = function() {
    Shadowbox.open({
        player: "html",
        title: "The Title",
        content: "<p>The content goes here.</p>",
        height: 300,
        width: 300
    });
}
