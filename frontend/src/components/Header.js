export function renderLayout(app, activePage, contentHtml) {
  const sidebarItems = [
    { href: '#/dashboard', icon: 'dashboard.svg', label: 'nav.dashboard', children: null },
    { icon: 'product.svg', label: 'nav.food', children: [
      { href: '#/pos', label: 'nav.billing' },
      { href: '#/menu-add', label: 'nav.add_item' },
      { href: '#/menu-list', label: 'nav.list_items' }
    ]},
    { icon: 'time.svg', label: 'nav.report', children: [
      { href: '#/reports-sales', label: 'nav.orders_report' },
      { href: '#/reports-dates', label: 'nav.orders_by_date' },
      { href: '#/orders-list', label: 'nav.orders_list' }
    ]},
    { icon: 'sales1.svg', label: 'nav.suppliers_inventory', children: [
      { href: '#/inventory-add', label: 'nav.add_inventory' },
      { href: '#/inventory-list', label: 'nav.inventory_list' },
      { href: '#/suppliers-list', label: 'nav.supplier_list' }
    ]},
    { icon: 'expense1.svg', label: 'nav.expense', children: [
      { href: '#/expenses-add', label: 'nav.add_expense' },
      { href: '#/expenses-list', label: 'nav.expense_list' }
    ]},
    { icon: 'users1.svg', label: 'nav.customers', children: [
      { href: '#/customers-list', label: 'nav.customer_list' }
    ]},
    { icon: 'purchase1.svg', label: 'nav.purchase', children: [
      { href: '#/purchases-list', label: 'nav.purchase_list' },
      { href: '#/purchases-add', label: 'nav.add_purchase' }
    ]},
    { icon: 'places.svg', label: 'nav.branches', children: [
      { href: '#/branches-list', label: 'nav.branches_list' },
      { href: '#/branches-add', label: 'nav.add_branch' }
    ]},
    { href: '#/profile', icon: 'users1.svg', label: 'nav.my_profile', children: null },
    { href: '#/settings', icon: 'settings.svg', label: 'nav.settings', children: null },
    { href: '#/audit-log', icon: 'time.svg', label: 'nav.audit_log', children: null }
  ];

  const targetHash = '#/' + activePage;

  function isActive(item) {
    if (item.href === targetHash) return true;
    if (item.children) {
      return item.children.some(c => c.href === targetHash);
    }
    return false;
  }

  function renderSidebarItems(items) {
    return items.map(item => {
      const active = isActive(item);
      const hasChildren = item.children && item.children.length > 0;
      const liActive = active ? ' class="active"' : '';
      const submenuOpen = hasChildren ? ' class="submenu' + (active ? ' active' : '') + '"' : '';

      if (!hasChildren) {
        return `<li${liActive}>
          <a href="${item.href}"><img src="assets/img/icons/${item.icon}" alt="img"><span data-i18n="${item.label}">${item.label}</span></a>
        </li>`;
      }

      const childrenHtml = item.children.map(child => {
        const childActive = child.href === targetHash ? ' class="active"' : '';
        return `<li${childActive}><a href="${child.href}"><span data-i18n="${child.label}">${child.label}</span></a></li>`;
      }).join('');

      const ulStyle = active ? '' : ' style="display:none"';

      return `<li${submenuOpen}>
        <a href="#"><img src="assets/img/icons/${item.icon}" alt="img"><span data-i18n="${item.label}">${item.label}</span> <span class="menu-arrow"></span></a>
        <ul${ulStyle}>${childrenHtml}</ul>
      </li>`;
    }).join('');
  }

  app.innerHTML = `
<script>(function(){var t=localStorage.getItem('rms-theme')||'light';if(t==='dark')document.body.classList.add('dark-mode')})();</script>
<div id="global-loader">
  <div class="whirly-loader"></div>
</div>
<div class="main-wrapper">
  <div class="header">
    <div class="header-left active">
      <a href="#/dashboard" class="logo">
        <img src="assets/img/icons/LAZIZZ.svg" alt="">
      </a>
      <a href="#/dashboard" class="logo-small">
        <img src="assets/img/logo-small.png" alt="">
      </a>
      <a id="toggle_btn" href="javascript:void(0);"></a>
    </div>
    <a id="mobile_btn" class="mobile_btn" href="#sidebar">
      <span class="bar-icon">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </a>
    <ul class="nav user-menu">
      <li class="nav-item">
        <div class="top-nav-search">
          <a href="javascript:void(0);" class="responsive-search">
            <i class="fa fa-search"></i>
          </a>
          <form id="searchForm">
            <div class="searchinputs">
              <input type="text" id="searchInput" data-i18n-placeholder="header.search" placeholder="Search pages...">
              <div class="search-addon">
                <span><img src="assets/img/icons/closes.svg" alt="img"></span>
              </div>
            </div>
            <button type="submit" class="btn" id="searchdiv"><img src="assets/img/icons/search.svg" alt="img"></button>
          </form>
        </div>
      </li>
      <li class="nav-item dropdown has-arrow flag-nav">
        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="javascript:void(0);" role="button">
          <img src="assets/img/flags/us.png" alt="" height="20" id="lang-flag">
        </a>
        <div class="dropdown-menu dropdown-menu-right">
          <a href="javascript:void(0);" class="dropdown-item" data-lang="en">
            <img src="assets/img/flags/us.png" alt="" height="16"> <span data-i18n="lang.en">English</span>
          </a>
          <a href="javascript:void(0);" class="dropdown-item" data-lang="es">
            <img src="assets/img/flags/es.png" alt="" height="16"> <span data-i18n="lang.es">Spanish</span>
          </a>
        </div>
      </li>
      <li class="nav-item dropdown">
        <a href="javascript:void(0);" class="dropdown-toggle nav-link" data-bs-toggle="dropdown">
          <img src="assets/img/icons/notification-bing.svg" alt="img"> <span class="badge rounded-pill">4</span>
        </a>
        <div class="dropdown-menu notifications">
          <div class="topnav-dropdown-header">
            <span class="notification-title">Notifications</span>
            <a href="javascript:void(0)" class="clear-noti"> Clear All </a>
          </div>
          <div class="noti-content">
            <ul class="notification-list">
              <li class="notification-message">
                <a href="javascript:void(0);">
                  <div class="media d-flex">
                    <span class="avatar flex-shrink-0">
                      <img alt="" src="assets/img/profiles/avatar-02.jpg">
                    </span>
                    <div class="media-body flex-grow-1">
                      <p class="noti-details"><span class="noti-title">John Doe</span> added new task</p>
                      <p class="noti-time"><span class="notification-time">4 mins ago</span></p>
                    </div>
                  </div>
                </a>
              </li>
              <li class="notification-message">
                <a href="javascript:void(0);">
                  <div class="media d-flex">
                    <span class="avatar flex-shrink-0">
                      <img alt="" src="assets/img/profiles/avatar-03.jpg">
                    </span>
                    <div class="media-body flex-grow-1">
                      <p class="noti-details"><span class="noti-title">Tarah Shropshire</span> changed a task</p>
                      <p class="noti-time"><span class="notification-time">6 mins ago</span></p>
                    </div>
                  </div>
                </a>
              </li>
            </ul>
          </div>
          <div class="topnav-dropdown-footer">
            <a href="javascript:void(0);">View all Notifications</a>
          </div>
        </div>
      </li>
      <li class="nav-item dropdown has-arrow main-drop">
        <a href="javascript:void(0);" class="dropdown-toggle nav-link userset" data-bs-toggle="dropdown">
          <span class="user-img"><img id="header-avatar" src="assets/img/profiles/avator1.jpg" alt="" onerror="this.src='assets/img/profiles/avator1.jpg'" style="object-fit:cover;width:34px;height:34px;border-radius:50%;">
          <span class="status online"></span></span>
        </a>
        <div class="dropdown-menu menu-drop-user">
          <div class="profilename">
            <div class="profileset">
              <span class="user-img"><img id="header-avatar-dropdown" src="assets/img/profiles/avator1.jpg" alt="" onerror="this.src='assets/img/profiles/avator1.jpg'" style="object-fit:cover;width:46px;height:46px;border-radius:50%;">
              <span class="status online"></span></span>
              <div class="profilesets">
                <h6 id="owner-name">Owner</h6>
                <h5 id="restaurant-name">Admin</h5>
              </div>
            </div>
            <hr class="m-0">
            <a class="dropdown-item" href="#/profile"> <i class="me-2" data-feather="user"></i> <span data-i18n="nav.my_profile">My Profile</span></a>
            <a class="dropdown-item" href="#/settings"><i class="me-2" data-feather="settings"></i><span data-i18n="nav.settings">Settings</span></a>
            <hr class="m-0">
            <a class="dropdown-item logout pb-0" href="#" id="logout-btn">
              <img src="assets/img/icons/log-out.svg" class="me-2" alt="img"><span data-i18n="nav.logout">Logout</span>
            </a>
          </div>
        </div>
      </li>
    </ul>
    <div class="dropdown mobile-user-menu">
      <a href="javascript:void(0);" class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false"><i class="fa fa-ellipsis-v"></i></a>
      <div class="dropdown-menu dropdown-menu-right">
        <a class="dropdown-item" href="#/profile">My Profile</a>
        <a class="dropdown-item" href="#/settings">Settings</a>
        <a class="dropdown-item" href="#" id="logout-btn-mobile">Logout</a>
      </div>
    </div>
  </div>
  <div class="sidebar" id="sidebar">
    <div class="sidebar-inner slimscroll">
      <div id="sidebar-menu" class="sidebar-menu">
        <ul>
          ${renderSidebarItems(sidebarItems)}
        </ul>
      </div>
    </div>
  </div>
  <div class="page-wrapper">
    <div class="content container-fluid" id="main-content">
      ${contentHtml}
    </div>
  </div>
</div>
<script src="assets/js/jquery-3.6.0.min.js"></script>
<script src="assets/js/bootstrap.bundle.min.js"></script>
<script src="assets/js/jquery.dataTables.min.js"></script>
<script src="assets/js/dataTables.bootstrap4.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="assets/plugins/apexchart/apexcharts.min.js"></script>
<script src="assets/js/feather.min.js"></script>
<script src="assets/js/jquery.slimscroll.min.js"></script>
<script src="assets/js/i18n.js"></script>
<script src="assets/js/script.js"></script>
  `;

  // Fetch user profile
  fetch('/api/profile', {
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data && data.success) {
        const ownerNameEl = app.querySelector('#owner-name');
        const restaurantNameEl = app.querySelector('#restaurant-name');
        const avatarImgs = app.querySelectorAll('#header-avatar, #header-avatar-dropdown');
        if (ownerNameEl) ownerNameEl.textContent = data.ownerName || data.usuario?.username || 'Owner';
        if (restaurantNameEl) restaurantNameEl.textContent = data.restaurantName || 'Admin';
        if (data.avatar) {
          avatarImgs.forEach(img => { img.src = data.avatar; });
        }
      }
    })
    .catch(() => {});

  // Apply i18n and feather icons
  if (typeof applyTranslations === 'function') applyTranslations();
  if (typeof feather !== 'undefined' && feather.replace) feather.replace();

  // Set active class on sidebar link
  const sidebarLinks = app.querySelectorAll('#sidebar-menu a');
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === targetHash) {
      const li = link.closest('li');
      if (li) {
        li.classList.add('active');
        const parentSub = li.closest('.submenu');
        if (parentSub) {
          parentSub.classList.add('active');
          const childUl = parentSub.querySelector('ul');
          if (childUl) childUl.style.display = 'block';
        }
      }
    }
  });

  // Language selector
  const langItems = app.querySelectorAll('[data-lang]');
  langItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const lang = this.getAttribute('data-lang');
      if (typeof setLanguage === 'function') setLanguage(lang);
    });
  });

  // Dark mode toggle
  const darkModeToggle = app.querySelector('#notification_switch3');
  if (darkModeToggle) {
    const savedTheme = localStorage.getItem('rms-theme') || 'light';
    darkModeToggle.checked = savedTheme === 'dark';
    darkModeToggle.addEventListener('change', function() {
      const theme = this.checked ? 'dark' : 'light';
      document.body.classList.toggle('dark-mode', this.checked);
      localStorage.setItem('rms-theme', theme);
    });
  }

  // Logout
  const logoutBtns = app.querySelectorAll('#logout-btn, #logout-btn-mobile');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const token = localStorage.getItem('token');
      fetch('/api/log-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            localStorage.removeItem('token');
            window.location.hash = '#/signin';
          } else {
            alert('Logout failed: ' + data.message);
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          window.location.hash = '#/signin';
        });
    });
  });

  // Search form
  const searchForm = app.querySelector('#searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const q = app.querySelector('#searchInput').value.toLowerCase().trim();
      if (!q) return;
      const pages = [
        { keywords: ['dashboard', 'inicio'], url: '#/dashboard' },
        { keywords: ['menu', 'item', 'food', 'comida', 'producto', 'list'], url: '#/menu-list' },
        { keywords: ['billing', 'pos', 'facturar', 'cobrar', 'checkout'], url: '#/pos' },
        { keywords: ['add item', 'addmenu', 'nuevo item', 'agregar'], url: '#/menu-add' },
        { keywords: ['report', 'sales', 'ventas', 'chart', 'grafico'], url: '#/reports-sales' },
        { keywords: ['report date', 'date', 'fecha', 'rango'], url: '#/reports-dates' },
        { keywords: ['inventory', 'stock', 'inventario'], url: '#/inventory-list' },
        { keywords: ['expense', 'gasto', 'gastos'], url: '#/expenses-list' },
        { keywords: ['customer', 'cliente', 'clientes'], url: '#/customers-list' },
        { keywords: ['branch', 'sucursal', 'sucursales'], url: '#/branches-list' },
        { keywords: ['supplier', 'proveedor', 'proveedores', 'supplier list'], url: '#/suppliers-list' },
        { keywords: ['order list', 'ordenes', 'orders', 'pedidos'], url: '#/orders-list' },
        { keywords: ['add branch', 'nueva sucursal'], url: '#/branches-add' },
        { keywords: ['profile', 'perfil', 'my profile'], url: '#/profile' },
        { keywords: ['purchase', 'compra', 'compras', 'purchases'], url: '#/purchases-list' },
        { keywords: ['add purchase', 'nueva compra', 'add-purchase'], url: '#/purchases-add' },
        { keywords: ['settings', 'configuracion', 'ajustes'], url: '#/settings' },
        { keywords: ['audit', 'history', 'log', 'historial', 'actividad'], url: '#/audit-log' }
      ];
      for (let i = 0; i < pages.length; i++) {
        for (let j = 0; j < pages[i].keywords.length; j++) {
          if (q.includes(pages[i].keywords[j]) || pages[i].keywords[j].includes(q)) {
            window.location.hash = pages[i].url.slice(1);
            return;
          }
        }
      }
      alert('No matching page found for "' + q + '". Try: menu, billing, report, inventory, expense, customer, orders');
    });
  }
}
