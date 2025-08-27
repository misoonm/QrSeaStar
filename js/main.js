// بيانات التطبيق
const app = {
    qrCodes: [],
    history: [],
    settings: {
        vibration: true,
        autoOpen: true,
        saveHistory: true,
        darkMode: false
    },
    currentUser: null,
    scanner: null,
    flashOn: false,
    zoomLevel: 1.0,
    maxZoom: 3.0,
    minZoom: 0.5,
    zoomStep: 0.25,
    cameras: [],
    currentCameraIndex: 0,
    qrLogoImage: null,
    qrColor: '#4361ee',
    qrBgColor: '#ffffff'
};

// تهيئة التطبيق
async function initApp() {
    try {
        // تهيئة قاعدة البيانات
        await initDatabase();
        
        // تحميل البيانات من قاعدة البيانات
        await loadFromDatabase();
        
        // تطبيق المظهر
        applyTheme();
        
        // توليد بيانات نموذجية إذا لم تكن هناك بيانات
        if (app.qrCodes.length === 0 && app.history.length === 0) {
            await generateSampleData();
        }
        
        // إعداد التنقل
        setupNavigation();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('حدث خطأ في تهيئة التطبيق', 'error');
    }
}

// تحميل البيانات من قاعدة البيانات
async function loadFromDatabase() {
    try {
        // تحميل الإعدادات
        const settings = await getSettings();
        if (settings) {
            app.settings = { ...app.settings, ...settings };
        }
        
        // تحميل رموز QR
        app.qrCodes = await getAllQRCodes();
        
        // تحميل التاريخ
        app.history = await getAllHistory();
        
        // تحميل المستخدم الحالي إذا كان مسجلاً
        const userData = localStorage.getItem('qrAppCurrentUser');
        if (userData) {
            app.currentUser = JSON.parse(userData);
            updateUserAvatar();
        }
    } catch (error) {
        console.error('Error loading from database:', error);
        showToast('حدث خطأ في تحميل البيانات', 'error');
    }
}

// حفظ البيانات إلى قاعدة البيانات
async function saveToDatabase() {
    try {
        // حفظ الإعدادات
        await saveSettings(app.settings);
        
        // مزامنة رموز QR مع قاعدة البيانات
        for (const qr of app.qrCodes) {
            await saveQRCode(qr);
        }
        
        // مزامنة التاريخ مع قاعدة البيانات
        for (const item of app.history) {
            await saveHistoryItem(item);
        }
    } catch (error) {
        console.error('Error saving to database:', error);
        showToast('حدث خطأ في حفظ البيانات', 'error');
    }
}

// توليد بيانات نموذجية
async function generateSampleData() {
    try {
        if (app.qrCodes.length === 0) {
            const sampleQRs = [
                {
                    name: "موقعي الشخصي",
                    type: "url",
                    content: "https://www.example.com",
                    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    scans: 12,
                    favorite: true,
                    color: '#4361ee',
                    bgColor: '#ffffff',
                    logo: null
                },
                {
                    name: "معلومات الاتصال",
                    type: "vcard",
                    content: "BEGIN:VCARD\nVERSION:3.0\nFN:عمار الوزير\nTEL:+1234567890\nEMAIL:ammar@example.com\nEND:VCARD",
                    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    scans: 8,
                    favorite: false,
                    color: '#3f37c9',
                    bgColor: '#ffffff',
                    logo: null
                }
            ];
            
            for (const qr of sampleQRs) {
                await saveQRCode(qr);
            }
            app.qrCodes = sampleQRs;
        }
        
        if (app.history.length === 0) {
            const sampleHistory = [
                {
                    type: 'scan',
                    content: 'https://www.google.com',
                    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                },
                {
                    type: 'create',
                    qrId: app.qrCodes[0].id,
                    name: "موقعي الشخصي",
                    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];
            
            for (const item of sampleHistory) {
                await saveHistoryItem(item);
            }
            app.history = sampleHistory;
        }
    } catch (error) {
        console.error('Error generating sample data:', error);
    }
}

// Helper function for showing toasts
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = '';
    if (type === 'success') icon = '<i class="fas fa-check-circle"></i>';
    else if (type === 'error') icon = '<i class="fas fa-times-circle"></i>';
    else if (type === 'warning') icon = '<i class="fas fa-exclamation-triangle"></i>';
    else icon = '<i class="fas fa-info-circle"></i>';

    toast.innerHTML = `${icon} <span class="toast-message">${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 3000);
}

// إعداد التنقل
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            
            this.classList.add('active');
            
            // إدارة حالة الماسح الضوئي
            if (this.getAttribute('href') === 'scan.html') {
                // إذا انتقلنا إلى صفحة المسح، سنقوم ببدء الماسح هناك
            } else if (app.scanner) {
                stopScanner();
            }
            
            // الانتقال إلى الصفحة
            window.location.href = this.getAttribute('href');
        });
    });
}

// Apply Dark/Light Mode
function applyTheme() {
    const body = document.body;
    const darkModeToggle = document.getElementById('dark-mode-setting');
    
    if (app.settings.darkMode) {
        body.classList.add('light-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    } else {
        body.classList.remove('light-mode');
        if (darkModeToggle) darkModeToggle.checked = false;
    }
}

// تحديث صورة المستخدم
function updateUserAvatar() {
    if (app.currentUser && app.currentUser.name) {
        const avatarElement = document.getElementById('user-avatar');
        if (avatarElement) {
            // أخذ الحرف الأول من الاسم
            avatarElement.textContent = app.currentUser.name.charAt(0);
        }
    }
}

// الحصول على المستخدم الحالي
function getCurrentUser() {
    const userData = localStorage.getItem('qrAppCurrentUser');
    return userData ? JSON.parse(userData) : null;
}

// التحقق من وجود مستخدم مسجل دخوله
function isUserLoggedIn() {
    return localStorage.getItem('qrAppCurrentUser') !== null;
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// التحقق من أن النص هو رابط صالح
function isValidHttpUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;  
    }
}

// الحصول على أيقونة حسب نوع المحتوى الممسوح
function getIconForScanContent(content) {
    if (isValidHttpUrl(content)) return 'fas fa-link';
    if (content.startsWith('tel:')) return 'fas fa-phone';
    if (content.startsWith('mailto:')) return 'fas fa-envelope';
    if (content.startsWith('WIFI:')) return 'fas fa-wifi';
    if (content.startsWith('BEGIN:VCARD')) return 'fas fa-address-card';
    if (content.startsWith('sms:')) return 'fas fa-comment-sms';
    if (content.startsWith('geo:')) return 'fas fa-map-marker-alt';
    return 'fas fa-font';
}

// Get readable title for scanned content
function getScanTitle(content) {
    if (isValidHttpUrl(content)) return 'رابط موقع';
    if (content.startsWith('tel:')) return 'رقم هاتف';
    if (content.startsWith('mailto:')) return 'بريد إلكتروني';
    if (content.startsWith('WIFI:')) return 'شبكة Wi-Fi';
    if (content.startsWith('BEGIN:VCARD')) return 'بطاقة اتصال (vCard)';
    if (content.startsWith('sms:')) return 'رسالة SMS';
    if (content.startsWith('geo:')) return 'إحداثيات موقع';
    return 'نص';
}

// الحصول على أيقونة حسب نوع QR
function getIconForType(type) {
    switch(type) {
        case 'url': return 'fas fa-link';
        case 'text': return 'fas fa-font';
        case 'wifi': return 'fas fa-wifi';
        case 'email': return 'fas fa-envelope';
        case 'phone': return 'fas fa-phone';
        case 'sms': return 'fas fa-comment-sms';
        case 'vcard': return 'fas fa-address-card';
        case 'location': return 'fas fa-map-marker-alt';
        default: return 'fas fa-qrcode';
    }
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

// بدء التطبيق عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', initApp);

// حفظ البيانات قبل إغلاق الصفحة
window.addEventListener('beforeunload', function() {
    saveToDatabase();
});

// حفظ البيانات عند تغيير الصفحة
window.addEventListener('pagehide', function() {
    saveToDatabase();
});
