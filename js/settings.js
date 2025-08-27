// إعدادات التطبيق
let users = [];
let currentUser = null;

// تهيئة صفحة الإعدادات
async function initSettingsPage() {
    await loadUsersFromStorage();
    await checkLoginStatus();
    setupSettingsEventListeners();
    setupLoginEventListeners();
}

// تحميل المستخدمين من localStorage
async function loadUsersFromStorage() {
    try {
        const savedUsers = localStorage.getItem('qrAppUsers');
        if (savedUsers) {
            users = JSON.parse(savedUsers);
        }
    } catch (e) {
        console.error("Error loading users from storage:", e);
        showToast("خطأ في تحميل بيانات المستخدمين.", "error");
    }
}

// حفظ المستخدمين إلى localStorage
function saveUsersToStorage() {
    try {
        localStorage.setItem('qrAppUsers', JSON.stringify(users));
    } catch (e) {
        console.error("Error saving users to storage:", e);
        showToast("خطأ في حفظ بيانات المستخدمين.", "error");
    }
}

// التحقق من حالة تسجيل الدخول
async function checkLoginStatus() {
    const loggedInUser = localStorage.getItem('qrAppCurrentUser');
    
    if (loggedInUser) {
        try {
            currentUser = JSON.parse(loggedInUser);
            showSettingsPage();
            updateUserProfile();
        } catch (e) {
            console.error("Error parsing logged in user:", e);
            showLoginPage();
        }
    } else {
        showLoginPage();
    }
}

// تحديث صورة المستخدم
function updateUserAvatar() {
    const avatarElement = document.getElementById('user-avatar');
    if (avatarElement) {
        if (currentUser && currentUser.name) {
            // أخذ الحرف الأول من الاسم
            avatarElement.textContent = currentUser.name.charAt(0);
        } else {
            avatarElement.textContent = "?";
        }
    }
}

// تحديث الملف الشخصي
function updateUserProfile() {
    if (currentUser) {
        const nameElement = document.getElementById('user-profile-name');
        const emailElement = document.getElementById('user-profile-email');
        const avatarElement = document.getElementById('user-profile-avatar');
        
        if (nameElement) nameElement.textContent = currentUser.name;
        if (emailElement) emailElement.textContent = currentUser.email;
        if (avatarElement) avatarElement.textContent = currentUser.name.charAt(0);
    }
}

// عرض صفحة تسجيل الدخول
function showLoginPage() {
    document.getElementById('login-page').style.display = 'block';
    document.getElementById('register-page').style.display = 'none';
    document.getElementById('settings-page').style.display = 'none';
    updateUserAvatar();
}

// عرض صفحة إنشاء حساب
function showRegisterPage() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('register-page').style.display = 'block';
    document.getElementById('settings-page').style.display = 'none';
    updateUserAvatar();
}

// عرض صفحة الإعدادات
function showSettingsPage() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('register-page').style.display = 'none';
    document.getElementById('settings-page').style.display = 'block';
    updateUserAvatar();
    updateUserProfile();
}

// إعداد مستمعي الأحداث لتسجيل الدخول
function setupLoginEventListeners() {
    // الانتقال إلى صفحة التسجيل
    document.getElementById('show-register').addEventListener('click', function(e) {
        e.preventDefault();
        showRegisterPage();
    });
    
    // الانتقال إلى صفحة تسجيل الدخول
    document.getElementById('show-login').addEventListener('click', function(e) {
        e.preventDefault();
        showLoginPage();
    });
    
    // تسجيل الدخول
    document.getElementById('login-btn').addEventListener('click', loginUser);
    
    // إنشاء حساب جديد
    document.getElementById('register-btn').addEventListener('click', registerUser);
    
    // نسيت كلمة المرور
    document.getElementById('forgot-password').addEventListener('click', function(e) {
        e.preventDefault();
        showToast("سيتم إضافة هذه الميزة قريباً", "info");
    });
}

// تسجيل الدخول
function loginUser() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        showToast("يرجى إدخال اسم المستخدم وكلمة المرور", "error");
        return;
    }
    
    // البحث عن المستخدم
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('qrAppCurrentUser', JSON.stringify(user));
        showSettingsPage();
        updateUserAvatar();
        updateUserProfile();
        showToast("تم تسجيل الدخول بنجاح", "success");
    } else {
        showToast("اسم المستخدم أو كلمة المرور غير صحيحة", "error");
    }
}

// إنشاء حساب جديد
function registerUser() {
    const name = document.getElementById('register-name').value;
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // التحقق من الحقول المطلوبة
    if (!name || !username || !email || !password || !confirmPassword) {
        showToast("يرجى ملء جميع الحقول", "error");
        return;
    }
    
    // التحقق من تطابق كلمتي المرور
    if (password !== confirmPassword) {
        showToast("كلمتا المرور غير متطابقتين", "error");
        return;
    }
    
    // التحقق من طول كلمة المرور
    if (password.length < 6) {
        showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
        return;
    }
    
    // التحقق من عدم وجود اسم مستخدم مكرر
    if (users.some(u => u.username === username)) {
        showToast("اسم المستخدم موجود مسبقاً", "error");
        return;
    }
    
    // التحقق من عدم وجود بريد إلكتروني مكرر
    if (users.some(u => u.email === email)) {
        showToast("البريد الإلكتروني موجود مسبقاً", "error");
        return;
    }
    
    // إنشاء المستخدم الجديد
    const newUser = {
        id: Date.now(),
        name: name,
        username: username,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
    };
    
    // إضافة المستخدم إلى القائمة
    users.push(newUser);
    saveUsersToStorage();
    
    // تسجيل الدخول تلقائياً
    currentUser = newUser;
    localStorage.setItem('qrAppCurrentUser', JSON.stringify(newUser));
    
    showSettingsPage();
    updateUserAvatar();
    updateUserProfile();
    showToast("تم إنشاء الحساب بنجاح", "success");
}

// إعداد مستمعي الأحداث للإعدادات
function setupSettingsEventListeners() {
    // إعدادات الوضع الداكن/الفاتح
    const darkModeToggle = document.getElementById('dark-mode-setting');
    if (darkModeToggle) {
        darkModeToggle.checked = app.settings.darkMode;
        darkModeToggle.addEventListener('change', function() {
            app.settings.darkMode = this.checked;
            applyTheme();
            saveToDatabase();
            showToast(app.settings.darkMode ? 'تم تفعيل الوضع الفاتح.' : 'تم تفعيل الوضع الداكن.', 'info');
        });
    }
    
    // إعدادات الاهتزاز
    const vibrationToggle = document.getElementById('vibration-setting');
    if (vibrationToggle) {
        vibrationToggle.checked = app.settings.vibration;
        vibrationToggle.addEventListener('change', function() {
            app.settings.vibration = this.checked;
            saveToDatabase();
            showToast('تم تحديث إعداد الاهتزاز.', 'info');
        });
    }
    
    // إعدادات الفتح التلقائي
    const autoOpenToggle = document.getElementById('auto-open-setting');
    if (autoOpenToggle) {
        autoOpenToggle.checked = app.settings.autoOpen;
        autoOpenToggle.addEventListener('change', function() {
            app.settings.autoOpen = this.checked;
            saveToDatabase();
            showToast('تم تحديث إعداد الفتح التلقائي.', 'info');
        });
    }
    
    // إعدادات حفظ التاريخ
    const saveHistoryToggle = document.getElementById('save-history-setting');
    if (saveHistoryToggle) {
        saveHistoryToggle.checked = app.settings.saveHistory;
        saveHistoryToggle.addEventListener('change', function() {
            app.settings.saveHistory = this.checked;
            saveToDatabase();
            showToast('تم تحديث إعداد حفظ التاريخ.', 'info');
        });
    }
    
    // تسجيل الخروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logoutUser();
        });
    }
    
    // حذف الحساب
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function() {
            deleteAccount();
        });
    }
    
    // عناصر الإعدادات الأخرى
    document.querySelectorAll('.setting-item .setting-arrow').forEach(arrow => {
        arrow.addEventListener('click', function() {
            const settingTitle = this.closest('.setting-item').querySelector('.setting-title').textContent;
            showToast(`سيتم إضافة إعدادات ${settingTitle} قريباً`, 'info');
        });
    });
}

// تسجيل الخروج
function logoutUser() {
    Swal.fire({
        title: 'تسجيل الخروج',
        text: "هل أنت متأكد من أنك تريد تسجيل الخروج؟",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4361ee',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'نعم، سجل الخروج',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('qrAppCurrentUser');
            currentUser = null;
            showLoginPage();
            showToast('تم تسجيل الخروج بنجاح', 'info');
        }
    });
}

// حذف الحساب
function deleteAccount() {
    Swal.fire({
        title: 'حذف الحساب',
        html: `
            <p>هل أنت متأكد من أنك تريد حذف حسابك؟</p>
            <p class="text-danger">هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع بياناتك بشكل دائم.</p>
            <div class="form-group mt-3">
                <label for="confirm-delete">اكتب "حذف" للتأكيد</label>
                <input type="text" id="confirm-delete" class="form-control" placeholder="حذف">
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'نعم، احذف الحساب',
        cancelButtonText: 'إلغاء',
        preConfirm: () => {
            const confirmText = document.getElementById('confirm-delete').value;
            if (confirmText !== 'حذف') {
                Swal.showValidationMessage('يرجى كتابة "حذف" بشكل صحيح');
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // حذف المستخدم من القائمة
            users = users.filter(u => u.id !== currentUser.id);
            saveUsersToStorage();
            
            // حذف بيانات التطبيق الخاصة بالمستخدم
            localStorage.removeItem('qrAppData');
            localStorage.removeItem('qrAppCurrentUser');
            
            currentUser = null;
            app.qrCodes = [];
            app.history = [];
            
            showLoginPage();
            showToast('تم حذف الحساب وجميع البيانات المرتبطة به', 'info');
        }
    });
}

// بدء التطبيق عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', async function() {
    await initDatabase();
    await loadFromDatabase();
    applyTheme();
    initSettingsPage();
});
