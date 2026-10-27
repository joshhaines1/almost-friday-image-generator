# Almost Friday Image Generator

A small, client-side web app that turns your photos into Instagram-ready portrait posts (1080 × 1350, 4:5) with the **Almost Friday** logo stamped on the top or bottom. Drop in up to 20 photos, choose where the logo goes for each one, preview the result, and download everything as a single ZIP.

Everything runs in the browser. Images are never uploaded to a server.

**Live site:** https://joshhaines1.github.io/almost-friday-image-generator/



## Features

- **Drag and drop or file picker** upload, up to 10 images per batch (`MAX_IMAGES` in `src/App.jsx`).
- **Automatic 4:5 crop**: every image is center-cropped to a 4:5 portrait ratio and scaled to 1080 × 1350 px.
- **Logo overlay**: the Almost Friday logo is composited onto each image, centered horizontally.
- **Per-image controls**: choose **Top** or **Bottom** placement and set padding (0–200 px) for each image independently.
- **Live previews**: thumbnails render on the canvas as you change settings. Padding changes are debounced (2 s) so typing doesn't thrash the canvas.
- **One-click export**: **Download All Images** processes every image at full resolution and bundles them into `almost_friday_images.zip`.
- **Fully private**: all processing uses the HTML canvas in your browser.

## How it works

For each image the app:

1. Loads the file into an `Image` via an object URL.
2. Computes a centered crop to a 4:5 ratio. If the image is too wide it crops the sides, and if it's too tall it crops the top and bottom.
3. Draws the crop onto a 1080 × 1350 `<canvas>`.
4. Scales the logo to 105% of the canvas width (preserving its aspect ratio) and draws it centered horizontally.
   - **Top**: the logo's top edge sits `padding` px from the top.
   - **Bottom**: the logo's bottom edge sits `padding` px from the bottom.
5. For previews, exports the canvas as a data URL. For downloads, exports it as a `Blob` and adds it to a ZIP with [JSZip](https://stuk.github.io/jszip/), then saves it with [FileSaver.js](https://github.com/eligrey/FileSaver.js).

## Using the app

1. Open the site (or your local dev server).
2. Drag images onto the dashed upload area, or click it to browse. Only files with an `image/*` MIME type are accepted, and anything past 10 images is ignored.
3. For each image card:
   - Pick **Top** or **Bottom** for the logo (default: Bottom).
   - Adjust **Padding (px)** (default: 80). The preview refreshes about two seconds after you stop typing.
   - Click **Remove** to drop the image from the batch.
4. Click **Download All Images** to get `almost_friday_images.zip`. Each file inside keeps its original filename.

## Tech stack

| Area | Tool |
| --- | --- |
| UI | [React 18](https://react.dev/) |
| Build/dev server | [Vite 5](https://vitejs.dev/) with `@vitejs/plugin-react` |
| ZIP creation | [JSZip](https://stuk.github.io/jszip/) |
| File download | [file-saver](https://github.com/eligrey/FileSaver.js) |
| Image processing | Browser Canvas 2D API |
| Hosting | GitHub Pages via [gh-pages](https://github.com/tschaub/gh-pages) |
| Font | [Lobster](https://fonts.google.com/specimen/Lobster) (bundled locally) |
