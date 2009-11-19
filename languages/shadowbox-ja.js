/**
* The Japanese (日本語) language file for Shadowbox.
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
* @version SVN: $Id: shadowbox-ja.js 26M 2009-06-24 02:22:20Z (local) $
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
* @var Object
* @public
*/
Shadowbox.lang = {

    code: 'ja',

    of: '/',

    loading: '読込中',

    cancel: '取消',

    next: '次',

    previous: '前',

    play: '再生',

    pause: '一時停止',

    close: '閉じる',

    errors: {
        single: 'このコンテンツを表示するにはプラグイン <a href="{0}">{1}</a> を追加する必要があります。',
        shared: 'このコンテンツを表示するにはプラグイン <a href="{0}">{1}</a> と <a href="{2}">{3}</a> を追加する必要があります。',
        either: 'このコンテンツを表示するにはプラグイン <a href="{0}">{1}</a> または <a href="{2}">{3}</a> を追加する必要があります。'
    }

};
