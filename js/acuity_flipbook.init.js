(function ($) {
  'use strict';

  Backdrop.behaviors.acuityFlipbook = {
    attach: function (context, settings) {
      $('.acuity-flipbook-container', context).once('acuity-flipbook').each(async function () {
        const $container = $(this);
        const pdfUrl = $container.data('pdf-url');

        if (!pdfUrl) return;

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

          // 2. Interaction Zone & Drag-to-Pan (Bulletproof Version)
const $scrollProtect = $('<div class="acuity-scroll-protect" title="Click and drag to pan"></div>').appendTo($flipbookInner);

          // CRITICAL FIX: Only block the initial click/touch from reaching the 3D engine.
          // We MUST let 'mousemove' and 'touchmove' bubble up so the document can track the drag!
          $scrollProtect.on('mousedown touchstart pointerdown', function(e) {
            e.stopPropagation();
          });

          $scrollProtect.on('mousedown touchstart', function(e) {
            // Ignore right clicks
            if (e.type === 'mousedown' && e.which !== 1) return;
            e.preventDefault(); // Stop native drag-and-drop ghosting

            const isTouch = e.type === 'touchstart';
            const startEvent = isTouch ? e.originalEvent.touches[0] : e;

            const startX = startEvent.clientX;
            const startY = startEvent.clientY;
            const scrollLeft = $viewport.scrollLeft();
            const scrollTop = $viewport.scrollTop();

            $scrollProtect.css('cursor', 'grabbing');

            // Namespace the events so they don't leak or conflict with other modules
            const moveEvent = isTouch ? 'touchmove.acuityPan' : 'mousemove.acuityPan';
            const upEvent = isTouch ? 'touchend.acuityPan touchcancel.acuityPan' : 'mouseup.acuityPan';

            $(document).on(moveEvent, function(moveE) {
              const moveTouch = isTouch ? moveE.originalEvent.touches[0] : moveE;
              $viewport.scrollLeft(scrollLeft - (moveTouch.clientX - startX));
              $viewport.scrollTop(scrollTop - (moveTouch.clientY - startY));
            });

            $(document).on(upEvent, function() {
              $scrollProtect.css('cursor', 'grab');
              $(document).off('.acuityPan'); // Clean up listeners instantly
            });
          });

          // 3. Wire up UI Controls
          const $pageCounter = $controls.find('.acuity-page-counter');
          $pageCounter.text(`1 / ${numPages}`);

          pageFlip.on('flip', (e) => {
            const currentPage = e.data + 1;
            $pageCounter.text(`${currentPage} / ${numPages}`);
          });

          $controls.find('.prev').on('click', () => pageFlip.flipPrev());
          $controls.find('.next').on('click', () => pageFlip.flipNext());

          let currentZoom = 1;
          const applyZoom = () => {
            if (currentZoom > 1) {
              // Safely lock height explicitely on the first zoom step to force internal scrollbars
              if (!$container.attr('data-height-locked')) {
                $container.css('height', $container.height() + 'px');
                $container.attr('data-height-locked', 'true');
              }

              $viewport.css({
                'display': 'block',
                'padding': '20px'
              });

              $flipbookInner.css({
                'transform': `scale(${currentZoom})`,
                'transform-origin': 'top left',
                'transition': 'transform 0.3s ease'
              });

              const baseWidth = $flipbookInner.width();
              const baseHeight = $flipbookInner.height();
              const extraWidth = (baseWidth * currentZoom) - baseWidth;
              const extraHeight = (baseHeight * currentZoom) - baseHeight;

              $flipbookInner.css({
                'margin': '0',
                'margin-right': `${extraWidth + 40}px`,
                'margin-bottom': `${extraHeight + 100}px`
              });
            } else {
              // Reset back to standard view
              $container.css('height', '');
              $container.removeAttr('data-height-locked');

              $viewport.css({
                'display': 'flex',
                'padding': '0'
              });

              $flipbookInner.css({
                'transform': `scale(1)`,
                'transform-origin': 'center center',
                'transition': 'transform 0.3s ease',
                'margin': 'auto',
                'margin-right': '0',
                'margin-bottom': '0'
              });
            }
          };

          // Use toFixed to eliminate trailing floating point errors
          $controls.find('.zoom-in').on('click', () => {
            currentZoom = parseFloat((currentZoom + 0.4).toFixed(1));
            applyZoom();
          });

          $controls.find('.zoom-out').on('click', () => {
            currentZoom = Math.max(1, parseFloat((currentZoom - 0.4).toFixed(1)));
            applyZoom();
          });

          // 4. Fullscreen & Resizing
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

          document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
              $container.addClass('is-fullscreen');
              $controls.find('.fullscreen').html('&times;').attr('title', 'Exit Fullscreen');
            } else {
              $container.removeClass('is-fullscreen');
              $controls.find('.fullscreen').html('&#x26F6;').attr('title', 'Fullscreen');
              currentZoom = 1;
              applyZoom();
            }
          });

          let resizeTimer;
          $(window).on('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
              pageFlip.update();
              if (currentZoom !== 1) {
                currentZoom = 1;
                applyZoom();
              }
            }, 250);
          });

          // 5. Reveal UI Safely
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