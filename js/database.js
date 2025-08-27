// إدارة قاعدة البيانات IndexedDB
const DB_NAME = 'QRCodeAppDB';
const DB_VERSION = 1;
let db = null;

// تهيئة قاعدة البيانات
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('فشل فتح قاعدة البيانات');
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('تم فتح قاعدة البيانات بنجاح');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // إنشاء مخزن للرموز QR
            if (!db.objectStoreNames.contains('qrcodes')) {
                const qrStore = db.createObjectStore('qrcodes', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                qrStore.createIndex('type', 'type', { unique: false });
                qrStore.createIndex('favorite', 'favorite', { unique: false });
                qrStore.createIndex('date', 'date', { unique: false });
            }
            
            // إنشاء مخزن للتاريخ
            if (!db.objectStoreNames.contains('history')) {
                const historyStore = db.createObjectStore('history', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                historyStore.createIndex('type', 'type', { unique: false });
                historyStore.createIndex('date', 'date', { unique: false });
            }
            
            // إنشاء مخزن للمستخدمين
            if (!db.objectStoreNames.contains('users')) {
                const usersStore = db.createObjectStore('users', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                usersStore.createIndex('username', 'username', { unique: true });
                usersStore.createIndex('email', 'email', { unique: true });
            }
            
            // إنشاء مخزن للإعدادات
            if (!db.objectStoreNames.contains('settings')) {
                const settingsStore = db.createObjectStore('settings', { 
                    keyPath: 'id' 
                });
                // الإعدادات الافتراضية
                settingsStore.add({
                    id: 'app_settings',
                    vibration: true,
                    autoOpen: true,
                    saveHistory: true,
                    darkMode: false
                });
            }
            
            console.log('تم إنشاء قاعدة البيانات بنجاح');
        };
    });
}

// الدوال الأساسية للتعامل مع قاعدة البيانات

// حفظ بيانات في المخزن
function saveToStore(storeName, data) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('قاعدة البيانات غير مهيئة'));
            return;
        }
        
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// جلب جميع البيانات من المخزن
function getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('قاعدة البيانات غير مهيئة'));
            return;
        }
        
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// جلب بيانات محددة بالاستعلام
function getFromStore(storeName, key) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('قاعدة البيانات غير مهيئة'));
            return;
        }
        
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// حذف بيانات من المخزن
function deleteFromStore(storeName, key) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('قاعدة البيانات غير مهيئة'));
            return;
        }
        
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

// الدوال الخاصة بالتطبيق

// حفظ رمز QR
async function saveQRCode(qrData) {
    try {
        const id = await saveToStore('qrcodes', qrData);
        return id;
    } catch (error) {
        console.error('خطأ في حفظ رمز QR:', error);
        throw error;
    }
}

// جلب جميع رموز QR
async function getAllQRCodes() {
    try {
        const qrCodes = await getAllFromStore('qrcodes');
        return qrCodes.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error('خطأ في جلب رموز QR:', error);
        throw error;
    }
}

// جلب رموز QR المفضلة
async function getFavoriteQRCodes() {
    try {
        const transaction = db.transaction(['qrcodes'], 'readonly');
        const store = transaction.objectStore('qrcodes');
        const index = store.index('favorite');
        const request = index.getAll(true);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('خطأ في جلب الرموز المفضلة:', error);
        throw error;
    }
}

// حذف رمز QR
async function deleteQRCode(id) {
    try {
        await deleteFromStore('qrcodes', id);
        return true;
    } catch (error) {
        console.error('خطأ في حذف رمز QR:', error);
        throw error;
    }
}

// حفظ عنصر في التاريخ
async function saveHistoryItem(historyItem) {
    try {
        const id = await saveToStore('history', historyItem);
        return id;
    } catch (error) {
        console.error('خطأ في حفظ عنصر التاريخ:', error);
        throw error;
    }
}

// جلب جميع عناصر التاريخ
async function getAllHistory() {
    try {
        const history = await getAllFromStore('history');
        return history.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error('خطأ في جلب التاريخ:', error);
        throw error;
    }
}

// جلب تاريخ المسح فقط
async function getScanHistory() {
    try {
        const transaction = db.transaction(['history'], 'readonly');
        const store = transaction.objectStore('history');
        const index = store.index('type');
        const request = index.getAll('scan');
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('خطأ في جلب تاريخ المسح:', error);
        throw error;
    }
}

// جلب تاريخ الإنشاء فقط
async function getCreateHistory() {
    try {
        const transaction = db.transaction(['history'], 'readonly');
        const store = transaction.objectStore('history');
        const index = store.index('type');
        const request = index.getAll('create');
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('خطأ في جلب تاريخ الإنشاء:', error);
        throw error;
    }
}

// حذف عنصر من التاريخ
async function deleteHistoryItem(id) {
    try {
        await deleteFromStore('history', id);
        return true;
    } catch (error) {
        console.error('خطأ في حذف عنصر التاريخ:', error);
        throw error;
    }
}

// مسح كل التاريخ
async function clearAllHistory() {
    try {
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');
        const request = store.clear();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('خطأ في مسح التاريخ:', error);
        throw error;
    }
}

// حفظ المستخدم
async function saveUser(userData) {
    try {
        const id = await saveToStore('users', userData);
        return id;
    } catch (error) {
        console.error('خطأ في حفظ المستخدم:', error);
        throw error;
    }
}

// جلب المستخدم باسم المستخدم
async function getUserByUsername(username) {
    try {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const index = store.index('username');
        const request = index.get(username);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('خطأ في جلب المستخدم:', error);
        throw error;
    }
}

// جلب الإعدادات
async function getSettings() {
    try {
        const settings = await getFromStore('settings', 'app_settings');
        return settings || {
            vibration: true,
            autoOpen: true,
            saveHistory: true,
            darkMode: false
        };
    } catch (error) {
        console.error('خطأ في جلب الإعدادات:', error);
        return {
            vibration: true,
            autoOpen: true,
            saveHistory: true,
            darkMode: false
        };
    }
}

// حفظ الإعدادات
async function saveSettings(settings) {
    try {
        const settingsData = {
            id: 'app_settings',
            ...settings
        };
        await saveToStore('settings', settingsData);
        return true;
    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
        throw error;
    }
}

// تصدير جميع البيانات
async function exportAllData() {
    try {
        const [qrcodes, history, settings] = await Promise.all([
            getAllFromStore('qrcodes'),
            getAllFromStore('history'),
            getFromStore('settings', 'app_settings')
        ]);
        
        return {
            qrcodes,
            history,
            settings,
            exportDate: new Date().toISOString()
        };
    } catch (error) {
        console.error('خطأ في تصدير البيانات:', error);
        throw error;
    }
}

// استيراد البيانات
async function importAllData(data) {
    try {
        const transaction = db.transaction(['qrcodes', 'history', 'settings'], 'readwrite');
        
        // مسح البيانات القديمة
        transaction.objectStore('qrcodes').clear();
        transaction.objectStore('history').clear();
        
        // إضافة البيانات الجديدة
        if (data.qrcodes) {
            for (const qr of data.qrcodes) {
                transaction.objectStore('qrcodes').add(qr);
            }
        }
        
        if (data.history) {
            for (const item of data.history) {
                transaction.objectStore('history').add(item);
            }
        }
        
        if (data.settings) {
            transaction.objectStore('settings').put(data.settings);
        }
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error('خطأ في استيراد البيانات:', error);
        throw error;
    }
}
