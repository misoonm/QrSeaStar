// تهيئة صفحة إنشاء الرمز
function initCreatePage() {
    setupCreatePageEventListeners();
    updateQRCodePreview();
}

// إعداد مستمعي الأحداث لصفحة الإنشاء
function setupCreatePageEventListeners() {
    // QR Type selection
    document.querySelectorAll('.qr-type').forEach(type => {
        type.addEventListener('click', function() {
            document.querySelectorAll('.qr-type').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            updateFormFields(this.dataset.type);
            updateQRCodePreview();
        });
    });
    
    // Input field change for real-time preview
    document.querySelectorAll('.qr-form .form-control').forEach(input => {
        input.addEventListener('input', updateQRCodePreview);
    });
    
    document.querySelectorAll('.qr-form .color-picker').forEach(input => {
        input.addEventListener('change', function() {
            if (this.id === 'qr-color') app.qrColor = this.value;
            if (this.id === 'qr-bg-color') app.qrBgColor = this.value;
            saveToLocalStorage();
            updateQRCodePreview();
        });
    });

    // Logo upload
    document.getElementById('qr-logo-upload').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                app.qrLogoImage = e.target.result;
                document.getElementById('logo-preview').src = app.qrLogoImage;
                document.getElementById('logo-preview').style.display = 'block';
                document.getElementById('remove-logo-btn').style.display = 'inline-block';
                saveToLocalStorage();
                updateQRCodePreview();
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('remove-logo-btn').addEventListener('click', function() {
        app.qrLogoImage = null;
        document.getElementById('logo-preview').src = '#';
        document.getElementById('logo-preview').style.display = 'none';
        this.style.display = 'none';
        saveToLocalStorage();
        updateQRCodePreview();
    });

    // Generate QR Code
    document.getElementById('generate-btn').addEventListener('click', generateQRCode);
    
    // Download QR Code
    document.getElementById('download-btn').addEventListener('click', downloadQRCode);
    
    // Save QR Code
    document.getElementById('save-btn').addEventListener('click', saveQRCode);

    // Share QR Code
    document.getElementById('share-btn').addEventListener('click', shareQRCode);
}

// Validate input field
function validateInput(inputId, errorMessageId, validationFn) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(errorMessageId);
    if (validationFn && !validationFn(input.value)) {
        errorElement.style.display = 'block';
        input.classList.add('is-invalid');
        return false;
    } else {
        errorElement.style.display = 'none';
        input.classList.remove('is-invalid');
        return true;
    }
}

// Update form fields based on selected type
function updateFormFields(type) {
    document.querySelectorAll('.qr-type-fields').forEach(fields => {
        fields.classList.remove('active');
    });
    document.querySelectorAll('.form-error-message').forEach(err => err.style.display = 'none');
    document.querySelectorAll('.form-control').forEach(input => input.classList.remove('is-invalid'));

    document.getElementById(`${type}-fields`).classList.add('active');
}

// Real-time QR Code Preview
let currentQRiousPreview = null;
function updateQRCodePreview() {
    const type = document.querySelector('.qr-type.active').dataset.type;
    let content = getQRContent(type);

    const previewCanvas = document.getElementById('qrcode-preview');
    const previewWrapper = document.getElementById('qrcode-preview-wrapper');
    const livePreviewCard = document.getElementById('qr-live-preview-card');
    
    if (!content) {
        if (livePreviewCard) livePreviewCard.style.display = 'none';
        return;
    }
    if (livePreviewCard) livePreviewCard.style.display = 'block';

    // Clear previous logo if exists
    const existingLogo = previewWrapper.querySelector('.qr-logo');
    if (existingLogo) {
        existingLogo.remove();
    }

    currentQRiousPreview = new QRious({
        element: previewCanvas,
        value: content,
        size: 200,
        level: 'H',
        foreground: app.qrColor,
        background: app.qrBgColor
    });

    // Add logo if available
    if (app.qrLogoImage) {
        const logoImg = new Image();
        logoImg.src = app.qrLogoImage;
        logoImg.className = 'qr-logo';
        logoImg.onload = () => {
            previewWrapper.appendChild(logoImg);
        };
        logoImg.onerror = () => {
            showToast('فشل تحميل الشعار. قد تكون الصورة تالفة.', 'error');
        };
    }
}

// Get QR content based on type and input values
function getQRContent(type) {
    let content = '';
    let isValid = true;

    switch(type) {
        case 'url':
            content = document.getElementById('qr-content-url').value;
            isValid = validateInput('qr-content-url', 'url-error', isValidHttpUrl);
            break;
        case 'text':
            content = document.getElementById('qr-content-text').value;
            isValid = validateInput('qr-content-text', 'text-error', val => val.trim() !== '');
            break;
        case 'wifi':
            const ssid = document.getElementById('qr-wifi-ssid').value;
            const password = document.getElementById('qr-wifi-password').value;
            const encryption = document.getElementById('qr-wifi-encryption').value;
            content = `WIFI:S:${ssid};T:${encryption};P:${password};;`;
            isValid = validateInput('qr-wifi-ssid', 'wifi-ssid-error', val => val.trim() !== '');
            isValid = isValid && validateInput('qr-wifi-password', 'wifi-password-error', val => val.trim() !== '');
            break;
        case 'email':
            const email = document.getElementById('qr-email-address').value;
            const subject = document.getElementById('qr-email-subject').value;
            const body = document.getElementById('qr-email-body').value;
            content = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            isValid = validateInput('qr-email-address', 'email-error', val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
            break;
        case 'phone':
            const phone = document.getElementById('qr-phone-number').value;
            content = `tel:${phone}`;
            isValid = validateInput('qr-phone-number', 'phone-error', val => /^\+?[0-9\s-()]{7,20}$/.test(val));
            break;
        case 'sms':
            const smsNumber = document.getElementById('qr-sms-number').value;
            const smsMessage = document.getElementById('qr-sms-message').value;
            content = `sms:${smsNumber}?body=${encodeURIComponent(smsMessage)}`;
            isValid = validateInput('qr-sms-number', 'sms-number-error', val => /^\+?[0-9\s-()]{7,20}$/.test(val));
            isValid = isValid && validateInput('qr-sms-message', 'sms-message-error', val => val.trim() !== '');
            break;
        case 'vcard':
            const vName = document.getElementById('qr-vcard-name').value;
            const vPhone = document.getElementById('qr-vcard-phone').value;
            const vEmail = document.getElementById('qr-vcard-email').value;
            const vOrg = document.getElementById('qr-vcard-org').value;
            content = `BEGIN:VCARD\nVERSION:3.0\nFN:${vName}\nTEL:${vPhone}\nEMAIL:${vEmail}\nORG:${vOrg}\nEND:VCARD`;
            isValid = validateInput('qr-vcard-name', 'vcard-name-error', val => val.trim() !== '');
            break;
        case 'location':
            const lat = document.getElementById('qr-location-lat').value;
            const lon = document.getElementById('qr-location-lon').value;
            content = `geo:${lat},${lon}`;
            isValid = validateInput('qr-location-lat', 'location-lat-error', val => val.trim() !== '' && !isNaN(parseFloat(val)));
            isValid = isValid && validateInput('qr-location-lon', 'location-lon-error', val => val.trim() !== '' && !isNaN(parseFloat(val)));
            break;
        default:
            content = document.getElementById('qr-content-url').value;
            isValid = validateInput('qr-content-url', 'url-error', isValidHttpUrl);
    }
    return isValid ? content : null;
}

// Generate final QR Code
function generateQRCode() {
    const type = document.querySelector('.qr-type.active').dataset.type;
    const name = document.getElementById('qr-name').value || "رمز بدون اسم";
    const content = getQRContent(type);

    if (content) {
        const finalCanvas = document.getElementById('qrcode-final');
        const finalWrapper = document.getElementById('qrcode-display-wrapper');

        // Clear previous logo if exists
        const existingLogo = finalWrapper.querySelector('.qr-logo');
        if (existingLogo) {
            existingLogo.remove();
        }

        new QRious({
            element: finalCanvas,
            value: content,
            size: 200,
            level: 'H',
            foreground: app.qrColor,
            background: app.qrBgColor
        });

        // Add logo to final QR if available
        if (app.qrLogoImage) {
            const logoImg = new Image();
            logoImg.src = app.qrLogoImage;
            logoImg.className = 'qr-logo';
            logoImg.onload = () => {
                finalWrapper.appendChild(logoImg);
            };
        }
        
        document.getElementById('qr-result').style.display = 'block';
        
        const newQR = {
            id: Date.now(),
            name: name,
            type: type,
            content: content,
            date: new Date().toISOString(),
            scans: 0,
            favorite: false,
            color: app.qrColor,
            bgColor: app.qrBgColor,
            logo: app.qrLogoImage
        };
        
        app.qrCodes.unshift(newQR);
        
        if (app.settings.saveHistory) {
            app.history.unshift({
                id: Date.now(),
                type: 'create',
                qrId: newQR.id,
                name: name,
                date: new Date().toISOString()
            });
        }
        
        saveToLocalStorage();
        showToast('تم إنشاء رمز QR بنجاح!', 'success');
        
        document.getElementById('qr-result').scrollIntoView({behavior: 'smooth'});
    } else {
        showToast('الرجاء تصحيح الأخطاء في حقول الإدخال.', 'error');
    }
}

// Download QR Code
function downloadQRCode() {
    const canvas = document.querySelector('#qrcode-final');
    if (canvas) {
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('تم تحميل رمز QR.', 'info');
    } else {
        showToast('لم يتم إنشاء رمز QR بعد.', 'warning');
    }
}

// Save QR Code
function saveQRCode() {
    const qrId = app.qrCodes[0].id;
    const qr = app.qrCodes.find(q => q.id === qrId);
    if (qr) {
        qr.favorite = true;
        saveToLocalStorage();
        showToast('تم حفظ الرمز في المفضلة بنجاح!', 'success');
    } else {
        showToast('لا يوجد رمز لحفظه.', 'warning');
    }
}

// Share QR Code
function shareQRCode() {
    const canvas = document.querySelector('#qrcode-final');
    if (canvas && navigator.share) {
        canvas.toBlob(function(blob) {
            const file = new File([blob], 'qrcode.png', { type: 'image/png' });
            navigator.share({
                files: [file],
                title: 'رمز QR الخاص بي',
                text: 'تفقد رمز QR هذا!',
            }).then(() => {
                showToast('تمت مشاركة رمز QR بنجاح!', 'success');
            }).catch((error) => {
                console.error('Error sharing:', error);
                showToast('فشل المشاركة.', 'error');
            });
        }, 'image/png');
    } else if (canvas) {
        showToast('ميزة المشاركة غير مدعومة في متصفحك.', 'info');
        downloadQRCode();
    } else {
        showToast('لا يوجد رمز لمشاركته.', 'warning');
    }
}

// بدء التطبيق عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    applyTheme();
    initCreatePage();
    
    // Set initial colors and logo
    document.getElementById('qr-color').value = app.qrColor;
    document.getElementById('qr-bg-color').value = app.qrBgColor;
    if (app.qrLogoImage) {
        const logoPreview = document.getElementById('logo-preview');
        logoPreview.src = app.qrLogoImage;
        logoPreview.style.display = 'block';
        document.getElementById('remove-logo-btn').style.display = 'inline-block';
    }
});
