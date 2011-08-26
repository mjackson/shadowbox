Welcome to Shadowbox!

Shadowbox is a powerful and easy-to-use lightbox for websites. Using Shadowbox,
website authors can display a wide variety of photo and video content in all of
the web's most popular browsers in an attractive and functional format.

For more information, please see http://shadowbox-js.com/.

## Installation and Usage

To install Shadowbox on your webpage, simply add the following two lines of code
to the `<head>` section of your HTML document:

    <link rel="stylesheet" media="screen" type="text/css" href="http://shadowbox-js.com/shadowbox.css">
    <script type="text/javascript" src="http://shadowbox-js.com/shadowbox.js"></script>

For best results, please also make sure you are using the [HTML5 doctype](http://dev.w3.org/html5/spec/Overview.html#the-doctype)
in your document. That means that the following line of code should appear before
anything else!

    <!DOCTYPE html>

Next, add a `rel="shadowbox"` attribute to any links to photos or videos in the
HTML markup. For example, if you have a link to a photo named `vacation.jpg`,
the markup would look like this:

    <a rel="shadowbox" href="vacation.jpg">My Vacation</a>

When linking to a video, you need to explicitly tell Shadowbox the dimensions
to use for the video. You can do this by setting the value of the `data-shadowbox`
attribute like this:

    <a rel="shadowbox" href="vacation.m4v" data-shadowbox="{'width':640,'height':360}">My Vacation</a>

If you'd like to let the user open Shadowbox by clicking on a small thumbnail
version of the photo or video, simply wrap the thumbnail image in a link like
the ones above.

    <a rel="shadowbox" href="vacation.jpg">
      <img src="vacation-thumbnail.jpg">
    </a>

Shadowbox supports video playback using [HTML5's video](http://dev.w3.org/html5/spec/Overview.html#the-video-element)
capabilities. If the user's browser does not support HTML5 video, Shadowbox uses
a Flash fallback to play the video. For best results, it is recommended that you
encode your videos using h264. You can read Mark Pilgrim's [excellent guide to HTML5 video](http://diveintohtml5.info/video.html)
to learn more.

## API

Shadowbox exposes a single `shadowbox` function in the global namespace. All
other Shadowbox constructors, functions, and properties are exposed as
properties of this function.

In the most basic use case, you can open a photo or video by passing the URL to
the `shadowbox` function directly.

    shadowbox("http://example.com/mypicture.jpg");

When you need to specify additional content attributes (e.g. when linking to a
video you must explicitly specify the height and width), you can pass an object
to the function, using the URL of the content as the value of the `url` property.

    shadowbox({
      url: "http://example.com/myvideo.m4v",
      width: 640,
      height: 360
    });

## Bugs

Please report any bugs that you may find at the [Shadowbox issue tracker](http://github.com/mjijackson/shadowbox/issues)
on GitHub.

## License

Copyright (C) 2007-2011 Michael Jackson

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
