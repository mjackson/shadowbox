Welcome to Shadowbox!

Shadowbox is a powerful and easy-to-use lightbox for websites. Using Shadowbox,
website authors can display a wide variety of photo and video content in all of
the web's most popular browsers in an attractive and functional format.

For more information, please see [http://shadowbox-js.com/](http://shadowbox-js.com).

## Installation and Usage

To install Shadowbox on your webpage, simply add the following two lines of code
to the `<head>` section of your HTML document:

```html
<link rel="stylesheet" media="screen" type="text/css" href="http://shadowbox-js.com/shadowbox.css">
<script type="text/javascript" src="http://shadowbox-js.com/shadowbox.js"></script>
```

For best results, please also make sure you are using the
[HTML5 doctype](http://dev.w3.org/html5/spec/Overview.html#the-doctype) in your
document. That means that the following line of code should appear before
anything else!

```html
<!DOCTYPE html>
```

Next, add a `rel="shadowbox"` attribute to any links to photos or videos in the
HTML markup. For example, if you have a link to a photo named `vacation.jpg`,
the markup would look like this:

```html
<a href="vacation.jpg" rel="shadowbox">My Vacation</a>
```

When linking to a video, you need to explicitly tell Shadowbox the dimensions to
use for the video. You can do this by setting the value of the `data-shadowbox`
attribute like this:

```html
<a href="vacation.m4v" rel="shadowbox" data-shadowbox="width=640,height=360">My Vacation</a>
```

If you'd like to let the user open Shadowbox by clicking on a small thumbnail
version of the photo or video, simply wrap the thumbnail image in a link like
the ones above.

```html
<a href="vacation.jpg" rel="shadowbox">
  <img src="vacation-thumb.jpg">
</a>
```

To show an entire gallery of content, simply include the gallery name between
square brackets in your `rel` attribute on multiple links. This could be very
useful if you have a grid of photo thumbnails on a page, for example. You can
even mix multiple types of content into the same gallery.

```html
<a href="picture-one.jpg" rel="shadowbox[vacation]">First Picture</a>
<a href="picture-two.jpg" rel="shadowbox[vacation]">Second Picture</a>
<a href="video-one.m4v" rel="shadowbox[vacation]" data-shadowbox="width=640,height=360">The Video</a>
```

Note: For best results, it is recommended that you encode your videos using h264.
Please read Mark Pilgrim's [excellent guide to HTML5 video](http://diveintohtml5.info/video.html)
to learn more. Also, please note that Shadowbox supports displaying the same
video in multiple encodings. Please see the API section on HTML5 video properties
for more information.

## API

Shadowbox exposes a single `shadowbox` function in the global namespace. All
other Shadowbox constructors, functions, and properties are exposed as properties
of this function.

In the most common use case, you can open a photo or video by passing the URL of
the content you want to display to the `shadowbox` function directly.

```js
shadowbox("http://example.com/mypicture.jpg");
```

When you need to specify additional content attributes (e.g. when linking to a
video you must explicitly specify its width and height), you can pass an object
to the function, using the URL of the content as the value of the `url` property.

```js
shadowbox({
  url: "http://example.com/myvideo.m4v",
  width: 640,
  height: 360
});
```

If Shadowbox can't automatically guess the type of content from its file extension,
it defaults to showing the contents of the URL in an iframe.

To display a gallery of content, pass an array instead of a single object to the
`shadowbox` function.

```js
shadowbox([
  "http://example.com/a-picture.jpg",
  { url: "http://example.com/myvideo.m4v", width: 640, height: 360 },
  "http://example.com/index.html"
]);
```

A second argument may be used to specify various options that control how Shadowbox
looks and behaves. Properties of this object may be any of `shadowbox.options`.

```js
shadowbox("http://example.com/a-picture.jpg", { overlayColor: "white" });
```

### HTML5 Video Properties

When playing HTML5 video, you may use the `posterUrl` and `encodings` properties
on your content object. If present, the `posterUrl` property is used to display
a poster image before your video starts playing.

The `encodings` property may be used to specify the URLs of several different
versions of the same file that use different encodings. When Shadowbox runs, it
automatically detects the capabilities of the browser and uses the version of
the video that is best suited to that browser.

```js
shadowbox({
  posterUrl: "http://example.com/my-poster.jpg",
  encodings: {
    h264: "http://example.com/my-video.m4v",
    ogg:  "http://example.com/my-video.ogg"
  },
  width: 640,
  height: 360
});
```

Note: When using the `encodings` property the `url` property is optional.

### Flash Movie Properties

You may use the `flashParams` property to specify `<param>` name/value pairs when
playing Flash movies. You can also use the `flashVars` property to specify an
object of key/value pairs to use as Flash variables that get passed through to
the SWF when it is created.

```js
shadowbox({
  url: "http://example.com/my-movie.swf",
  flashParams: {
    play: false,
    loop: true
  }
});
```

## Bugs

Please report any bugs that you may find at the [Shadowbox issue tracker](http://github.com/mjijackson/shadowbox/issues)
on GitHub.

## License

Copyright (C) 2007-2013 Michael Jackson

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this
program. If not, see <http://www.gnu.org/licenses/>.
