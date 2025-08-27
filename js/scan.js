// تهيئة صفحة المسح
function initScanPage() {
    setupScanPageEventListeners();
}

// إعداد مستمعي الأحداث لصفحة المسح
function setupScanPageEventListeners() {
    document.getElementById('flash-toggle').addEventListener('click', toggleFlash);
    document.getElementById('cancel-scan').addEventListener('click', stopScanner);
    document.getElementById('zoom-in').addEventListener('click', zoomIn);
    document.getElementById('zoom-out').addEventListener('click', zoomOut);
    document.getElementById('open-link-btn').addEventListener('click', openScannedLink);
    document.getElementById('copy-content-btn').addEventListener('click', copyScannedContent);
    document.getElementById('switch-camera-btn').addEventListener('click', switchCamera);
    document.getElementById('scan-from-image-btn').addEventListener('click', () => document.getElementById('image-upload').click());
    document.getElementById('image-upload').addEventListener('change', scanFromImage);
}

// بدء الماسح الضوئي
function startScanner() {
    document.getElementById('scan-result').style.display = 'none';
    app.zoomLevel = 1.0;
    updateZoomDisplay();
    
    document.getElementById('camera-access-message').style.display = 'block';
    document.getElementById('camera-error-message').style.display = 'none';

    // إيقاف الماسح السابق إذا كان يعمل
    stopScanner();

    const videoElement = document.getElementById('scanner-video');
    let scanner = new Instascan.Scanner({
        video: videoElement,
        mirror: false,
        backgroundScan: false,
        refractoryPeriod: 1500,
        scanPeriod: 1
    });
    
    scanner.addListener('scan', async function(content) {
        document.getElementById('scanned-content').textContent = content;
        document.getElementById('scanned-date').textContent = formatDate(new Date().toISOString());

        let title = 'محتوى';
        let isLink = false;
        if (isValidHttpUrl(content)) {
            title = 'رابط موقع';
            isLink = true;
        } else if (content.startsWith('tel:')) {
            title = 'رقم هاتف';
        } else if (content.startsWith('mailto:')) {
            title = 'بريد إلكتروني';
        } else if (content.startsWith('WIFI:')) {
            title = 'شبكة Wi-Fi';
        } else if (content.startsWith('BEGIN:VCARD')) {
            title = 'بطاقة اتصال (vCard)';
        } else if (content.startsWith('sms:')) {
            title = 'رسالة SMS';
        } else if (content.startsWith('geo:')) {
            title = 'إحداثيات موقع';
        }

        document.getElementById('scanned-title').textContent = title;
        document.getElementById('scan-result').style.display = 'block';
        document.getElementById('open-link-btn').style.display = isLink ? 'flex' : 'none';
        
        if (app.settings.vibration && 'vibrate' in navigator) {
            navigator.vibrate(200);
        }
        
        if (app.settings.autoOpen && isLink) {
            setTimeout(() => {
                window.open(content, '_blank');
            }, 500);
        }
        
        if (app.settings.saveHistory) {
            try {
                await saveHistoryItem({
                    type: 'scan',
                    content: content,
                    date: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error saving scan history:', error);
            }
        }
        showToast('تم مسح رمز QR بنجاح!', 'success');
    });
    
    Instascan.Camera.getCameras().then(function(cameras) {
        app.cameras = cameras;
        if (cameras.length > 0) {
            document.getElementById('camera-access-message').style.display = 'none';
            if (app.currentCameraIndex >= cameras.length) {
                app.currentCameraIndex = 0;
            }
            scanner.start(cameras[app.currentCameraIndex]);
            app.scanner = scanner;
            showToast('تم بدء تشغيل الماسح الضوئي.', 'info');
        } else {
            document.getElementById('camera-access-message').style.display = 'none';
            document.getElementById('camera-error-message').style.display = 'block';
            document.getElementById('camera-error-text').textContent = 'لم يتم العثور على أي كاميرات.';
            showToast('لم يتم العثور على كاميرا!', 'error');
        }
    }).catch(function(e) {
        console.error(e);
        document.getElementById('camera-access-message').style.display = 'none';
        document.getElementById('camera-error-message').style.display = 'block';
        document.getElementById('camera-error-text').textContent = 'حدث خطأ في الوصول إلى الكاميرا: ' + e.message;
        showToast('حدث خطأ في الوصول إلى الكاميرا.', 'error');
    });
}

// إيقاف الماسح الضوئي
function stopScanner() {
    if (app.scanner) {
        app.scanner.stop();
        app.scanner = null;
        showToast('تم إيقاف الماسح الضوئي.', 'info');
    }
    if (app.flashOn) {
        toggleFlash();
    }
}

// تبديل الفلاش
function toggleFlash() {
    if (app.scanner && app.scanner.camera && typeof app.scanner.camera.flash === 'boolean') {
        app.flashOn = !app.flashOn;
        app.scanner.camera.flash = app.flashOn;
        document.getElementById('flash-toggle').classList.toggle('pulse', app.flashOn);
        showToast(app.flashOn ? 'تم تشغيل الفلاش.' : 'تم إيقاف الفلاش.', 'info');
    } else {
        showToast('الفلاش غير مدعوم أو غير متاح.', 'warning');
    }
}

// تبديل الكاميرا
function switchCamera() {
    if (app.cameras.length > 1) {
        app.currentCameraIndex = (app.currentCameraIndex + 1) % app.cameras.length;
        stopScanner();
        startScanner();
        showToast(`تم التبديل إلى الكاميرا رقم ${app.currentCameraIndex + 1}`, 'info');
    } else {
        showToast('لا توجد كاميرات أخرى للتبديل بينها.', 'info');
    }
}

// تكبير
function zoomIn() {
    if (app.zoomLevel < app.maxZoom) {
        app.zoomLevel = Math.min(app.zoomLevel + app.zoomStep, app.maxZoom);
        applyZoom();
    }
}

// تصغير
function zoomOut() {
    if (app.zoomLevel > app.minZoom) {
        app.zoomLevel = Math.max(app.zoomLevel - app.zoomStep, app.minZoom);
        applyZoom();
    }
}

// تطبيق التكبير/التصغير
function applyZoom() {
    const video = document.getElementById('scanner-video');
    if (video) {
        video.style.setProperty('--scanner-zoom', app.zoomLevel.toFixed(2));
        updateZoomDisplay();
    }
}

// تحديث عرض مستوى التكبير
function updateZoomDisplay() {
    document.getElementById('zoom-level').textContent = app.zoomLevel.toFixed(1) + 'x';
}

// فتح الرابط الممسوح
function openScannedLink() {
    const content = document.getElementById('scanned-content').textContent;
    if (isValidHttpUrl(content)) {
        window.open(content, '_blank');
    } else {
        showToast('هذا الرابط غير صالح للفتح مباشرة', 'warning');
    }
}

// نسخ المحتوى الممسوح
function copyScannedContent() {
    const content = document.getElementById('scanned-content').textContent;
    navigator.clipboard.writeText(content).then(() => {
        showToast('تم نسخ المحتوى إلى الحافظة!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('فشل نسخ المحتوى.', 'error');
    });
}

// مسح من صورة
function scanFromImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // استخدام jsQR لتحليل الصورة
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                // معالجة النتيجة
                document.getElementById('scanned-content').textContent = code.data;
                document.getElementById('scanned-date').textContent = formatDate(new Date().toISOString());
                
                let title = 'محتوى';
                let isLink = false;
                if (isValidHttpUrl(code.data)) {
                    title = 'رابط موقع';
                    isLink = true;
                }
                
                document.getElementById('scanned-title').textContent = title;
                document.getElementById('scan-result').style.display = 'block';
                document.getElementById('open-link-btn').style.display = isLink ? 'flex' : 'none';
                
                showToast('تم مسح الرمز من الصورة بنجاح!', 'success');
                
                // حفظ في التاريخ
                if (app.settings.saveHistory) {
                    saveHistoryItem({
                        type: 'scan',
                        content: code.data,
                        date: new Date().toISOString()
                    });
                }
            } else {
                showToast('لم يتم العثور على رمز QR في الصورة', 'error');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// بدء التطبيق عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', async function() {
    await initDatabase();
    loadFromLocalStorage();
    applyTheme();
    initScanPage();
    startScanner();
});
