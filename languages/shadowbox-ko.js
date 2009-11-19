/**
 * The Korean (한국말) language file for Shadowbox.
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

    code:       'ko',

    of:         '중',

    loading:    '로딩 중',

    cancel:     '취소',

    next:       '다음',

    previous:   '이전',

    play:       '재생',

    pause:      '잠시 멈춤',

    close:      '닫기',

    errors:     {
        single: '이 내용을 보려면 <a href="{0}">{1}</a> 브라우저 플러그인을 설치하십시오.',
        shared: '이 내용을 보려면 <a href="{0}">{1}</a> 와/과 <a href="{2}">{3}</a> 브라우저 플러그인을 설치하십시오.',
        either: '이 내용을 보려면 <a href="{0}">{1}</a> 또는 <a href="{2}">{3}</a> 브라우저 플러그인을 설치하십시오.'
    }

};
