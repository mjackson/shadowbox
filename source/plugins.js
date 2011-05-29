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

    var f4m = names.contains('Flip4Mac');

    S.plugins = {
        fla:    names.contains('Shockwave Flash'),
        qt:     names.contains('QuickTime'),
        wmp:    !f4m && names.contains('Windows Media'), // if it's Flip4Mac, it's not really WMP
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
