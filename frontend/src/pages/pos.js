import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get, post } from '../lib/api.js';
import { notifySuccess, notifyError, notifyWarning } from '../lib/notify.js';

registerRoute('/pos', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  try {
    const data = await get('/pos');
    const menus = data?.menus || [];
    const customers = data?.customers || [];

    const categories = [...new Set(menus.map(m => m.category).filter(Boolean))];

    const html = `
<style>
.pos-container { display: flex; gap: 20px; }
.pos-menu-panel { flex: 1; min-width: 0; }
.pos-cart-panel { width: 380px; flex-shrink: 0; }
.pos-search { margin-bottom: 15px; }
.pos-search input { width: 100%; padding: 10px 14px; border: 2px solid #dee2e6; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s; }
.pos-search input:focus { border-color: #ff9f43; }
.category-section { margin-bottom: 20px; }
.category-title { font-size: 16px; font-weight: 700; color: #333; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #ff9f43; display: inline-block; }
.menu-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.menu-card { background: #fff; border: 2px solid #dee2e6; border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.2s; text-align: center; user-select: none; }
.menu-card:hover { border-color: #ff9f43; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255,159,67,0.15); }
.menu-card:active { transform: scale(0.97); }
.menu-card .item-name { font-weight: 600; font-size: 14px; color: #333; margin-bottom: 4px; }
.menu-card .item-category { font-size: 11px; color: #999; margin-bottom: 4px; }
.menu-card .item-price { font-weight: 700; color: #ff9f43; font-size: 16px; }
.cart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.cart-header h5 { margin: 0; font-weight: 700; }
.cart-header a { color: #dc3545; cursor: pointer; font-size: 13px; text-decoration: none; }
.order-type-group { display: flex; gap: 8px; margin-bottom: 15px; }
.ordermethod { flex: 1; padding: 8px 0; border: 2px solid #dee2e6; border-radius: 6px; cursor: pointer; text-align: center; font-size: 13px; font-weight: 500; color: #333; transition: all 0.2s; background: #fff; }
.ordermethod:hover { border-color: #ff9f43; color: #ff9f43; }
.ordermethod.selected { background: #ff9f43; color: #fff; border-color: #ff9f43; }
.cart-table { width: 100%; font-size: 13px; }
.cart-table th { background: #f8f9fa; padding: 8px 6px; text-align: left; font-weight: 600; border-bottom: 2px solid #dee2e6; }
.cart-table td { padding: 8px 6px; border-bottom: 1px solid #eee; vertical-align: middle; }
.cart-table .qty-control { display: inline-flex; align-items: center; gap: 2px; }
.cart-table .qty-control button { width: 24px; height: 24px; border: 1px solid #dee2e6; border-radius: 4px; background: #fff; cursor: pointer; font-weight: 700; font-size: 14px; line-height: 1; display: flex; align-items: center; justify-content: center; padding: 0; color: #333; transition: all 0.15s; }
.cart-table .qty-control button:hover { background: #ff9f43; color: #fff; border-color: #ff9f43; }
.cart-table .qty-control .qty-value { width: 28px; text-align: center; font-weight: 600; font-size: 13px; border: none; background: transparent; }
.cart-table .remove-item { color: #dc3545; cursor: pointer; font-size: 16px; opacity: 0.6; transition: opacity 0.2s; }
.cart-table .remove-item:hover { opacity: 1; }
.cart-summary { margin-top: 12px; padding-top: 12px; border-top: 2px solid #dee2e6; }
.cart-summary ul { list-style: none; padding: 0; margin: 0; }
.cart-summary ul li { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
.cart-summary ul li.total-value { font-weight: 700; font-size: 16px; border-top: 2px solid #333; margin-top: 4px; padding-top: 8px; color: #ff9f43; }
#order-comment { width: 100%; padding: 8px 10px; border: 2px solid #dee2e6; border-radius: 6px; resize: vertical; font-size: 13px; margin-top: 10px; }
#order-comment:focus { border-color: #ff9f43; outline: none; }
.checkout-row { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
#checkout-button { background: #ff9f43; color: #fff; border: none; border-radius: 8px; padding: 10px 24px; font-weight: 700; font-size: 15px; cursor: pointer; transition: background 0.2s; flex: 1; }
#checkout-button:hover { background: #e8892e; }
#checkout-total { font-weight: 700; font-size: 18px; color: #ff9f43; margin-left: 12px; white-space: nowrap; }
.customer-row { display: flex; gap: 8px; margin-bottom: 12px; }
.customer-row select { flex: 1; padding: 8px 10px; border: 2px solid #dee2e6; border-radius: 6px; font-size: 13px; background: #fff; }
.customer-row select:focus { border-color: #ff9f43; outline: none; }
.customer-row .btn-add-customer { padding: 8px 14px; background: #28a745; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; white-space: nowrap; transition: background 0.2s; }
.customer-row .btn-add-customer:hover { background: #218838; }
.modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center; }
.modal-overlay.open { display: flex; }
.modal-box { background: #fff; border-radius: 12px; width: 480px; max-width: 90%; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.modal-box h4 { margin: 0 0 16px; font-weight: 700; }
.modal-box .form-group { margin-bottom: 14px; }
.modal-box .form-group label { display: block; font-weight: 600; font-size: 13px; margin-bottom: 4px; color: #555; }
.modal-box .form-group input { width: 100%; padding: 8px 12px; border: 2px solid #dee2e6; border-radius: 6px; font-size: 14px; }
.modal-box .form-group input:focus { border-color: #ff9f43; outline: none; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px; }
.modal-actions .btn-submit { background: #ff9f43; color: #fff; border: none; border-radius: 6px; padding: 8px 20px; font-weight: 600; cursor: pointer; }
.modal-actions .btn-submit:hover { background: #e8892e; }
.modal-actions .btn-cancel { background: #6c757d; color: #fff; border: none; border-radius: 6px; padding: 8px 20px; font-weight: 600; cursor: pointer; }
.modal-actions .btn-cancel:hover { background: #5a6268; }
.no-items-msg { text-align: center; color: #999; padding: 30px 0; font-size: 14px; }
</style>

<div class="pos-container">
  <div class="pos-menu-panel">
    <div class="card">
      <div class="card-body">
        <div class="pos-search">
          <input type="text" id="menu-search" placeholder="Search menu items..." autocomplete="off">
        </div>
        <div id="menu-items-container">
          ${categories.map(cat => {
            const items = menus.filter(m => m.category === cat);
            return `
            <div class="category-section" data-category="${cat}">
              <div class="category-title">${cat}</div>
              <div class="menu-card-grid">
                ${items.map(m => `
                  <div class="menu-card" data-id="${m._id}" data-item="${m.item}" data-price="${m.price}" data-category="${m.category}">
                    <div class="item-name">${m.item}</div>
                    <div class="item-category">${m.subCategory || ''}</div>
                    <div class="item-price">$${Number(m.price).toFixed(2)}</div>
                  </div>
                `).join('')}
              </div>
            </div>`;
          }).join('')}
          ${menus.filter(m => !m.category).length ? `
            <div class="category-section" data-category="Uncategorized">
              <div class="category-title">Uncategorized</div>
              <div class="menu-card-grid">
                ${menus.filter(m => !m.category).map(m => `
                  <div class="menu-card" data-id="${m._id}" data-item="${m.item}" data-price="${m.price}" data-category="">
                    <div class="item-name">${m.item}</div>
                    <div class="item-category"></div>
                    <div class="item-price">$${Number(m.price).toFixed(2)}</div>
                  </div>
                `).join('')}
              </div>
            </div>` : ''}
        </div>
      </div>
    </div>
  </div>

  <div class="pos-cart-panel">
    <div class="card">
      <div class="card-body">
        <div class="customer-row">
          <select id="customer-select">
            <option value="">Walk-in Customer</option>
            ${customers.map(c => `<option value="${c._id}">${c.name}${c.phone ? ' - ' + c.phone : ''}</option>`).join('')}
          </select>
          <button class="btn-add-customer" id="btn-add-customer">+ Add</button>
        </div>

        <div class="order-type-group">
          <button class="ordermethod" data-type="dine in">Dine In</button>
          <button class="ordermethod" data-type="take away">Take Away</button>
          <button class="ordermethod" data-type="online">Online</button>
        </div>

        <div class="cart-header">
          <h5>Order Items</h5>
          <a id="clear-all">Clear all</a>
        </div>

        <table class="cart-table">
          <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th></th></tr></thead>
          <tbody id="cart-body">
            <tr><td colspan="4" class="no-items-msg">No items in cart</td></tr>
          </tbody>
        </table>

        <div class="cart-summary">
          <ul>
            <li><span>Subtotal</span><span id="subtotal">0.00</span></li>
            <li><span>Tax (10%)</span><span id="tax">0.00</span></li>
            <li class="total-value"><span>Total</span><span id="total">0.00</span></li>
          </ul>
        </div>

        <textarea id="order-comment" rows="3" placeholder="Enter comment / Address..."></textarea>

        <div class="checkout-row">
          <button id="checkout-button">Place Order</button>
          <span id="checkout-total">0.00</span>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="modal-overlay" id="customer-modal">
  <div class="modal-box">
    <h4>Add Customer</h4>
    <div class="form-group">
      <label>Customer Name</label>
      <input type="text" id="customerName" placeholder="Enter name">
    </div>
    <div class="form-group">
      <label>Phone</label>
      <input type="tel" id="customerPhone" pattern="[0-9+ -]*" placeholder="Enter phone">
    </div>
    <div class="form-group">
      <label>Address</label>
      <input type="text" id="customerAddress" placeholder="Enter address">
    </div>
    <div class="modal-actions">
      <button class="btn-cancel" id="modal-cancel">Cancel</button>
      <button class="btn-submit" id="modal-submit">Submit</button>
    </div>
  </div>
</div>
    `;

    renderLayout(app, 'pos', html);

    const container = app.querySelector('.pos-container');
    if (!container) return;

    const cart = {};
    let selectedOrderType = '';

    const cartBody = document.getElementById('cart-body');
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    const checkoutTotalEl = document.getElementById('checkout-total');
    const totalItemsEl = document.getElementById('total-items');
    const checkoutButton = document.getElementById('checkout-button');
    const customerSelect = document.getElementById('customer-select');
    const orderComment = document.getElementById('order-comment');
    const clearAll = document.getElementById('clear-all');
    const searchInput = document.getElementById('menu-search');
    const orderTypeBtns = document.querySelectorAll('.ordermethod');
    const menuCards = document.querySelectorAll('.menu-card');

    function updateCartDisplay() {
      const entries = Object.entries(cart);
      if (entries.length === 0) {
        cartBody.innerHTML = '<tr><td colspan="4" class="no-items-msg">No items in cart</td></tr>';
        subtotalEl.textContent = '0.00';
        taxEl.textContent = '0.00';
        totalEl.textContent = '0.00';
        checkoutTotalEl.textContent = '0.00';
        return;
      }

      let subtotal = 0;
      let rowsHtml = '';
      entries.forEach(([id, item]) => {
        const lineTotal = item.quantity * item.price;
        subtotal += lineTotal;
        rowsHtml += `
<tr data-id="${id}">
  <td>${item.name}</td>
  <td>
    <div class="qty-control">
      <button class="qty-dec" data-id="${id}">−</button>
      <span class="qty-value">${item.quantity}</span>
      <button class="qty-inc" data-id="${id}">+</button>
    </div>
  </td>
  <td>$${lineTotal.toFixed(2)}</td>
  <td><span class="remove-item" data-id="${id}">×</span></td>
</tr>`;
      });

      cartBody.innerHTML = rowsHtml;
      const tax = subtotal * 0.1;
      const total = subtotal + tax;
      subtotalEl.textContent = subtotal.toFixed(2);
      taxEl.textContent = tax.toFixed(2);
      totalEl.textContent = total.toFixed(2);
      checkoutTotalEl.textContent = total.toFixed(2);

      cartBody.querySelectorAll('.qty-inc').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          if (cart[id]) {
            cart[id].quantity++;
            updateCartDisplay();
          }
        });
      });

      cartBody.querySelectorAll('.qty-dec').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          if (cart[id]) {
            if (cart[id].quantity > 1) {
              cart[id].quantity--;
            } else {
              delete cart[id];
            }
            updateCartDisplay();
          }
        });
      });

      cartBody.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          delete cart[id];
          updateCartDisplay();
        });
      });
    }

    menuCards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const name = card.dataset.item;
        const price = parseFloat(card.dataset.price);
        if (cart[id]) {
          cart[id].quantity++;
        } else {
          cart[id] = { name, price, quantity: 1 };
        }
        updateCartDisplay();
      });
    });

    clearAll.addEventListener('click', () => {
      Object.keys(cart).forEach(k => delete cart[k]);
      updateCartDisplay();
    });

    orderTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        orderTypeBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedOrderType = btn.dataset.type;
      });
    });

    checkoutButton.addEventListener('click', async () => {
      if (!selectedOrderType) {
        notifyWarning('Please select an order type (Dine In, Take Away, or Online).');
        return;
      }
      const entries = Object.entries(cart);
      if (entries.length === 0) {
        notifyWarning('Please add at least one item to the order.');
        return;
      }

      const orderData = entries.map(([id, item]) => ({
        menuItem: id,
        quantity: item.quantity
      }));

      const payload = {
        items: orderData,
        orderType: selectedOrderType,
        comment: orderComment.value
      };
      if (customerSelect.value) payload.customerId = customerSelect.value;

      try {
        const result = await post('/placeorder', payload);
        notifySuccess('Order placed successfully!');
        Object.keys(cart).forEach(k => delete cart[k]);
        orderComment.value = '';
        customerSelect.value = '';
        selectedOrderType = '';
        orderTypeBtns.forEach(b => b.classList.remove('selected'));
        updateCartDisplay();
      } catch (err) {
        notifyError('Failed to place order: ' + err.message);
      }
    });

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      document.querySelectorAll('.category-section').forEach(section => {
        let hasVisible = false;
        section.querySelectorAll('.menu-card').forEach(card => {
          const name = card.dataset.item.toLowerCase();
          const cat = (card.dataset.category || '').toLowerCase();
          const match = !q || name.includes(q) || cat.includes(q);
          card.style.display = match ? '' : 'none';
          if (match) hasVisible = true;
        });
        section.style.display = hasVisible ? '' : 'none';
      });
    });

    document.getElementById('btn-add-customer').addEventListener('click', () => {
      document.getElementById('customer-modal').classList.add('open');
    });

    document.getElementById('modal-cancel').addEventListener('click', () => {
      document.getElementById('customer-modal').classList.remove('open');
    });

    document.getElementById('customer-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        e.target.classList.remove('open');
      }
    });

    document.getElementById('modal-submit').addEventListener('click', async () => {
      const name = document.getElementById('customerName').value.trim();
      if (!name) {
        notifyWarning('Customer name is required.');
        return;
      }
      const phone = document.getElementById('customerPhone').value.trim();
      if (phone && !/^[0-9+\-\s]+$/.test(phone)) {
        notifyWarning('Phone number can only contain digits.');
        return;
      }
      const address = document.getElementById('customerAddress').value.trim();

      try {
        const customer = await post('/customers', { name, phone, address });
        notifySuccess('Customer "' + customer.name + '" created successfully!');
        const opt = document.createElement('option');
        opt.value = customer._id;
        opt.textContent = customer.name + (customer.phone ? ' - ' + customer.phone : '');
        customerSelect.appendChild(opt);
        customerSelect.value = customer._id;
        document.getElementById('customer-modal').classList.remove('open');
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';
        document.getElementById('customerAddress').value = '';
      } catch (err) {
        notifyError('Failed to create customer: ' + err.message);
      }
    });
  } catch (err) {
    app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load POS: ${err.message}</p></div></div>`;
  }
});
