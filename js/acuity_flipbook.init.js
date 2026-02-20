(function ($) {
  'use strict';

  Backdrop.behaviors.acuityFlipbook = {
    attach: function (context, settings) {
      $('.acuity-flipbook-container', context).once('acuity-flipbook').each(async function () {
        const $container = $(this);
        const pdfUrl = $container.data('pdf-url');

        if (!pdfUrl) {
          return;
        }

        const pdfjsLib = window['pdfjs-dist/build/pdf'] || window.pdfjsLib;

        if (!pdfjsLib) {
          console.error('Acuity Flipbook Error: PDF.js library did not load.');
          $container.html('<p class="error">System error: PDF rendering engine not found.</p>');
          return;
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        // 1. Inject DOM Structure
        const $overlay = $('<div class="acuity-flipbook-overlay"><div class="acuity-flipbook-spinner"></div><div>Rendering PDF...</div></div>').appendTo($container);

        const $viewport = $('<div class="acuity-flipbook-viewport"></div>').appendTo($container);

        const $controls = $(`
          <div class="acuity-flipbook-controls">
            <button type="button" class="acuity-btn fullscreen" title="Fullscreen">&#x26F6;</button>
            <button type="button" class="acuity-btn prev" title="Previous Page">&lsaquo;</button>
            <span class="acuity-page-counter">1 / 1</span>
            <button type="button" class="acuity-btn next" title="Next Page">&rsaquo;</button>
            <button type="button" class="acuity-btn zoom-out" title="Zoom Out">&minus;</button>
            <button type="button" class="acuity-btn zoom-in" title="Zoom In">&plus;</button>
          </div>
        `).appendTo($container);

        try {
          const loadingTask = pdfjsLib.getDocument(pdfUrl);
          const pdf = await loadingTask.promise;
          const numPages = pdf.numPages;

          const $flipbookInner = $('<div class="acuity-flipbook-wrapper"></div>').appendTo($viewport);

          for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const $pageWrapper = $('<div class="acuity-flip-page"></div>').append(canvas);
            $flipbookInner.append($pageWrapper);

            const renderContext = {
              canvasContext: ctx,
              viewport: viewport
            };
            await page.render(renderContext).promise;
          }

          const pagesArray = $flipbookInner.find('.acuity-flip-page').toArray();
          const firstCanvas = pagesArray[0].querySelector('canvas');

          const pageFlip = new St.PageFlip($flipbookInner[0], {
            width: firstCanvas.width,
            height: firstCanvas.height,
            size: 'stretch',
            minWidth: 300,
            maxWidth: firstCanvas.width,
            minHeight: 400,
            maxHeight: firstCanvas.height,
            showCover: true,
            usePortrait: false,
            maxShadowOpacity: 0.5,
          });

          pageFlip.loadFromHTML(pagesArray);

          // 2. Wire up the Page Counter
          const $pageCounter = $controls.find('.acuity-page-counter');
          $pageCounter.text(`1 / ${numPages}`);

          pageFlip.on('flip', (e) => {
            // e.data returns the current left-most page index (0-based)
            const currentPage = e.data + 1;
            $pageCounter.text(`${currentPage} / ${numPages}`);
          });

          // 3. Wire up Controls
          $controls.find('.prev').on('click', () => pageFlip.flipPrev());
          $controls.find('.next').on('click', () => pageFlip.flipNext());

          let currentZoom = 1;
          const applyZoom = () => {
            if (currentZoom > 1) {
              // 1. Lock the outer container height so the page doesn't stretch downwards
              if (currentZoom === 1.4) { // Only lock it on the first zoom step
                $container.css('height', $container.height() + 'px');
              }

              // 2. Kill the flexbox centering so standard 2D scrolling can activate
              $viewport.css({
                'display': 'block',
                'padding': '20px' // Add breathing room around the edges
              });

              // 3. Scale from the top-left corner so we don't bleed into negative scroll space
              $flipbookInner.css({
                'transform': `scale(${currentZoom})`,
                'transform-origin': 'top left',
                'transition': 'transform 0.3s ease'
              });

              // 4. Calculate the mathematical overflow and add it as margins
              // to force the browser's native scrollbars to appear
              const baseWidth = $flipbookInner.width();
              const baseHeight = $flipbookInner.height();
              const extraWidth = (baseWidth * currentZoom) - baseWidth;
              const extraHeight = (baseHeight * currentZoom) - baseHeight;

              $flipbookInner.css({
                'margin-right': `${extraWidth + 40}px`,
                'margin-bottom': `${extraHeight + 100}px` // +100px so the control bar doesn't cover text
              });

            } else {
              // Reset everything back to the sleek, centered theatrical view
              $container.css('height', ''); // Release the height lock

              $viewport.css({
                'display': 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'padding': '0'
              });

              $flipbookInner.css({
                'transform': `scale(1)`,
                'transform-origin': 'center center',
                'transition': 'transform 0.3s ease',
                'margin-right': '0',
                'margin-bottom': '0'
              });
            }
          };
          $controls.find('.zoom-in').on('click', () => {
            currentZoom += 0.4;
            applyZoom();
          });

          $controls.find('.zoom-out').on('click', () => {
            currentZoom = Math.max(1, currentZoom - 0.4);
            applyZoom();
          });

          // 4. Wire up Fullscreen API
          const toggleFullscreen = () => {
            if (!document.fullscreenElement) {
              $container[0].requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
              });
            } else {
              document.exitFullscreen();
            }
          };

          $controls.find('.fullscreen').on('click', toggleFullscreen);

          // Listen for escape key or standard fullscreen exits to toggle the UI
          document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
              $container.addClass('is-fullscreen');
              $controls.find('.fullscreen').html('&times;').attr('title', 'Exit Fullscreen');
            } else {
              $container.removeClass('is-fullscreen');
              $controls.find('.fullscreen').html('&#x26F6;').attr('title', 'Fullscreen');

              // Optional: Reset zoom when exiting fullscreen
              currentZoom = 1;
              applyZoom();
            }
          });

          // 4.5 Handle Window Resize & Device Orientation
          let resizeTimer;
          $(window).on('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {

              // 1. Force the 3D physics engine to recalculate its dimensions to fit the new layout
              pageFlip.update();

              // 2. If the user resizes or rotates the device while heavily zoomed in,
              // the offset math breaks. We safely snap it back to the 1x theatrical view.
              if (currentZoom !== 1) {
                currentZoom = 1;
                applyZoom();
              }

            }, 250); // 250ms debounce ensures performance stays buttery smooth
          });

          // 5. Reveal UI
          $flipbookInner.addClass('is-ready');
          $controls.addClass('is-ready');

          $overlay.fadeOut(600, function() {
            $(this).remove();
          });

        } catch (error) {
          console.error('Acuity Flipbook Rendering Error:', error);
          $overlay.remove();
          $container.html('<p class="error">Unable to load the document.</p>');
        }
      });
    }
  };

})(jQuery);