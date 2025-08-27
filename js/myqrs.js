
// تهيئة صفحة رموزي
async function initMyQrsPage() {
    await loadMyQRCodes();
    setupMyQrsPageEventListeners();
}

// تحميل رموز QR الخاصة بالمستخدم
async function loadMyQRCodes() {
    try {
        const qrCodes = await getAllQRCodes();
        app.qrCodes = qrCodes;
        renderMyQRCodes();
    } catch (error) {
        console.error('Error loading QR codes:', error);
        showToast('حدث خطأ في تحميل الرموز', 'error');
    }
}

// إعداد مستمعي الأحداث لصفحة رموزي
function setupMyQrsPageEventListeners() {
    document.getElementById('my-qr-search').addEventListener('input', renderMyQRCodes);
}

// عرض رموز QR الخاصة بالمستخدم
function renderMyQRCodes() {
    const container = document.getElementById('my-qr-list');
    container.innerHTML = '';
    const searchText = document.getElementById('my-qr-search').value.toLowerCase();

    const fragment = document.createDocumentFragment();

    const filteredQRs = app.qrCodes.filter(qr => 
        qr.name.toLowerCase().includes(searchText) || 
        qr.content.toLowerCase().includes(searchText)
    );

    if (filteredQRs.length === 0) {
        document.getElementById('no-my-qrs-message').style.display = 'block';
    } else {
        document.getElementById('no-my-qrs-message').style.display = 'none';
    }
    
    filteredQRs.forEach(qr => {
        const qrItem = document.createElement('div');
        qrItem.className = 'qr-item';
        qrItem.setAttribute('data-id', qr.id);

        const qrImageWrapper = document.createElement('div');
        qrImageWrapper.className = 'qr-image-wrapper';
        
        const canvas = document.createElement('canvas');
        qrImageWrapper.appendChild(canvas);

        const qrCodeInstance = new QRious({
            element: canvas,
            value: qr.content,
            size: 120,
            level: 'H',
            foreground: qr.color || app.qrColor,
            background: qr.bgColor || app.qrBgColor
        });

        if (qr.logo) {
            const logoImg = new Image();
            logoImg.src = qr.logo;
            logoImg.className = 'qr-logo-small';
            logoImg.onload = () => {
                qrImageWrapper.appendChild(logoImg);
            };
        }

        qrItem.innerHTML = `
            <div class="actions">
                <div class="action-btn fav ${qr.favorite ? 'active' : ''}" data-id="${qr.id}">
                    <i class="${qr.favorite ? 'fas' : 'far'} fa-star"></i>
                </div>
                <div class="action-btn delete" data-id="${qr.id}">
                    <i class="fas fa-trash"></i>
                </div>
            </div>
            <div class="title">${qr.name}</div>
            <div class="date">${formatDate(qr.date)}</div>
        `;
        qrItem.prepend(qrImageWrapper);

        fragment.appendChild(qrItem);
    });
    
    container.appendChild(fragment);

    // إضافة معالجي الأحداث
    container.addEventListener('click', function(e) {
        const target = e.target;
        const qrItem = target.closest('.qr-item');
        const favBtn = target.closest('.action-btn.fav');
        const deleteBtn = target.closest('.action-btn.delete');

        if (favBtn) {
            const id = parseInt(favBtn.dataset.id);
            toggleFavorite(id);
        } else if (deleteBtn) {
            const id = parseInt(deleteBtn.dataset.id);
            deleteQRCode(id);
        } else if (qrItem) {
            const id = parseInt(qrItem.dataset.id);
            showQRDetails(id);
        }
    });
}

// تبديل المفضلة
async function toggleFavorite(id) {
    try {
        const qr = app.qrCodes.find(q => q.id === id);
        if (qr) {
            qr.favorite = !qr.favorite;
            await saveQRCode(qr);
            await loadMyQRCodes();
            showToast(qr.favorite ? 'تمت الإضافة إلى المفضلة.' : 'تمت الإزالة من المفضلة.', 'info');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showToast('حدث خطأ في تحديث المفضلة', 'error');
    }
}

// حذف رمز QR
async function deleteQRCode(id) {
    try {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "لن تتمكن من التراجع عن هذا!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'نعم، احذفه!',
            cancelButtonText: 'إلغاء'
        }).then(async (result) => {
            if (result.isConfirmed) {
                await deleteFromStore('qrcodes', id);
                await loadMyQRCodes();
                showToast('تم حذف الرمز بنجاح!', 'success');
            }
        });
    } catch (error) {
        console.error('Error deleting QR code:', error);
        showToast('حدث خطأ في حذف الرمز', 'error');
    }
}

// عرض تفاصيل رمز QR
async function showQRDetails(id) {
    const qr = app.qrCodes.find(q => q.id === id);
    if (!qr) return;

    const tempCanvas = document.createElement('canvas');
    new QRious({
        element: tempCanvas,
        value: qr.content,
        size: 300,
        level: 'H',
        foreground: qr.color || app.qrColor,
        background: qr.bgColor || app.qrBgColor
    });

    const imgData = tempCanvas.toDataURL('image/png');

    let imageHtml = `<img src="${imgData}" class="swal2-image" style="width: 250px; height: 250px;">`;
    if (qr.logo) {
        imageHtml += `<img src="${qr.logo}" style="max-width: 80px; max-height: 80px; margin-top: 10px; border-radius: 5px; background: white; padding: 2px;" alt="QR Logo">`;
    }

    Swal.fire({
        title: qr.name,
        html: `
            ${imageHtml}
            <p style="margin-top: 15px; font-size: 15px; font-weight: bold; color: #4895ef;">المحتوى:</p>
            <p style="font-size: 14px; word-break: break-all; color: #f8f9fa;">${qr.content}</p>
            <p style="font-size: 13px; color: #6c757d; margin-top: 10px;">
                <i class="fas fa-clock"></i> تم الإنشاء: ${formatDate(qr.date)}
            </p>
            <p style="font-size: 13px; color: #6c757d;">
                <i class="fas fa-chart-bar"></i> عدد المسح: ${qr.scans || 0}
            </p>
        `,
        showCancelButton: true,
        showConfirmButton: false,
        cancelButtonText: 'إغلاق',
        showDenyButton: true,
        denyButtonText: '<i class="fas fa-download"></i> تحميل',
        showCloseButton: true
    }).then(async (result) => {
        if (result.isDenied) {
            await downloadQRCodeById(id);
        }
    });
}

// تنزيل رمز QR
async function downloadQRCodeById(id) {
    const qr = app.qrCodes.find(q => q.id === id);
    if (!qr) {
        showToast('لم يتم العثور على الرمز.', 'error');
        return;
    }

    const downloadCanvas = document.createElement('canvas');
    const qrCodeDownloadInstance = new QRious({
        element: downloadCanvas,
        value: qr.content,
        size: 500,
        level: 'H',
        foreground: qr.color || app.qrColor,
        background: qr.bgColor || app.qrBgColor
    });

    if (qr.logo) {
        const logoImg = new Image();
        logoImg.src = qr.logo;
        logoImg.onload = () => {
            const ctx = downloadCanvas.getContext('2d');
            const qrSize = 500;
            const logoSize = qrSize * 0.25;
            const logoX = (qrSize - logoSize) / 2;
            const logoY = (qrSize - logoSize) / 2;
            ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
            
            const link = document.createElement('a');
            link.download = `${qr.name || 'qrcode'}.png`;
            link.href = downloadCanvas.toDataURL('image/png');
            link.click();
            showToast('تم تحميل الرمز!', 'success');
        };
        logoImg.onerror = () => {
            const link = document.createElement('a');
            link.download = `${qr.name || 'qrcode'}.png`;
            link.href = downloadCanvas.toDataURL('image/png');
            link.click();
            showToast('تم تحميل الرمز (فشل تحميل الشعار).', 'warning');
        };
    } else {
        const link = document.createElement('a');
        link.download = `${qr.name || 'qrcode'}.png`;
        link.href = downloadCanvas.toDataURL('image/png');
        link.click();
        showToast('تم تحميل الرمز!', 'success');
    }
}

// بدء التطبيق عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', async function() {
    await initDatabase();
    loadFromLocalStorage();
    applyTheme();
    initMyQrsPage();
});
