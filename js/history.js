// تهيئة صفحة التاريخ
async function initHistoryPage() {
    await loadHistoryItems();
    setupHistoryPageEventListeners();
}

// تحميل عناصر التاريخ
async function loadHistoryItems() {
    try {
        const history = await getAllHistory();
        app.history = history;
        renderHistoryItems('scan');
    } catch (error) {
        console.error('Error loading history:', error);
        showToast('حدث خطأ في تحميل التاريخ', 'error');
    }
}

// إعداد مستمعي الأحداث لصفحة التاريخ
function setupHistoryPageEventListeners() {
    document.querySelectorAll('.history-tabs .tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.history-tabs .tab').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            renderHistoryItems(this.dataset.tab);
        });
    });
}

// عرض عناصر التاريخ
async function renderHistoryItems(type) {
    const container = document.getElementById('history-items');
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    
    let items = [];
    
    if (type === 'scan') {
        items = await getScanHistory();
    } else if (type === 'create') {
        items = await getCreateHistory();
    } else if (type === 'favorites') {
        items = await getFavoriteQRCodes();
    }

    if (items.length === 0) {
        document.getElementById('no-history-message').style.display = 'block';
    } else {
        document.getElementById('no-history-message').style.display = 'none';
    }
    
    items.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.setAttribute('data-id', item.id);
        if (type === 'favorites') {
            historyItem.setAttribute('data-qr-id', item.id);
        }
        
        let icon, title, desc, favoriteIconClass = 'far fa-star';
        
        if (type === 'favorites') {
            icon = getIconForType(item.type);
            title = item.name;
            desc = item.content.substring(0, 50) + (item.content.length > 50 ? '...' : '');
            favoriteIconClass = 'fas fa-star';
        } else if (item.type === 'scan') {
            icon = getIconForScanContent(item.content);
            title = getScanTitle(item.content);
            desc = item.content.substring(0, 50) + (item.content.length > 50 ? '...' : '');
        } else if (item.type === 'create') {
            icon = getIconForType(item.qrType);
            title = item.name || 'رمز منشأ';
            desc = item.content.substring(0, 50) + (item.content.length > 50 ? '...' : '');
            const originalQR = app.qrCodes.find(q => q.id === item.qrId);
            if (originalQR && originalQR.favorite) {
                favoriteIconClass = 'fas fa-star';
            }
        }
        
        historyItem.innerHTML = `
            <div class="history-icon">
                <i class="${icon}"></i>
            </div>
            <div class="history-content">
                <div class="history-title">${title}</div>
                <div class="history-desc">${desc}</div>
                <div class="history-date">
                    <i class="fas fa-clock"></i> ${formatDate(item.date)}
                </div>
            </div>
            <div class="favorite-btn" data-id="${type === 'favorites' ? item.id : (item.qrId || null)}">
                <i class="${favoriteIconClass}"></i>
            </div>
        `;
        
        fragment.appendChild(historyItem);
    });
    
    container.appendChild(fragment);

    // إضافة معالجي الأحداث
    container.addEventListener('click', function(e) {
        const target = e.target;
        const historyItem = target.closest('.history-item');
        const favoriteBtn = target.closest('.favorite-btn');

        if (favoriteBtn && favoriteBtn.dataset.id && type !== 'favorites') {
            const qrId = parseInt(favoriteBtn.dataset.id);
            toggleFavorite(qrId);
        } else if (historyItem) {
            if (type === 'favorites') {
                const qrId = parseInt(historyItem.dataset.qrId);
                showQRDetails(qrId);
            } else if (type === 'scan') {
                const scannedContent = historyItem.querySelector('.history-desc').textContent;
                showScannedDetails(scannedContent, historyItem.querySelector('.history-title').textContent);
            } else if (type === 'create') {
                const qrId = historyItem.dataset.id ? app.history.find(h => h.id === parseInt(historyItem.dataset.id)).qrId : null;
                if (qrId) {
                    showQRDetails(qrId);
                }
            }
        }
    });
}

// عرض تفاصيل المحتوى الممسوح
function showScannedDetails(content, title) {
    let isLink = isValidHttpUrl(content);
    Swal.fire({
        title: title,
        html: `
            <p style="margin-top: 15px; font-size: 15px; font-weight: bold; color: #4895ef;">المحتوى:</p>
            <p style="font-size: 14px; word-break: break-all; color: #f8f9fa;">${content}</p>
        `,
        showCancelButton: true,
        cancelButtonText: 'إغلاق',
        showConfirmButton: isLink,
        confirmButtonText: '<i class="fas fa-external-link-alt"></i> فتح الرابط',
        showDenyButton: true,
        denyButtonText: '<i class="fas fa-copy"></i> نسخ المحتوى',
        showCloseButton: true
    }).then((result) => {
        if (result.isConfirmed && isLink) {
            window.open(content, '_blank');
        } else if (result.isDenied) {
            navigator.clipboard.writeText(content).then(() => {
                showToast('تم نسخ المحتوى إلى الحافظة!', 'success');
            }).catch(err => {
                console.error('Failed to copy:', err);
                showToast('فشل نسخ المحتوى.', 'error');
            });
        }
    });
}

// بدء التطبيق عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', async function() {
    await initDatabase();
    loadFromLocalStorage();
    applyTheme();
    initHistoryPage();
});
