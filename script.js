document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const elements = {
        productListDiv: document.getElementById('product-list'),
        autoCalculateToggle: document.getElementById('auto-calculate'),
        calculateBtn: document.getElementById('calculate-btn'),
        saveBtn: document.getElementById('save-btn'),
        resetBtn: document.getElementById('reset-btn'),
        totalAmountSpan: document.getElementById('total-amount'),
        historyModal: document.getElementById('history-modal'),
        closeHistoryBtn: document.getElementById('close-history'),
        historyListDiv: document.getElementById('history-list'),
        orderDetailsModal: document.getElementById('order-details-modal'),
        closeOrderDetailsBtn: document.getElementById('close-order-details'),
        orderDetailsListDiv: document.getElementById('order-details-list'),
        toast: document.getElementById('toast'),
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        themeIcon: document.getElementById('theme-toggle-btn').querySelector('i'),
        searchInput: document.getElementById('search-input'),
        loadLastOrderBtn: document.getElementById('load-last-order-btn'),
        historyBtn: document.getElementById('history-btn'),
    };

    let allProducts = [];

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
        const history = JSON.parse(localStorage.getItem('amulCalcHistory')) || [];
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
        
        html += Object.entries(grouped).map(([category, items]) => `
            <div class="category-header" data-category="${category}">
                <h2 class="category-title">${category}</h2>
                <i class="fas fa-chevron-down category-toggle-icon"></i>
            </div>
            <div class="products-container" data-category-content="${category}">
                ${items.map(createProductCardHTML).join('')}
            </div>
        `).join('');

        elements.productListDiv.innerHTML = html;
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
        }
    });
    
    elements.productListDiv.addEventListener('dblclick', e => {
        const card = e.target.closest('.product-card');
        if(card) {
            const quantityInput = card.querySelector('.quantity-display');
            quantityInput.focus();
            quantityInput.select();
        }
    });

    elements.productListDiv.addEventListener('input', e => {
         if(e.target.classList.contains('quantity-display') && elements.autoCalculateToggle.checked) {
            calculateTotal();
         }
    });

    elements.searchInput.addEventListener('input', () => {
        const searchTerm = elements.searchInput.value.toLowerCase();
        document.querySelectorAll('.product-card').forEach(card => {
            card.style.display = card.dataset.name.toLowerCase().includes(searchTerm) ? 'flex' : 'none';
        });
    });
    
    elements.loadLastOrderBtn.addEventListener('click', () => {
        const history = JSON.parse(localStorage.getItem('amulCalcHistory')) || [];
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
         const history = JSON.parse(localStorage.getItem('amulCalcHistory')) || [];
         elements.historyListDiv.innerHTML = history.length === 0 ? '<p>No saved records.</p>' : history.map((item, index) => `
            <div class="history-list-item">
                <div>
                    <span>${new Date(item.date).toLocaleDateString('en-GB')}</span>
                    <small style="display: block; opacity: 0.7;">${new Date(item.date).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}</small>
                </div>
                <strong>₹ ${item.total.toFixed(2)}</strong>
                <button class="view-order-btn" data-history-index="${index}">View Order</button>
            </div>`).join('');
         elements.historyModal.classList.add('visible');
    });

    elements.historyListDiv.addEventListener('click', e => {
        if(e.target.classList.contains('view-order-btn')) {
            const index = e.target.dataset.historyIndex;
            const history = JSON.parse(localStorage.getItem('amulCalcHistory')) || [];
            const order = history[index];
            if (!order) return;
            
            elements.orderDetailsListDiv.innerHTML = order.items.map(item => {
                 const product = allProducts.find(p => p.id === item.id);
                 return `<div class="order-detail-item">
                            <span>${product ? product.name : 'Unknown'}:</span> 
                            <span>${item.quantity}</span>
                        </div>`;
            }).join('') + `<div class="order-detail-item" style="font-weight: bold; margin-top: 1rem; border-top: 1px solid var(--history-border-color); padding-top: 0.5rem;">
                            <span>Total:</span>
                            <span>₹ ${order.total.toFixed(2)}</span>
                          </div>`;
            elements.orderDetailsModal.classList.add('visible');
        }
    });

    const applyTheme = (theme) => {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        elements.themeIcon.className = `fas fa-${theme === 'dark' ? 'sun' : 'moon'}`;
    };

    elements.themeToggleBtn.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    elements.saveBtn.addEventListener('click', () => {
        calculateTotal();
        const totalValue = parseFloat(elements.totalAmountSpan.textContent.replace('₹ ', ''));
        if (totalValue <= 0) {
            showToast("Cannot save empty order!");
            return;
        };

        const items = Array.from(document.querySelectorAll('.product-card')).map(card => ({
            id: card.dataset.id,
            quantity: parseInt(card.querySelector('.quantity-display').value) || 0
        })).filter(item => item.quantity > 0);

        if (items.length === 0) {
            showToast("Cannot save empty order!");
            return;
        }

        const history = JSON.parse(localStorage.getItem('amulCalcHistory')) || [];
        history.unshift({ date: new Date().toISOString(), total: totalValue, items });
        if(history.length > 20) history.pop(); // Keep last 20 records
        localStorage.setItem('amulCalcHistory', JSON.stringify(history));
        showToast("Order saved successfully!");
        displayProducts(); // Refresh to update Favourites
    });

    elements.autoCalculateToggle.addEventListener('change', () => {
        elements.calculateBtn.classList.toggle('hidden', elements.autoCalculateToggle.checked);
        if(elements.autoCalculateToggle.checked) calculateTotal();
    });

    elements.calculateBtn.addEventListener('click', calculateTotal);

    elements.resetBtn.addEventListener('click', () => {
        document.querySelectorAll('.quantity-display').forEach(input => input.value = '0');
        calculateTotal();
        showToast("Reset successfully!");
    });

    elements.closeHistoryBtn.addEventListener('click', () => elements.historyModal.classList.remove('visible'));
    elements.closeOrderDetailsBtn.addEventListener('click', () => elements.orderDetailsModal.classList.remove('visible'));
    
    const initializeApp = async () => {
        applyTheme(localStorage.getItem('theme') || 'dark');
        try {
            const response = await fetch('products.json');
            allProducts = await response.json();
            displayProducts();
        } catch (error) {
            console.error("Failed to load products:", error);
            elements.productListDiv.innerHTML = "<p>Could not load products. Please check the network or file.</p>";
        }
        elements.calculateBtn.classList.toggle('hidden', elements.autoCalculateToggle.checked);
    };

    initializeApp();
});
