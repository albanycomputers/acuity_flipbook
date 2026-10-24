# PDF Flipbook (Acuity Utils)

**FlipBook (Acuity Utils)** A high-performance, client-side 3D PDF viewer and field formatter.

Acuity Flipbook is a standalone utility module that displays PDF files uploaded to a standard Backdrop CMS file field as interactive, hardware-accelerated 3D flipbooks. It works with **PDF files only**: any other file on the same field (images, Word documents and so on) is not shown by this formatter. Instead of relying on heavy server-side image generation (like ImageMagick or Ghostscript) that bloats your server, this module pushes the processing to the browser. It natively extracts vector PDF data and wraps it in a responsive 3D physics engine for a premium reading experience.

## Beta Release Notes
The module has been in use on live sites for several months. Ensure your Backdrop CMS environment is running PHP 8.0+, and clear the caches after installing or updating so the field formatter and its scripts are picked up.

## Features

* **Zero Server Bloat:** Parses and renders PDF documents entirely on the client side, saving server bandwidth and CPU.
* **Realistic 3D Physics:** Powered by a modern physics engine featuring responsive stretching, dynamic page shadows, and smooth 60fps hardware-accelerated page turns.
* **Interactive Control Suite:** Includes a sleek, floating UI with Next/Previous navigation, a live page counter, and deep Zoom (In/Out) capabilities with native internal scrollbars.
* **Immersive Fullscreen:** Taps directly into the browser's native Fullscreen API for a distraction-free, theatrical reading mode.
* **Backdrop Native:** Built exclusively for Backdrop CMS using strict modern PHP 8 standards. It integrates seamlessly as a standard Field Formatter on any "File" field.

# CDN Usage & External Dependencies
To keep this module exceptionally lightweight and ensure the fastest possible load times across the globe, Acuity Flipbook does not bundle heavy JavaScript libraries locally. Instead, it relies on secure, industry-standard Content Delivery Networks (CDNs):

* **PDF.js (v6.4.299):** Loaded via Cloudflare (cdnjs.cloudflare.com) as an ES module, which needs a current browser, to handle the heavy lifting of parsing the PDF and extracting the canvas data.
* **StPageFlip (v2.0.7):** Loaded via jsDelivr (cdn.jsdelivr.net) to power the 3D physics, responsive scaling, and page-turning math.

(Note: Because these rendering engines are loaded via CDN, the end-user's browser requires an active internet connection to render the flipbook.)


### Requirements:

- Backdrop CMS 1.x
- PHP 8+ (While the code may technically function with PHP 7.4 at this time, we strictly require PHP 8.0+ and will not address issues related to older PHP versions.)

## Installation:

Install this module using the official Backdrop CMS instructions at https://docs.backdropcms.org/documentation/extend-with-modules

Enable the module.

## Configuration

Simply add a standard **File** field to any content type (allowing .pdf extensions) and set the Manage Display formatter to Acuity 3D Flipbook (PDF). The module mathematically analyzes the native dimensions of the uploaded document and scales the two-page spread to perfectly fit your theme's layout column without breaking responsiveness.

If the field allows more than one file, each PDF is shown as a flipbook of its own. Pages are drawn as the reader reaches them, so long documents open quickly: in testing, a 64-page, 10 MB PDF showed its first page about three times faster than in earlier versions (0.9 seconds instead of 2.9), using about a seventh of the memory.


## Issues:

Bugs and Feature requests should be reported in the Issue Queue: https://github.com/backdrop-contrib/acuity_flipbook/issues

## About the "Acuity" Name
"Acuity" is the name used to organise a collection of modules and utilities. These tools are grouped under a unified name to streamline installation and make it easier for site maintainers to identify these suite of solutions.

Technically, the namespaces `acuity_` and `abms_` were chosen to enhance code readability and keep function names simple and easy to type.

While part of this larger Acuity family, this module is a standalone utility.

## Current Maintainer(s):
- Steve Moorhouse (albanycomputers) (https://github.com/albanycomputers)
- Seeking additional maintainers and contributors.

## Credits:
- Steve Moorhouse - Zulip (DrAlbany)
- Assisted by AI

## Sponsorship:
- Albany Computer Services (https://www.albany-computers.co.uk)
- Albany Web Design (https://www.albanywebdesign.co.uk)
- Albany Hosting (https://www.albany-hosting.co.uk)

## License
This project is GPL v2 software. See the LICENSE.txt file in this directory for complete text.
