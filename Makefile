SOURCE = source

SCRIPT_FILES := $(SOURCE)/shadowbox.js \
		$(SOURCE)/shadowbox-flash.js \
		$(SOURCE)/shadowbox-video.js

STYLE_FILES  := $(SOURCE)/shadowbox.css \
		$(SOURCE)/shadowbox-video.css

IMAGE_FILES  := $(SOURCE)/shadowbox-icons.png \
		$(SOURCE)/shadowbox-controls.png

TARGET ?= build
NODE_BIN = node_modules/.bin

all: setup build

setup: $(NODE_BIN)/uglifyjs $(NODE_BIN)/autoprefixer $(NODE_BIN)/csso

$(NODE_BIN)/uglifyjs:
	npm install uglify-js

$(NODE_BIN)/autoprefixer:
	npm install autoprefixer

$(NODE_BIN)/csso:
	npm install csso

build: $(TARGET)/shadowbox.min.js $(TARGET)/shadowbox.min.css $(TARGET)/shadowbox-icons.png $(TARGET)/shadowbox-controls.png	

$(TARGET)/shadowbox.js: $(SCRIPT_FILES)
	mkdir -p $(TARGET)
	cat $^ > $@

$(TARGET)/shadowbox.min.js: $(TARGET)/shadowbox.js
	$(NODE_BIN)/uglifyjs $< -cmo $@

$(TARGET)/shadowbox.css: $(STYLE_FILES)
	mkdir -p $(TARGET)
	cat $^ | $(NODE_BIN)/autoprefixer -o $@

$(TARGET)/shadowbox.min.css: $(TARGET)/shadowbox.css
	$(NODE_BIN)/csso -i $< -o $@

$(TARGET)/%.png: $(SOURCE)/%.png
	mkdir -p $(TARGET)
	cp $< $@

clean:
	rm -rf node_modules $(TARGET)

.PHONY: all setup build clean
