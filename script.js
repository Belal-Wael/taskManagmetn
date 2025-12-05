// متغيرات عامة
let projects = [];
let editingIndex = -1;

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    setupEventListeners();
    renderProjects();
});

// إعداد مستمعي الأحداث
function setupEventListeners() {
    const form = document.getElementById('projectForm');
    const searchInput = document.getElementById('searchInput');

    form.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', handleSearch);
}

// معالجة إرسال النموذج
function handleFormSubmit(e) {
    e.preventDefault();

    const projectData = {
        id: Date.now(),
        name: document.getElementById('projectName').value.trim(),
        startDate: document.getElementById('startDate').value,
        deadline: document.getElementById('deadline').value,
        myPayment: parseFloat(document.getElementById('myPayment').value) || 0,
        assignedTo: document.getElementById('assignedTo').value.trim() || 'غير محدد',
        assignedPayment: parseFloat(document.getElementById('assignedPayment').value) || 0,
        isDelivered: false,
        isPaid: false,
        createdAt: new Date().toISOString()
    };

    if (editingIndex !== -1) {
        // تحديث مشروع موجود
        projects[editingIndex] = projectData;
        editingIndex = -1;
        document.querySelector('.btn-primary').textContent = 'إضافة المشروع';
    } else {
        // إضافة مشروع جديد
        projects.push(projectData);
    }

    saveProjects();
    renderProjects();
    document.getElementById('projectForm').reset();
}

// حفظ المشاريع في localStorage
function saveProjects() {
    localStorage.setItem('projects', JSON.stringify(projects));
}

// تحميل المشاريع من localStorage
function loadProjects() {
    const saved = localStorage.getItem('projects');
    if (saved) {
        projects = JSON.parse(saved);
    }
}

// عرض المشاريع في الجدول
function renderProjects(filteredProjects = null) {
    const tbody = document.getElementById('projectsTableBody');
    const emptyState = document.getElementById('emptyState');
    const projectsToShow = filteredProjects || projects;

    tbody.innerHTML = '';

    if (projectsToShow.length === 0) {
        emptyState.classList.add('show');
        return;
    }

    emptyState.classList.remove('show');

    projectsToShow.forEach((project, index) => {
        const originalIndex = projects.findIndex(p => p.id === project.id);
        const row = createProjectRow(project, originalIndex);
        tbody.appendChild(row);
    });
}

// إنشاء صف في الجدول
function createProjectRow(project, index) {
    const tr = document.createElement('tr');
    const isDelivered = project.isDelivered || false;
    const isPaid = project.isPaid || false;
    const status = getProjectStatus(project.deadline, isDelivered);
    
    tr.innerHTML = `
        <td><strong>${escapeHtml(project.name)}</strong></td>
        <td>${formatDate(project.startDate)}</td>
        <td>${formatDate(project.deadline)}</td>
        <td><strong>${formatCurrency(project.myPayment)}</strong></td>
        <td>${escapeHtml(project.assignedTo)}</td>
        <td>${formatCurrency(project.assignedPayment)}</td>
        <td class="checkbox-cell">
            <label class="table-checkbox-label">
                <input type="checkbox" ${isDelivered ? 'checked' : ''} 
                       onchange="toggleDelivered(${index}, this.checked)">
                <span class="checkbox-text ${isDelivered ? 'checked' : ''}">
                    ${isDelivered ? '✅ تم' : '❌ لم يتم'}
                </span>
            </label>
        </td>
        <td class="checkbox-cell">
            <label class="table-checkbox-label">
                <input type="checkbox" ${isPaid ? 'checked' : ''} 
                       onchange="togglePaid(${index}, this.checked)">
                <span class="checkbox-text ${isPaid ? 'checked' : ''}">
                    ${isPaid ? '✅ تم' : '❌ لم يتم'}
                </span>
            </label>
        </td>
        <td><span class="status-badge status-${status.class}">${status.text}</span></td>
        <td class="actions-cell">
            <button class="btn btn-edit" onclick="editProject(${index})">تعديل</button>
            <button class="btn btn-danger" onclick="deleteProject(${index})">حذف</button>
        </td>
    `;

    return tr;
}

// تحديد حالة المشروع
function getProjectStatus(deadline, isDelivered) {
    // إذا تم التسليم، الحالة دائماً "تم"
    if (isDelivered) {
        return { class: 'delivered', text: 'تم' };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    if (deadlineDate < today) {
        return { class: 'overdue', text: 'متأخر' };
    } else if (deadlineDate.getTime() === today.getTime()) {
        return { class: 'active', text: 'اليوم' };
    } else {
        const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 3) {
            return { class: 'active', text: `${daysLeft} أيام متبقية` };
        }
        return { class: 'completed', text: 'قيد التنفيذ' };
    }
}

// تنسيق التاريخ
function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// تنسيق العملة
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}

// الهروب من HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// تعديل مشروع
function editProject(index) {
    const project = projects[index];
    editingIndex = index;

    document.getElementById('projectName').value = project.name;
    document.getElementById('startDate').value = project.startDate;
    document.getElementById('deadline').value = project.deadline;
    document.getElementById('myPayment').value = project.myPayment;
    document.getElementById('assignedTo').value = project.assignedTo;
    document.getElementById('assignedPayment').value = project.assignedPayment;

    document.querySelector('.btn-primary').textContent = 'تحديث المشروع';
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// حذف مشروع
function deleteProject(index) {
    if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
        projects.splice(index, 1);
        saveProjects();
        renderProjects();
    }
}

// البحث في المشاريع
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (!searchTerm) {
        renderProjects();
        return;
    }

    const filtered = projects.filter(project => {
        return (
            project.name.toLowerCase().includes(searchTerm) ||
            project.assignedTo.toLowerCase().includes(searchTerm) ||
            project.startDate.includes(searchTerm) ||
            project.deadline.includes(searchTerm)
        );
    });

    renderProjects(filtered);
}

// تبديل حالة التسليم
function toggleDelivered(index, checked) {
    projects[index].isDelivered = checked;
    saveProjects();
    renderProjects();
}

// تبديل حالة استلام الفلوس
function togglePaid(index, checked) {
    projects[index].isPaid = checked;
    saveProjects();
    renderProjects();
}

// تصدير البيانات إلى Excel (CSV)
function exportToExcel() {
    if (projects.length === 0) {
        alert('لا توجد مشاريع للتصدير');
        return;
    }

    // رؤوس الأعمدة (بدون مبلغ المنفذ)
    const headers = [
        'اسم المشروع',
        'تاريخ الاستلام',
        'الديدلاين',
        'مبلغ الاستلام',
        'المسؤول',
        'تم التسليم',
        'تم استلام الفلوس',
        'الحالة'
    ];

    // تحويل البيانات إلى صفوف CSV
    const rows = projects.map(project => {
        const isDelivered = project.isDelivered || false;
        const isPaid = project.isPaid || false;
        const status = getProjectStatus(project.deadline, isDelivered);

        return [
            escapeCSV(project.name),
            formatDate(project.startDate),
            formatDate(project.deadline),
            formatCurrency(project.myPayment),
            escapeCSV(project.assignedTo),
            isDelivered ? 'تم' : 'لم يتم',
            isPaid ? 'تم' : 'لم يتم',
            status.text
        ];
    });

    // إنشاء محتوى CSV
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // إضافة BOM للدعم الكامل للعربية في Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // إنشاء رابط التحميل
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // اسم الملف مع التاريخ
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `مشاريع_${date}.csv`);
    
    // تحميل الملف
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// الهروب من الأحرف الخاصة في CSV
function escapeCSV(text) {
    if (!text) return '';
    // إذا كان النص يحتوي على فاصلة أو علامات اقتباس أو سطر جديد
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

// جعل الدوال متاحة بشكل عام
window.toggleDelivered = toggleDelivered;
window.togglePaid = togglePaid;
window.exportToExcel = exportToExcel;

