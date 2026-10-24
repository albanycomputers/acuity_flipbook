# Changelog

## 1.0.0-beta2 (unreleased)

## 1.0.0-beta1 (2026-10-24)

Git tag: `1.x-1.0.0-beta1`.

- First beta: in use on live sites for several months.
- Security: PDF.js upgraded from 3.11.174 to 6.4.299, closing
  CVE-2024-4367 (a crafted PDF could run script in the viewer's browser).
  Sites where untrusted users can upload PDFs to a flipbook field should
  update.
- PDF.js is now an ES module, imported by the module's own script; the
  `pdfjs_engine` library is gone. Needs a current browser.
- README: states the formatter displays PDF files only.
- Removed the formatter's Width and Height settings. They were never used:
  the book sizes itself from the PDF and the space it is placed in.
  Values already saved in a display are left in config and ignored.
- Pages are rendered on demand: the first spread shows as soon as it is
  drawn, pages near the open spread are drawn as the reader turns, and pages
  far behind are released. Previously every page was rendered before
  anything showed and every canvas was kept (a 64-page PDF: ~3 s and 36M
  canvas pixels before, under 1 s and 5-13M after, measured in Chrome).
- Pages render at the screen's height (times the device pixel ratio, capped
  at 2400 px) instead of a fixed 1.5 scale, so they stay sharp in fullscreen.
- page-flip pinned to 2.0.7 on jsdelivr (was unversioned).
- The module's own library has no fixed version, so an updated script
  reaches browsers on the next cache flush.
