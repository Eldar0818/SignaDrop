/**
 * SignaDrop – PDF Visual Signature Placer
 * Client-side only, pdf.js + pdf-lib
 */
(function() {
    'use strict';

    // ── DOM Elements ────────────────────────────
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const pdfSection = document.getElementById('pdf-section');
    const pdfCanvas = document.getElementById('pdf-canvas');
    const pdfViewerContainer = document.getElementById('pdf-viewer-container');
    const signatureOverlay = document.getElementById('signature-overlay');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const applySignatureBtn = document.getElementById('apply-signature-btn');
    const signatureCanvas = document.getElementById('signature-canvas');
    const clearSigBtn = document.getElementById('clear-sig');
    const placeSignatureBtn = document.getElementById('place-signature-btn');
    const placementHint = document.getElementById('placement-hint');
    const removePdfBtn = document.getElementById('remove-pdf');

    // ── State ──────────────────────────────────
    let pdfDoc = null;
    let currentPageNum = 1;
    let totalPages = 0;
    let pdfBytes = null;
    let viewportScale = 1;
    let pdfPageViewport = null;

    let isDragging = false;
    let dragStartX, dragStartY;
    let overlayStartLeft, overlayStartTop;

    let drawing = false;
    let lastX, lastY;
    const sigCtx = signatureCanvas.getContext('2d');

    // ── Dark Mode Toggle ────────────────────────
    function initTheme() {
        const toggleBtn = document.getElementById('theme-toggle');
        const stored = localStorage.getItem('theme');
        if (stored === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            toggleBtn.textContent = '☀️';
        } else {
            document.documentElement.removeAttribute('data-theme');
            toggleBtn.textContent = '🌙';
        }
        toggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                toggleBtn.textContent = '🌙';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                toggleBtn.textContent = '☀️';
            }
        });
    }

    // ── Initialise pdf.js worker ────────────────
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    // ── Upload Handlers ─────────────────────────
    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
        uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    async function handleFileSelect(e) {
        if (e.target.files.length) await handleFile(e.target.files[0]);
    }

    async function handleFile(file) {
        if (file.type !== 'application/pdf') {
            alert('Please upload a valid PDF file.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('File size exceeds 10 MB limit.');
            return;
        }
        const arrayBuffer = await file.arrayBuffer();
        pdfBytes = arrayBuffer;

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        currentPageNum = 1;

        pdfSection.style.display = 'block';
        await renderPage(currentPageNum);
        enableNavButtons();

        removePdfBtn.disabled = false;
        signatureOverlay.style.display = 'none';
        applySignatureBtn.disabled = true;
    }

    async function renderPage(pageNumber) {
        const page = await pdfDoc.getPage(pageNumber);
        const containerWidth = pdfViewerContainer.clientWidth;
        const originalViewport = page.getViewport({ scale: 1 });
        viewportScale = containerWidth / originalViewport.width;
        pdfPageViewport = page.getViewport({ scale: viewportScale });

        pdfCanvas.width = pdfPageViewport.width;
        pdfCanvas.height = pdfPageViewport.height;
        pdfCanvas.style.width = pdfPageViewport.width + 'px';
        pdfCanvas.style.height = pdfPageViewport.height + 'px';

        const ctx = pdfCanvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: pdfPageViewport }).promise;

        pageInfo.textContent = `Page ${pageNumber} of ${totalPages}`;
        if (signatureOverlay.style.display !== 'none') {
            constrainOverlay();
        }
    }

    function enableNavButtons() {
        prevPageBtn.disabled = currentPageNum <= 1;
        nextPageBtn.disabled = currentPageNum >= totalPages;
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', async () => {
            if (currentPageNum > 1) {
                currentPageNum--;
                await renderPage(currentPageNum);
                enableNavButtons();
            }
        });
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', async () => {
            if (currentPageNum < totalPages) {
                currentPageNum++;
                await renderPage(currentPageNum);
                enableNavButtons();
            }
        });
    }

    // ── Signature Pad ───────────────────────────
    function initSigPad() {
        sigCtx.lineWidth = 3;
        sigCtx.lineCap = 'round';
        sigCtx.strokeStyle = '#1a2b3c';
        sigCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    }
    initSigPad();

    function getCanvasCoords(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function startDrawing(e) {
        e.preventDefault();
        drawing = true;
        const coords = getCanvasCoords(e, signatureCanvas);
        lastX = coords.x;
        lastY = coords.y;
        sigCtx.beginPath();
        sigCtx.moveTo(lastX, lastY);
    }

    function draw(e) {
        if (!drawing) return;
        e.preventDefault();
        const coords = getCanvasCoords(e, signatureCanvas);
        sigCtx.lineTo(coords.x, coords.y);
        sigCtx.stroke();
        lastX = coords.x;
        lastY = coords.y;
    }

    function stopDrawing() {
        drawing = false;
        sigCtx.closePath();
        placeSignatureBtn.disabled = false;
    }

    signatureCanvas.addEventListener('mousedown', startDrawing);
    signatureCanvas.addEventListener('mousemove', draw);
    signatureCanvas.addEventListener('mouseup', stopDrawing);
    signatureCanvas.addEventListener('mouseleave', stopDrawing);
    signatureCanvas.addEventListener('touchstart', startDrawing, { passive: false });
    signatureCanvas.addEventListener('touchmove', draw, { passive: false });
    signatureCanvas.addEventListener('touchend', stopDrawing);

    clearSigBtn.addEventListener('click', () => {
        sigCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        initSigPad();
        placeSignatureBtn.disabled = true;
        signatureOverlay.style.display = 'none';
        applySignatureBtn.disabled = true;
    });

    // ── Place Signature as Overlay ─────────────
    placeSignatureBtn.addEventListener('click', () => {
        const dataURL = signatureCanvas.toDataURL('image/png');
        signatureOverlay.src = dataURL;
        signatureOverlay.style.display = 'block';

        const containerRect = pdfViewerContainer.getBoundingClientRect();
        const overlayWidth = signatureCanvas.width / 3;
        const overlayHeight = signatureCanvas.height / 3;
        signatureOverlay.style.width = overlayWidth + 'px';
        signatureOverlay.style.height = overlayHeight + 'px';

        const left = (containerRect.width - overlayWidth) / 2;
        const top = (containerRect.height - overlayHeight) / 2;
        signatureOverlay.style.left = left + 'px';
        signatureOverlay.style.top = top + 'px';

        applySignatureBtn.disabled = false;
        if (placementHint) placementHint.style.display = 'inline';
    });

    // ── Drag Overlay ────────────────────────────
    function startDrag(e) {
        e.preventDefault();
        isDragging = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        dragStartX = clientX;
        dragStartY = clientY;
        overlayStartLeft = parseFloat(signatureOverlay.style.left) || 0;
        overlayStartTop = parseFloat(signatureOverlay.style.top) || 0;
        signatureOverlay.style.cursor = 'grabbing';
    }

    function onDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const dx = clientX - dragStartX;
        const dy = clientY - dragStartY;
        signatureOverlay.style.left = (overlayStartLeft + dx) + 'px';
        signatureOverlay.style.top = (overlayStartTop + dy) + 'px';
    }

    function stopDrag() {
        if (!isDragging) return;
        isDragging = false;
        signatureOverlay.style.cursor = 'grab';
    }

    signatureOverlay.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
    signatureOverlay.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', onDrag, { passive: false });
    window.addEventListener('touchend', stopDrag);

    function constrainOverlay() {
        const containerRect = pdfViewerContainer.getBoundingClientRect();
        const overlayRect = signatureOverlay.getBoundingClientRect();
        let left = parseFloat(signatureOverlay.style.left) || 0;
        let top = parseFloat(signatureOverlay.style.top) || 0;
        left = Math.max(0, Math.min(left, containerRect.width - overlayRect.width));
        top = Math.max(0, Math.min(top, containerRect.height - overlayRect.height));
        signatureOverlay.style.left = left + 'px';
        signatureOverlay.style.top = top + 'px';
    }

    // ── Apply Signature with pdf‑lib ───────────
    applySignatureBtn.addEventListener('click', async () => {
        if (!pdfBytes || signatureOverlay.style.display === 'none') return;

        applySignatureBtn.disabled = true;
        applySignatureBtn.textContent = 'Generating...';

        try {
            const overlayLeft = parseFloat(signatureOverlay.style.left) || 0;
            const overlayTop = parseFloat(signatureOverlay.style.top) || 0;
            const overlayWidth = parseFloat(signatureOverlay.style.width);
            const overlayHeight = parseFloat(signatureOverlay.style.height);

            const pdfPointX = overlayLeft / viewportScale;
            const pageHeightPoints = pdfPageViewport.height / viewportScale;
            const pdfPointY = pageHeightPoints - (overlayTop / viewportScale) - (overlayHeight / viewportScale);

            const pdfLibDoc = await PDFLib.PDFDocument.load(pdfBytes);
            const pages = pdfLibDoc.getPages();
            if (currentPageNum < 1 || currentPageNum > pages.length) throw new Error('Invalid page');

            const sigDataURL = signatureCanvas.toDataURL('image/png');
            const sigImageBytes = await fetch(sigDataURL).then(res => res.arrayBuffer());
            const sigImage = await pdfLibDoc.embedPng(sigImageBytes);

            const sigDisplayScaleFactor = 3;
            const sigWidthPoints = (signatureCanvas.width / sigDisplayScaleFactor) / viewportScale;
            const sigHeightPoints = (signatureCanvas.height / sigDisplayScaleFactor) / viewportScale;

            const page = pages[currentPageNum - 1];
            page.drawImage(sigImage, {
                x: pdfPointX,
                y: pdfPointY,
                width: sigWidthPoints,
                height: sigHeightPoints,
                opacity: 1,
                blendMode: 'Normal',
            });

            const modifiedPdfBytes = await pdfLibDoc.save();
            const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'signed_document.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            applySignatureBtn.textContent = '✅ Apply Signature & Download';
            applySignatureBtn.disabled = false;
        } catch (error) {
            console.error(error);
            alert('An error occurred while generating the signed PDF. Please try again.');
            applySignatureBtn.textContent = '✅ Apply Signature & Download';
            applySignatureBtn.disabled = false;
        }
    });

    function resetPdf() {
        pdfDoc = null;
        totalPages = 0;
        currentPageNum = 1;
        pdfBytes = null;
        viewportScale = 1;
        pdfPageViewport = null;

        pdfSection.style.display = 'none';

        const ctx = pdfCanvas.getContext('2d');
        ctx.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
        pdfCanvas.width = 0;
        pdfCanvas.height = 0;

        signatureOverlay.style.display = 'none';
        signatureOverlay.src = '';

        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
        pageInfo.textContent = '';
        applySignatureBtn.disabled = true;
        removePdfBtn.disabled = true;
        if (placementHint) placementHint.style.display = 'none';

        fileInput.value = '';
    }

    // Event listener
    removePdfBtn.addEventListener('click', resetPdf);

    // ── Window Resize ──────────────────────────
    window.addEventListener('resize', () => {
        if (pdfDoc) renderPage(currentPageNum);
    });

    // Start theme toggle
    initTheme();

})();