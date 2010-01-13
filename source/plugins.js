/**
 * Contains plugin support information. Each property of this object is a
 * boolean indicating whether that plugin is supported. Keys are:
 *
 * - fla: Flash player
 * - qt: QuickTime player
 * - wmp: Windows Media player
 * - f4m: Flip4Mac plugin
 *
 * @type    {Object}
 * @public
 */
S.plugins = {};

if (navigator.plugins && navigator.plugins.length) {
    var names = [];
    each(navigator.plugins, function(i, p) {
        names.push(p.name);
    });
    names = names.join(',');

    var f4m = names.indexOf('Flip4Mac') > -1;

    S.plugins = {
        fla:    names.indexOf('Shockwave Flash') > -1,
        qt:     names.indexOf('QuickTime') > -1,
        wmp:    !f4m && names.indexOf('Windows Media') > -1, // if it's Flip4Mac, it's not really WMP
        f4m:    f4m
    };
} else {
    var detectPlugin = function(name) {
        var axo;
        try {
            axo = new ActiveXObject(name);
        } catch(e) {}
        return !!axo;
    }

    S.plugins = {
        fla:    detectPlugin('ShockwaveFlash.ShockwaveFlash'),
        qt:     detectPlugin('QuickTime.QuickTime'),
        wmp:    detectPlugin('wmplayer.ocx'),
        f4m:    false
    };
}
