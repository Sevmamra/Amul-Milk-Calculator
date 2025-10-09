document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const elements = {
        productListDiv: document.getElementById('product-list'),
        autoCalculateToggle: document.getElementById('auto-calculate'),
        calculateBtn: document.getElementById('calculate-btn'),
        saveBtn: document.getElementById('save-btn'),
        resetBtn: document.getElementById('reset-btn'),
        totalAmountSpan: document.getElementById('total-amount'),
        toast: document.getElementById('toast'),
        searchInput: document.getElementById('search-input'),
        loadLastOrderBtn: document.getElementById('load-last-order-btn'),
        // Modals
        historyModal: document.getElementById('history-modal'),
        orderDetailsModal: document.getElementById('order-details-modal'),
        settingsModal: document.getElementById('settings-modal'),
        // History Elements
        historyBtn: document.getElementById('history-btn'),
        closeHistoryBtn: document.getElementById('close-history'),
        historyListDiv: document.getElementById('history-list'),
        startDateFilter: document.getElementById('start-date-filter'),
        endDateFilter: document.getElementById('end-date-filter'),
        applyFilterBtn: document.getElementById('apply-filter-btn'),
        downloadCsvBtn: document.getElementById('download-csv-btn'),
        selectAllHistoryBtn: document.getElementById('select-all-history-btn'),
        deleteSelectedHistoryBtn: document.getElementById('delete-selected-history-btn'),
        // Order Details Elements
        closeOrderDetailsBtn: document.getElementById('close-order-details'),
        orderDetailsListDiv: document.getElementById('order-details-list'),
        // Settings Elements
        settingsBtn: document.getElementById('settings-btn'),
        closeSettingsBtn: document.getElementById('close-settings'),
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        themeIcon: document.getElementById('theme-toggle-btn').querySelector('i'),
        addProductForm: document.getElementById('add-product-form'),
        manageProductListDiv: document.getElementById('manage-product-list'),
    };

    let allProducts = [];

    // --- STORAGE & DATA FUNCTIONS ---

    const getProducts = () => JSON.parse(localStorage.getItem('amulCalcProducts')) || [];
    const saveProducts = (products) => localStorage.setItem('amulCalcProducts', JSON.stringify(products));
    const getHistory = () => JSON.parse(localStorage.getItem('amulCalcHistory')) || [];
    const saveHistory = (history) => localStorage.setItem('amulCalcHistory', JSON.stringify(history));
    const getTheme = () => localStorage.getItem('theme') || 'dark';
    const saveTheme = (theme) => localStorage.setItem('theme', theme);

    // --- CORE FUNCTIONS ---

    const showToast = (message) => {
        elements.toast.textContent = message;
        elements.toast.classList.add('show');
        setTimeout(() => elements.toast.classList.remove('show'), 2000);
    };

    const calculateTotal = () => {
        const total = Array.from(document.querySelectorAll('.product-card')).reduce((sum, card) => {
            if (card.style.display === 'none') return sum;
            const quantity = parseInt(card.querySelector('.quantity-display').value) || 0;
            const price = parseFloat(card.dataset.price);
            return sum + (quantity * price);
        }, 0);
        elements.totalAmountSpan.textContent = `₹ ${total.toFixed(2)}`;
        return total;
    };

    const createProductCardHTML = (p) => `
        <div class="product-card" data-id="${p.id}" data-price="${p.price}" data-name="${p.name} - ${p.size}">
            <div class="product-info">
                <div class="product-name">${p.name} - ${p.size}</div>
                <div class="product-price">Rate: ₹${p.price.toFixed(2)}</div>
            </div>
            <div class="quantity-stepper">
                <button class="quantity-btn minus-btn"><i class="fas fa-minus"></i></button>
                <input type="number" class="quantity-display" value="0" min="0" pattern="[0-9]*">
                <button class="quantity-btn plus-btn"><i class="fas fa-plus"></i></button>
            </div>
        </div>`;
        
    const getFavourites = () => {
        const history = getHistory();
        const usageCount = {};
        history.forEach(order => {
            order.items.forEach(item => {
                usageCount[item.id] = (usageCount[item.id] || 0) + 1;
            });
        });
        const sortedFavourites = Object.keys(usageCount).sort((a, b) => usageCount[b] - usageCount[a]);
        return sortedFavourites.slice(0, 5).map(id => allProducts.find(p => p.id === id)).filter(Boolean);
    };

    const displayProducts = () => {
        allProducts = getProducts();
        const favourites = getFavourites();
        const grouped = allProducts.reduce((acc, p) => {
            acc[p.category] = [...(acc[p.category] || []), p];
            return acc;
        }, {});

        let html = '';

        if (favourites.length > 0) {
            html += `
                <div class="category-header" data-category="Favourites">
                    <h2 class="category-title"><i class="fas fa-star" style="color: #f59e0b;"></i> My Favourites</h2>
                    <i class="fas fa-chevron-down category-toggle-icon"></i>
                </div>
                <div class="products-container" data-category-content="Favourites">
                    ${favourites.map(createProductCardHTML).join('')}
                </div>`;
        }
        
        html += Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0])).map(([category, items]) => `
            <div class="category-header" data-category="${category}">
                <h2 class="category-title">${category}</h2>
                <i class="fas fa-chevron-down category-toggle-icon"></i>
            </div>
            <div class="products-container" data-category-content="${category}">
                ${items.map(createProductCardHTML).join('')}
            </div>
        `).join('');

        elements.productListDiv.innerHTML = html || "<p>No products found. Add products in Settings.</p>";
    };
    
    // --- HISTORY FUNCTIONS ---
    const displayHistory = () => {
        const history = getHistory();
        const startDate = elements.startDateFilter.value ? new Date(elements.startDateFilter.value).setHours(0,0,0,0) : null;
        const endDate = elements.endDateFilter.value ? new Date(elements.endDateFilter.value).setHours(23,59,59,999) : null;
        
        const filteredHistory = history.filter(item => {
            const itemDate = new Date(item.date);
            if (startDate && itemDate < startDate) return false;
            if (endDate && itemDate > endDate) return false;
            return true;
        });
        
        elements.historyListDiv.innerHTML = filteredHistory.length === 0 ? '<p>No saved records found for the selected dates.</p>' : filteredHistory.map(item => `
            <div class="history-list-item">
                <input type="checkbox" class="history-checkbox" data-date="${item.date}">
                <div>
                    <span>${new Date(item.date).toLocaleDateString('en-GB')}</span>
                    <small style="display: block; opacity: 0.7;">${new Date(item.date).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}</small>
                </div>
                <strong>₹ ${item.total.toFixed(2)}</strong>
                <button class="view-order-btn" data-date="${item.date}">View</button>
            </div>`).join('');
    };

    const downloadHistoryCSV = () => {
        const history = getHistory();
        if (history.length === 0) {
            showToast("No history to download.");
            return;
        }

        const monthYear = prompt("Enter month and year to download (e.g., 3-2025 for March 2025):");
        if (!monthYear || !/^\d{1,2}-\d{4}$/.test(monthYear)) {
            showToast("Invalid format. Please use MM-YYYY.");
            return;
        }

        const [month, year] = monthYear.split('-').map(Number);
        const filtered = history.filter(order => {
            const d = new Date(order.date);
            return d.getMonth() + 1 === month && d.getFullYear() === year;
        });

        if (filtered.length === 0) {
            showToast(`No data found for ${month}-${year}.`);
            return;
        }

        let csvContent = "Date,Total Amount,Products\n";
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date
        
        filtered.forEach(order => {
            const date = new Date(order.date).toLocaleString('en-GB');
            const total = order.total.toFixed(2);
            const productsStr = order.items.map(item => {
                const product = allProducts.find(p => p.id === item.id);
                const name = product ? `${product.name} - ${product.size}` : 'Unknown Product';
                return `${item.quantity} x ${name}`;
            }).join('; ');
            csvContent += `"${date}",${total},"${productsStr}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `AmulCalc_History_${month}-${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("CSV downloaded!");
    };


    // --- SETTINGS FUNCTIONS ---
    const applyTheme = (theme) => {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        elements.themeIcon.className = `fas fa-${theme === 'dark' ? 'sun' : 'moon'}`;
    };

    const displayManageProducts = () => {
        const products = getProducts();
        elements.manageProductListDiv.innerHTML = products.map(p => `
            <div class="managed-product-item" data-id="${p.id}">
                <span>${p.name} - ${p.size} (₹${p.price})</span>
                <button class="delete-product-btn" data-id="${p.id}">&times;</button>
            </div>
        `).join('');
    };
    
    // --- EVENT HANDLERS ---
    elements.productListDiv.addEventListener('click', e => {
        const target = e.target;
        const card = target.closest('.product-card');

        if (target.closest('.quantity-btn')) {
            const quantityInput = card.querySelector('.quantity-display');
            let quantity = parseInt(quantityInput.value) || 0;
            if (target.closest('.plus-btn')) quantity++;
            else if (target.closest('.minus-btn') && quantity > 0) quantity--;
            quantityInput.value = quantity;
            if (elements.autoCalculateToggle.checked) calculateTotal();
        } else if (target.closest('.category-header')) {
            const header = target.closest('.category-header');
            const content = document.querySelector(`.products-container[data-category-content="${header.dataset.category}"]`);
            header.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        } else if (e.target.classList.contains('quantity-display')) {
             e.target.select();
        }
    });

    elements.productListDiv.addEventListener('input', e => {
         if(e.target.classList.contains('quantity-display') && elements.autoCalculateToggle.checked) {
            calculateTotal();
         }
    });

    elements.productListDiv.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.classList.contains('quantity-display')) {
            e.preventDefault();
            const allInputs = Array.from(document.querySelectorAll('.product-card:not([style*="display: none"]) .quantity-display'));
            const currentIndex = allInputs.indexOf(e.target);
            const nextInput = allInputs[currentIndex + 1];
            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            }
        }
    });

    elements.searchInput.addEventListener('input', () => {
        const searchTerm = elements.searchInput.value.toLowerCase();
        document.querySelectorAll('.product-card').forEach(card => {
            card.style.display = card.dataset.name.toLowerCase().includes(searchTerm) ? 'flex' : 'none';
        });
        calculateTotal(); // Recalculate as items are hidden/shown
    });
    
    elements.loadLastOrderBtn.addEventListener('click', () => {
        const history = getHistory();
        if (history.length === 0) return showToast("No saved orders!");
        
        const lastOrder = history[0];
        document.querySelectorAll('.product-card').forEach(card => {
            const item = lastOrder.items.find(i => i.id === card.dataset.id);
            card.querySelector('.quantity-display').value = item ? item.quantity : 0;
        });
        calculateTotal();
        showToast("Last order loaded!");
    });

    elements.historyBtn.addEventListener('click', () => {
         elements.startDateFilter.value = '';
         elements.endDateFilter.value = '';
         displayHistory();
         elements.historyModal.classList.add('visible');
    });

    elements.applyFilterBtn.addEventListener('click', displayHistory);

    elements.downloadCsvBtn.addEventListener('click', downloadHistoryCSV);
    
    elements.selectAllHistoryBtn.addEventListener('click', (e) => {
        const checkboxes = elements.historyListDiv.querySelectorAll('.history-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
        e.target.textContent = allChecked ? 'Select All' : 'Deselect All';
    });
    
    elements.deleteSelectedHistoryBtn.addEventListener('click', () => {
        const checkedBoxes = elements.historyListDiv.querySelectorAll('.history-checkbox:checked');
        if (checkedBoxes.length === 0) {
            showToast("No items selected to delete.");
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ${checkedBoxes.length} record(s)?`)) return;

        const datesToDelete = new Set(Array.from(checkedBoxes).map(cb => cb.dataset.date));
        let history = getHistory();
        history = history.filter(item => !datesToDelete.has(item.date));
        saveHistory(history);
        showToast(`${checkedBoxes.length} record(s) deleted.`);
        displayHistory();
    });

    elements.historyListDiv.addEventListener('click', e => {
        if(e.target.classList.contains('view-order-btn')) {
            const date = e.target.dataset.date;
            const order = getHistory().find(h => h.date === date);
            if (!order) return;
            
            elements.orderDetailsListDiv.innerHTML = order.items.map(item => {
                 const product = allProducts.find(p => p.id === item.id);
                 const name = product ? `${product.name} - ${product.size}` : 'Unknown Product';
                 const price = item.price; // Use saved price
                 const itemTotal = (item.quantity * price).toFixed(2);
                 return `<div class="order-detail-item">
                            <span>${item.quantity} x ${name} (@ ₹${price.toFixed(2)})</span> 
                            <span>₹${itemTotal}</span>
                        </div>`;
            }).join('') + `<div class="order-detail-item" style="font-weight: bold; margin-top: 1rem; border-top: 1px solid var(--history-border-color); padding-top: 0.5rem;">
                            <span>Total:</span>
                            <span>₹ ${order.total.toFixed(2)}</span>
                          </div>`;
            elements.orderDetailsModal.classList.add('visible');
        }
    });

    elements.saveBtn.addEventListener('click', () => {
        const totalValue = calculateTotal();
        if (totalValue <= 0) {
            return; // No toast for empty order
        };

        const items = Array.from(document.querySelectorAll('.product-card')).map(card => ({
            id: card.dataset.id,
            price: parseFloat(card.dataset.price), // Save the price at the time of sale
            quantity: parseInt(card.querySelector('.quantity-display').value) || 0
        })).filter(item => item.quantity > 0);

        if (items.length === 0) {
            return; // No toast for empty order
        }

        const history = getHistory();
        history.unshift({ date: new Date().toISOString(), total: totalValue, items });
        saveHistory(history);
        showToast("Order saved successfully!");
        displayProducts(); // Refresh to update Favourites
    });

    elements.resetBtn.addEventListener('click', () => {
        const totalValue = calculateTotal();
        if (totalValue <= 0) return; // Don't show toast if already reset
        document.querySelectorAll('.quantity-display').forEach(input => input.value = '0');
        calculateTotal();
        showToast("Reset successfully!");
    });
    
    // Settings Event Handlers
    elements.settingsBtn.addEventListener('click', () => {
        displayManageProducts();
        elements.settingsModal.classList.add('visible');
    });

    elements.themeToggleBtn.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        saveTheme(newTheme);
        applyTheme(newTheme);
    });

    elements.addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const products = getProducts();
        const newProduct = {
            id: `custom_${new Date().getTime()}`,
            name: document.getElementById('product-name').value,
            size: document.getElementById('product-size').value,
            price: parseFloat(document.getElementById('product-price').value),
            category: document.getElementById('product-category').value,
        };
        products.push(newProduct);
        saveProducts(products);
        displayProducts();
        displayManageProducts();
        elements.addProductForm.reset();
        showToast("Product added!");
    });

    elements.manageProductListDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-product-btn')) {
            const productId = e.target.dataset.id;
            if (confirm("Are you sure you want to delete this product?")) {
                let products = getProducts();
                products = products.filter(p => p.id !== productId);
                saveProducts(products);
                displayProducts();
                displayManageProducts();
                showToast("Product deleted!");
            }
        }
    });


    // --- TOGGLES & MODAL CLOSERS ---
    elements.autoCalculateToggle.addEventListener('change', () => {
        elements.calculateBtn.classList.toggle('hidden', elements.autoCalculateToggle.checked);
        if(elements.autoCalculateToggle.checked) calculateTotal();
    });
    elements.calculateBtn.addEventListener('click', calculateTotal);
    elements.closeHistoryBtn.addEventListener('click', () => elements.historyModal.classList.remove('visible'));
    elements.closeOrderDetailsBtn.addEventListener('click', () => elements.orderDetailsModal.classList.remove('visible'));
    elements.closeSettingsBtn.addEventListener('click', () => elements.settingsModal.classList.remove('visible'));
    
    // --- INITIALIZATION ---
    const initializeApp = async () => {
        applyTheme(getTheme());
        let currentProducts = getProducts();
        if (currentProducts.length === 0) {
            try {
                // First time load: fetch from JSON and save to localStorage
                const response = await fetch('products.json');
                const defaultProducts = await response.json();
                saveProducts(defaultProducts);
            } catch (error) {
                console.error("Failed to load initial products:", error);
            }
        }
        displayProducts();
        elements.calculateBtn.classList.toggle('hidden', elements.autoCalculateToggle.checked);
    };

    initializeApp();
});
