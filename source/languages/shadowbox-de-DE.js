/**
 * The German (Deutsch) language file for Shadowbox.
 *
 * This file is part of Shadowbox.
 *
 * Shadowbox is an online media viewer application that supports all of the
 * web's most popular media publishing formats. Shadowbox is written entirely
 * in JavaScript and CSS and is highly customizable. Using Shadowbox, website
 * authors can showcase a wide assortment of media in all major browsers without
 * navigating users away from the linking page.
 *
 * You should have received a license with this distribution explaining the terms
 * under which Shadowbox may be used. If you did not, you may obtain a copy of the
 * license at http://shadowbox-js.com/LICENSE
 *
 * @author      Michael J. I. Jackson <michael@mjijackson.com>
 * @copyright   2007-2009 Michael J. I. Jackson
 */

if(typeof Shadowbox == 'undefined')
    throw 'Unable to load Shadowbox language file, Shadowbox not found.';

/**
 * An object containing all textual messages to be used in Shadowbox. These are
 * provided so they may be translated into different languages. Alternative
 * translations may be found in js/lang/shadowbox-*.js where * is an abbreviation
 * of the language name (see
 * http://www.gnu.org/software/gettext/manual/gettext.html#Language-Codes).
 *
 * @var     Object
 * @public
 */
Shadowbox.lang = {

    code:       'de',

    of:         'von',

    loading:    'ladend',

    cancel:     'Abbrechen',

    next:       'Nächste',

    previous:   'Vorige',

    play:       'Abspielen',

    pause:      'Pause',

    close:      'Schließen',

    errors:     {
        single: 'Um den Inhalt anzeigen zu können muss die Browser-Erweiterung <a href="{0}">{1}</a> installiert werden.',
        shared: 'Um den Inhalt anzeigen zu können müssen die beiden Browser-Erweiterungen <a href="{0}">{1}</a> und <a href="{2}">{3}</a> installiert werden.',
        either: 'Um den Inhalt anzeigen zu können muss eine der beiden Browser-Erweiterungen <a href="{0}">{1}</a> oder <a href="{2}">{3}</a> installiert werden.'
    }

};
