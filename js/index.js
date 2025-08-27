// تهيئة الصفحة الرئيسية
async function initHomePage() {
    if (!isUserLoggedIn()) {
        // إذا لم يكن المستخدم مسجل الدخول، redirect إلى صفحة الإعدادات لتسجيل الدخول
        window.location.href = 'settings.html';
        return;
    }
    
    await updateStats();
    setupHomePageEventListeners();
}

// تحديث الإحصائيات
async function updateStats() {
    try {
        const totalQrs = app.qrCodes.length;
        const scanHistory = await getScanHistory();
        const totalScans = scanHistory.length;
        const favorites = await getFavoriteQRCodes();
        const favoritesCount = favorites.length;
        
        document.getElementById('total-qrs').textContent = totalQrs;
        document.getElementById('total-scans').textContent = totalScans;
        document.getElementById('favorites-count').textContent = favoritesCount;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// إعداد مستمعي الأحداث للصفحة الرئيسية
function setupHomePageEventListeners() {
    // إضافة تأثيرات عند التمرير فوق عناصر القائمة
    document.querySelectorAll('.home-menu-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(-5px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
    
    // تحديث الإحصائيات عند النقر على أيقونة التحديث
    document.querySelector('.stats-grid').addEventListener('click', async function() {
        await updateStats();
        showToast('تم تحديث الإحصائيات', 'info');
    });
}

// بدء التطبيق عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', async function() {
    await initApp();
    initHomePage();
});
