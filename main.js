/**
 * ===================================
 * Product Dashboard - Main JavaScript
 * NNPTUD-0502 Lab Assignment
 * ===================================
 * 
 * Chức năng chính:
 * 1. Load data từ API
 * 2. Search theo title (realtime)
 * 3. Pagination (phân trang)
 * 4. Sorting (sắp xếp theo title/price)
 * 5. Export CSV
 * 6. View detail modal
 * 7. Edit product
 * 8. Create product
 */

// =====================
// GLOBAL VARIABLES
// =====================

// API Base URL
const API_BASE_URL = 'https://api.escuelajs.co/api/v1';

// Mảng lưu toàn bộ products từ API
let allProducts = [];

// Mảng products sau khi filter/search
let filteredProducts = [];

// Trạng thái phân trang hiện tại
let currentPage = 1;
let itemsPerPage = 10;

// Trạng thái sorting
let currentSortField = null;  // 'id', 'title', 'price'
let currentSortOrder = 'asc'; // 'asc' hoặc 'desc'

// Trạng thái edit mode
let isEditMode = false;

// =====================
// DOM ELEMENTS
// =====================

// Lấy các element khi DOM đã load xong
document.addEventListener('DOMContentLoaded', function () {
    // Khởi tạo Dashboard
    init();
});

/**
 * Hàm khởi tạo chính
 * Gọi khi trang được load
 */
function init() {
    console.log('🚀 Dashboard đang khởi tạo...');

    // Load dữ liệu từ API
    loadProducts();

    // Gắn event listeners
    setupEventListeners();

    console.log('✅ Dashboard đã sẵn sàng!');
}

// =====================
// EVENT LISTENERS
// =====================

/**
 * Thiết lập tất cả event listeners
 */
function setupEventListeners() {
    // 1. Search input - realtime filter
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);

    // 2. Items per page select
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    itemsPerPageSelect.addEventListener('change', handleItemsPerPageChange);

    // 3. Export CSV button
    const exportBtn = document.getElementById('exportCsvBtn');
    exportBtn.addEventListener('click', handleExportCSV);

    // 4. Sortable headers
    const sortableHeaders = document.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', handleSort);
    });

    // 5. Toggle Edit button
    const toggleEditBtn = document.getElementById('toggleEditBtn');
    toggleEditBtn.addEventListener('click', toggleEditMode);

    // 6. Save Edit button
    const saveEditBtn = document.getElementById('saveEditBtn');
    saveEditBtn.addEventListener('click', handleSaveEdit);

    // 7. Create Product button
    const submitCreateBtn = document.getElementById('submitCreateBtn');
    submitCreateBtn.addEventListener('click', handleCreateProduct);

    // 8. Reset edit mode when modal closes
    const detailModal = document.getElementById('detailModal');
    detailModal.addEventListener('hidden.bs.modal', resetEditMode);

    // 9. Reset create form when modal closes
    const createModal = document.getElementById('createModal');
    createModal.addEventListener('hidden.bs.modal', function () {
        document.getElementById('createProductForm').reset();
        document.getElementById('createImages').value = 'https://placehold.co/600x400';
    });
}

// =====================
// API FUNCTIONS
// =====================

/**
 * Load tất cả products từ API
 * GET /products
 */
async function loadProducts() {
    showLoading(true);

    try {
        console.log('🔄 Đang gọi API:', `${API_BASE_URL}/products`);

        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📥 Dữ liệu nhận được:', data);

        // Kiểm tra nếu API trả về mảng rỗng hoặc không hợp lệ
        if (!Array.isArray(data)) {
            throw new Error('API không trả về mảng hợp lệ');
        }

        allProducts = data;
        filteredProducts = [...allProducts]; // Copy mảng

        console.log(`📦 Đã load ${allProducts.length} sản phẩm`);

        // Nếu không có sản phẩm, thông báo
        if (allProducts.length === 0) {
            console.warn('⚠️ API trả về 0 sản phẩm - có thể API đang có vấn đề');
            showToast('warning', 'Cảnh báo', 'API không có sản phẩm nào. Hãy thử tạo sản phẩm mới!');
        } else {
            showToast('success', 'Load dữ liệu thành công!', `Đã tải ${allProducts.length} sản phẩm.`);
        }

        // Render bảng
        renderTable();
        showLoading(false);

    } catch (error) {
        console.error('❌ Lỗi khi load products:', error);
        console.error('Chi tiết lỗi:', error.message);
        showLoading(false);

        // Thông báo lỗi chi tiết hơn
        let errorMsg = 'Không thể tải dữ liệu.';
        if (error.message.includes('Failed to fetch')) {
            errorMsg = 'Lỗi CORS hoặc không có kết nối mạng. Hãy chạy qua Live Server!';
        } else if (error.message.includes('HTTP error')) {
            errorMsg = `Lỗi từ server: ${error.message}`;
        }

        showToast('error', 'Lỗi!', errorMsg);

        // Vẫn render bảng trống
        renderTable();
    }
}

/**
 * Tạo sản phẩm mới
 * POST /products
 */
async function createProduct(productData) {
    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newProduct = await response.json();
        console.log('✅ Đã tạo sản phẩm mới:', newProduct);

        return newProduct;

    } catch (error) {
        console.error('❌ Lỗi khi tạo sản phẩm:', error);
        throw error;
    }
}

/**
 * Cập nhật sản phẩm
 * PUT /products/{id}
 */
async function updateProduct(id, productData) {
    try {
        console.log('🔄 Đang cập nhật sản phẩm ID:', id);
        console.log('📤 Dữ liệu gửi đi:', productData);

        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        console.log('📡 Response status:', response.status);

        // Đọc response body để xem lỗi chi tiết
        const responseData = await response.json();
        console.log('📥 Response data:', responseData);

        if (!response.ok) {
            // Log lỗi chi tiết từ API
            console.error('❌ API Error:', responseData);
            throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }

        console.log('✅ Đã cập nhật sản phẩm:', responseData);
        return responseData;

    } catch (error) {
        console.error('❌ Lỗi khi cập nhật sản phẩm:', error);
        throw error;
    }
}

// =====================
// SEARCH FUNCTION
// =====================

/**
 * Xử lý tìm kiếm theo title
 * Realtime filter - không reload trang
 */
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();

    console.log(`🔍 Đang tìm kiếm: "${searchTerm}"`);

    // Filter theo title
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm)
        );
    }

    // Reset về trang 1 khi search
    currentPage = 1;

    // Áp dụng sorting nếu có
    if (currentSortField) {
        applySorting();
    }

    // Render lại bảng
    renderTable();

    console.log(`📋 Tìm thấy ${filteredProducts.length} sản phẩm`);
}

// =====================
// PAGINATION FUNCTIONS
// =====================

/**
 * Xử lý thay đổi số items mỗi trang
 */
function handleItemsPerPageChange(event) {
    itemsPerPage = parseInt(event.target.value);
    currentPage = 1; // Reset về trang 1

    console.log(`📄 Hiển thị ${itemsPerPage} items/trang`);

    renderTable();
}

/**
 * Chuyển đến trang cụ thể
 */
function goToPage(page) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Validate page number
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderTable();

    // Scroll to top of table
    document.getElementById('tableCard').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Render pagination controls
 */
function renderPagination() {
    const totalItems = filteredProducts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Update pagination info
    const paginationInfo = document.getElementById('paginationInfo');
    paginationInfo.innerHTML = `Hiển thị <strong>${startItem}-${endItem}</strong> trong tổng số <strong>${totalItems}</strong> sản phẩm`;

    // Build pagination buttons
    const paginationList = document.getElementById('paginationList');
    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">
                <i class="bi bi-chevron-left"></i> Previous
            </a>
        </li>
    `;

    // Page numbers - hiển thị tối đa 5 trang
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Adjust startPage if near the end
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    // First page + ellipsis
    if (startPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPage(1); return false;">1</a>
            </li>
        `;
        if (startPage > 2) {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>
            </li>
        `;
    }

    // Last page + ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPage(${totalPages}); return false;">${totalPages}</a>
            </li>
        `;
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;">
                Next <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;

    paginationList.innerHTML = paginationHTML;
}

// =====================
// SORTING FUNCTIONS
// =====================

/**
 * Xử lý click vào header để sort
 */
function handleSort(event) {
    const header = event.currentTarget;
    const sortField = header.dataset.sort;

    // Toggle sort order
    if (currentSortField === sortField) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortField = sortField;
        currentSortOrder = 'asc';
    }

    console.log(`📊 Sắp xếp theo ${sortField} (${currentSortOrder})`);

    // Update header UI
    updateSortHeaderUI(header);

    // Apply sorting
    applySorting();

    // Render table
    renderTable();
}

/**
 * Cập nhật UI của header khi sort
 */
function updateSortHeaderUI(activeHeader) {
    // Remove all sort classes
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('asc', 'desc');
        const icon = header.querySelector('.sort-icon');
        icon.className = 'bi bi-arrow-down-up sort-icon';
    });

    // Add active class
    activeHeader.classList.add(currentSortOrder);
    const icon = activeHeader.querySelector('.sort-icon');
    icon.className = `bi bi-arrow-${currentSortOrder === 'asc' ? 'up' : 'down'} sort-icon`;
}

/**
 * Áp dụng sorting cho filteredProducts
 */
function applySorting() {
    if (!currentSortField) return;

    filteredProducts.sort((a, b) => {
        let valueA, valueB;

        switch (currentSortField) {
            case 'id':
                valueA = a.id;
                valueB = b.id;
                break;
            case 'title':
                valueA = a.title.toLowerCase();
                valueB = b.title.toLowerCase();
                break;
            case 'price':
                valueA = a.price;
                valueB = b.price;
                break;
            default:
                return 0;
        }

        // Compare
        if (valueA < valueB) return currentSortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return currentSortOrder === 'asc' ? 1 : -1;
        return 0;
    });
}

// =====================
// EXPORT CSV FUNCTION
// =====================

/**
 * Xuất dữ liệu hiện tại sang file CSV
 * Chỉ xuất dữ liệu đang hiển thị (theo search + page + sort)
 */
function handleExportCSV() {
    // Lấy products đang hiển thị trên trang hiện tại
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageProducts = filteredProducts.slice(startIndex, endIndex);

    if (currentPageProducts.length === 0) {
        showToast('warning', 'Không có dữ liệu', 'Không có sản phẩm nào để xuất.');
        return;
    }

    // Tạo header CSV
    const headers = ['id', 'title', 'price', 'category'];

    // Tạo rows
    const rows = currentPageProducts.map(product => {
        return [
            product.id,
            `"${product.title.replace(/"/g, '""')}"`, // Escape quotes
            product.price,
            `"${product.category?.name || 'N/A'}"`
        ].join(',');
    });

    // Combine header và rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Tạo Blob và download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `products_page${currentPage}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`📥 Đã xuất ${currentPageProducts.length} sản phẩm sang CSV`);
    showToast('success', 'Export thành công!', `Đã xuất ${currentPageProducts.length} sản phẩm.`);
}

// =====================
// MODAL FUNCTIONS
// =====================

/**
 * Hiển thị modal chi tiết sản phẩm
 */
function showProductDetail(productId) {
    // Tìm product theo id
    const product = allProducts.find(p => p.id === productId);

    if (!product) {
        showToast('error', 'Lỗi!', 'Không tìm thấy sản phẩm.');
        return;
    }

    console.log('👁️ Xem chi tiết sản phẩm:', product);

    // Điền thông tin vào modal
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editTitle').value = product.title;
    document.getElementById('editPrice').value = product.price;
    document.getElementById('editDescription').value = product.description || '';
    document.getElementById('editCategory').value = product.category?.name || 'N/A';

    // Hiển thị images
    const imagesContainer = document.getElementById('detailImages');
    imagesContainer.innerHTML = '';

    if (product.images && product.images.length > 0) {
        product.images.forEach((img, index) => {
            // Xử lý URL ảnh (một số có format lạ)
            let imgUrl = img;
            if (img.startsWith('["') || img.startsWith('[\"')) {
                // Parse JSON string nếu cần
                try {
                    const parsed = JSON.parse(img.replace(/'/g, '"'));
                    imgUrl = Array.isArray(parsed) ? parsed[0] : parsed;
                } catch (e) {
                    imgUrl = img.replace(/[\[\]"']/g, '');
                }
            }

            const imgElement = document.createElement('img');
            imgElement.src = imgUrl;
            imgElement.alt = `Image ${index + 1}`;
            imgElement.className = 'img-thumbnail';
            imgElement.onerror = function () {
                this.src = 'https://placehold.co/100x100?text=No+Image';
            };
            imagesContainer.appendChild(imgElement);
        });
    } else {
        imagesContainer.innerHTML = '<p class="text-muted">Không có ảnh</p>';
    }

    // Reset edit mode
    resetEditMode();

    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();
}

/**
 * Toggle edit mode trong modal chi tiết
 */
function toggleEditMode() {
    isEditMode = !isEditMode;

    const form = document.getElementById('editProductForm');
    const inputs = form.querySelectorAll('input, textarea');
    const toggleBtn = document.getElementById('toggleEditBtn');
    const saveBtn = document.getElementById('saveEditBtn');

    if (isEditMode) {
        // Bật edit mode
        inputs.forEach(input => {
            if (input.id !== 'editProductId' && input.id !== 'editCategory') {
                input.removeAttribute('readonly');
            }
        });
        form.classList.add('edit-mode');
        toggleBtn.innerHTML = '<i class="bi bi-x-circle"></i> Hủy Edit';
        toggleBtn.classList.remove('btn-warning');
        toggleBtn.classList.add('btn-secondary');
        saveBtn.classList.remove('d-none');
    } else {
        // Tắt edit mode
        resetEditMode();
    }
}

/**
 * Reset edit mode về trạng thái xem
 */
function resetEditMode() {
    isEditMode = false;

    const form = document.getElementById('editProductForm');
    const inputs = form.querySelectorAll('input, textarea');
    const toggleBtn = document.getElementById('toggleEditBtn');
    const saveBtn = document.getElementById('saveEditBtn');

    inputs.forEach(input => {
        input.setAttribute('readonly', true);
    });

    form.classList.remove('edit-mode');
    toggleBtn.innerHTML = '<i class="bi bi-pencil"></i> Edit';
    toggleBtn.classList.remove('btn-secondary');
    toggleBtn.classList.add('btn-warning');
    saveBtn.classList.add('d-none');
}

/**
 * Xử lý lưu thay đổi khi edit
 */
async function handleSaveEdit() {
    const productId = document.getElementById('editProductId').value;
    const title = document.getElementById('editTitle').value.trim();
    const price = parseFloat(document.getElementById('editPrice').value);
    const description = document.getElementById('editDescription').value.trim();

    // Validate
    if (!title || title.length < 3) {
        showToast('error', 'Lỗi!', 'Title phải có ít nhất 3 ký tự.');
        return;
    }

    if (isNaN(price) || price < 1) {
        showToast('error', 'Lỗi!', 'Price phải là số và lớn hơn 0.');
        return;
    }

    // Lấy thông tin product hiện tại để giữ categoryId và images
    const currentProduct = allProducts.find(p => p.id === parseInt(productId));

    // Chuẩn bị data đầy đủ theo yêu cầu API
    const updateData = {
        title: title,
        price: Math.round(price),
        description: description || 'No description',
        categoryId: currentProduct?.category?.id || 1,
        images: currentProduct?.images || ["https://placehold.co/600x400"]
    };

    try {
        // Gọi API update
        const updatedProduct = await updateProduct(productId, updateData);

        // Cập nhật trong allProducts
        const index = allProducts.findIndex(p => p.id === parseInt(productId));
        if (index !== -1) {
            allProducts[index] = { ...allProducts[index], ...updatedProduct };
        }

        // Cập nhật trong filteredProducts
        const filteredIndex = filteredProducts.findIndex(p => p.id === parseInt(productId));
        if (filteredIndex !== -1) {
            filteredProducts[filteredIndex] = { ...filteredProducts[filteredIndex], ...updatedProduct };
        }

        // Đóng modal và reload table
        bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide();
        renderTable();

        showToast('success', 'Cập nhật thành công!', `Sản phẩm "${title}" đã được cập nhật.`);

    } catch (error) {
        showToast('error', 'Lỗi!', 'Không thể cập nhật sản phẩm. Vui lòng thử lại.');
    }
}


/**
 * Xử lý tạo sản phẩm mới
 */
async function handleCreateProduct() {
    // Lấy dữ liệu từ form
    const title = document.getElementById('createTitle').value.trim();
    const price = parseFloat(document.getElementById('createPrice').value);
    const description = document.getElementById('createDescription').value.trim();
    const categoryId = parseInt(document.getElementById('createCategoryId').value);
    const imagesText = document.getElementById('createImages').value.trim();

    // Validate
    if (!title || title.length < 3) {
        showToast('error', 'Lỗi!', 'Title phải có ít nhất 3 ký tự.');
        return;
    }

    if (isNaN(price) || price < 1) {
        showToast('error', 'Lỗi!', 'Price phải là số và lớn hơn 0.');
        return;
    }

    if (!description || description.length < 10) {
        showToast('error', 'Lỗi!', 'Description phải có ít nhất 10 ký tự.');
        return;
    }

    if (!categoryId) {
        showToast('error', 'Lỗi!', 'Vui lòng chọn danh mục.');
        return;
    }

    // Parse images URLs
    const images = imagesText.split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

    if (images.length === 0) {
        showToast('error', 'Lỗi!', 'Vui lòng nhập ít nhất 1 link ảnh.');
        return;
    }

    // Chuẩn bị data
    const productData = {
        title: title,
        price: price,
        description: description,
        categoryId: categoryId,
        images: images
    };

    try {
        // Gọi API create
        const newProduct = await createProduct(productData);

        // Thêm vào đầu allProducts
        allProducts.unshift(newProduct);
        filteredProducts.unshift(newProduct);

        // Đóng modal
        bootstrap.Modal.getInstance(document.getElementById('createModal')).hide();

        // Reset về trang 1 và render
        currentPage = 1;
        renderTable();

        showToast('success', 'Tạo thành công!', `Sản phẩm "${title}" đã được tạo.`);

    } catch (error) {
        showToast('error', 'Lỗi!', 'Không thể tạo sản phẩm. Vui lòng thử lại.');
    }
}

// =====================
// RENDER FUNCTIONS
// =====================

/**
 * Render bảng products
 */
function renderTable() {
    const tableBody = document.getElementById('productsTableBody');
    const tableCard = document.getElementById('tableCard');
    const paginationContainer = document.getElementById('paginationContainer');

    // Tính toán products cho trang hiện tại
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageProducts = filteredProducts.slice(startIndex, endIndex);

    // Hiển thị table card
    tableCard.style.display = 'block';
    paginationContainer.style.display = 'flex';

    // Kiểm tra nếu không có products
    if (currentPageProducts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <div>
                        <i class="bi bi-inbox"></i>
                        <p class="mb-0">Không tìm thấy sản phẩm nào</p>
                    </div>
                </td>
            </tr>
        `;
        renderPagination();
        return;
    }

    // Build HTML cho mỗi row
    let html = '';

    currentPageProducts.forEach(product => {
        // Xử lý image URL
        let imageUrl = 'https://placehold.co/50x50?text=No+Image';
        if (product.images && product.images.length > 0) {
            let imgSrc = product.images[0];
            // Xử lý URL ảnh lạ
            if (imgSrc.startsWith('["') || imgSrc.startsWith('[\"')) {
                try {
                    const parsed = JSON.parse(imgSrc.replace(/'/g, '"'));
                    imgSrc = Array.isArray(parsed) ? parsed[0] : parsed;
                } catch (e) {
                    imgSrc = imgSrc.replace(/[\[\]"']/g, '');
                }
            }
            imageUrl = imgSrc;
        }

        // Truncate description for tooltip
        const description = product.description || 'Không có mô tả';
        const truncatedDesc = description.length > 200
            ? description.substring(0, 200) + '...'
            : description;

        html += `
            <tr onclick="showProductDetail(${product.id})"
                data-bs-toggle="tooltip" 
                data-bs-placement="top" 
                data-bs-html="true"
                title="<strong>Mô tả:</strong><br>${escapeHtml(truncatedDesc)}">
                <td><strong>#${product.id}</strong></td>
                <td>${escapeHtml(product.title)}</td>
                <td class="price-cell">$${product.price.toLocaleString()}</td>
                <td>
                    <span class="category-badge">${escapeHtml(product.category?.name || 'N/A')}</span>
                </td>
                <td>
                    <img src="${imageUrl}" 
                         alt="${escapeHtml(product.title)}" 
                         class="product-thumbnail"
                         onerror="this.src='https://placehold.co/50x50?text=No+Image'">
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;

    // Khởi tạo Bootstrap tooltips
    initTooltips();

    // Render pagination
    renderPagination();
}

/**
 * Khởi tạo Bootstrap tooltips
 */
function initTooltips() {
    // Destroy old tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(el => {
        const existingTooltip = bootstrap.Tooltip.getInstance(el);
        if (existingTooltip) {
            existingTooltip.dispose();
        }
    });

    // Create new tooltips
    tooltipTriggerList.forEach(el => {
        new bootstrap.Tooltip(el);
    });
}

// =====================
// UTILITY FUNCTIONS
// =====================

/**
 * Hiển thị/ẩn loading spinner
 */
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const tableCard = document.getElementById('tableCard');
    const paginationContainer = document.getElementById('paginationContainer');

    if (show) {
        spinner.style.display = 'block';
        tableCard.style.display = 'none';
        paginationContainer.style.display = 'none';
    } else {
        spinner.style.display = 'none';
    }
}

/**
 * Hiển thị toast notification
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {string} title - Tiêu đề
 * @param {string} message - Nội dung
 */
function showToast(type, title, message) {
    const toast = document.getElementById('notificationToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');

    // Set content
    toastTitle.textContent = title;
    toastMessage.textContent = message;

    // Set color based on type
    toast.className = 'toast';
    switch (type) {
        case 'success':
            toast.classList.add('bg-success', 'text-white');
            break;
        case 'error':
            toast.classList.add('bg-danger', 'text-white');
            break;
        case 'warning':
            toast.classList.add('bg-warning');
            break;
        default:
            toast.classList.add('bg-info', 'text-white');
    }

    // Show toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });
    bsToast.show();
}

/**
 * Escape HTML để tránh XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =====================
// END OF FILE
// =====================
