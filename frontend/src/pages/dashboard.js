import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get } from '../lib/api.js';

registerRoute('/dashboard', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  try {
    const [dashData, menuData] = await Promise.all([
      get('/dashboard'),
      get('/menu')
    ]);

    const data = dashData || {};
    const menus = menuData?.success ? menuData.data || menuData.menus : (data.menus || []);
    const totalOrders = data.totalOrders || 0;
    const totalEarnings = data.totalEarnings || 0;
    const totalExpenses = data.totalExpenses || 0;
    const totalPurchases = data.totalPurchases || 0;
    const totalPurchaseAmount = data.totalPurchaseAmount || 0;
    const netProfit = data.netProfit ?? (totalEarnings - totalExpenses);
    const mostPopular = data.mostPopularItems || [];
    const orderTypes = Array.isArray(data.orderTypeBreakdown) ? data.orderTypeBreakdown : [];
    const expenseCats = Array.isArray(data.expensesByCategory) ? data.expensesByCategory : [];

    const profitColor = netProfit >= 0 ? 'dash2' : 'dash3';

    const html = `
<div class="page-wrapper">
<div class="content">
  <div class="row">
    <div class="col-lg-3 col-sm-6 col-12">
      <div class="dash-widget dash2">
        <div class="dash-widgetimg">
          <span><img src="assets/img/icons/dash3.svg" alt=""></span>
        </div>
        <div class="dash-widgetcontent">
          <h5>Rs <span class="counters" data-count="${totalEarnings.toFixed(2)}">${totalEarnings.toFixed(2)}</span></h5>
          <h6 data-i18n="dash.total_earnings">Total Earnings</h6>
        </div>
      </div>
    </div>
    <div class="col-lg-3 col-sm-6 col-12">
      <div class="dash-widget dash3">
        <div class="dash-widgetimg">
          <span><img src="assets/img/icons/dash4.svg" alt=""></span>
        </div>
        <div class="dash-widgetcontent">
          <h5>Rs <span class="counters" data-count="${totalExpenses.toFixed(2)}">${totalExpenses.toFixed(2)}</span></h5>
          <h6 data-i18n="dash.total_expenses">Total Expenses</h6>
        </div>
      </div>
    </div>
    <div class="col-lg-3 col-sm-6 col-12">
      <div class="dash-widget dash1">
        <div class="dash-widgetimg">
          <span><img src="assets/img/icons/dash2.svg" alt=""></span>
        </div>
        <div class="dash-widgetcontent">
          <h5><span class="counters" data-count="${totalOrders}">${totalOrders}</span></h5>
          <h6 data-i18n="dash.total_orders">Total Orders</h6>
        </div>
      </div>
    </div>
    <div class="col-lg-3 col-sm-6 col-12">
      <div class="dash-widget">
        <div class="dash-widgetimg">
          <span><img src="assets/img/icons/dash1.svg" alt=""></span>
        </div>
        <div class="dash-widgetcontent">
          <h5><span class="counters" data-count="${totalPurchases}">${totalPurchases}</span></h5>
          <h6 data-i18n="dash.total_purchases">Total Purchases</h6>
        </div>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-lg-7 col-sm-12 col-12 d-flex">
      <div class="card flex-fill">
        <div class="card-header pb-0 d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0" data-i18n="dash.purchase_sales">Purchase & Sales</h5>
          <div class="graph-sets">
            <ul>
              <li><span data-i18n="dash.sales">Sales</span></li>
              <li><span data-i18n="dash.purchase">Purchase</span></li>
            </ul>
          </div>
        </div>
        <div class="card-body">
          <div id="sales_charts"></div>
        </div>
      </div>
    </div>
    <div class="col-lg-5 col-sm-12 col-12 d-flex">
      <div class="card flex-fill">
        <div class="card-header pb-0 d-flex justify-content-between align-items-center">
          <h4 class="card-title mb-0" data-i18n="dash.most_sold">Most Sold Items</h4>
        </div>
        <div class="card-body">
          <div class="table-responsive dataview">
            <table class="table datatable">
              <thead>
                <tr>
                  <th data-i18n="dash.sno">Sno</th>
                  <th data-i18n="dash.item">Item</th>
                  <th data-i18n="dash.quantity">Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${mostPopular.length
                  ? mostPopular.map((item, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${item.item}</td>
                      <td>${item.quantity}</td>
                    </tr>`).join('')
                  : '<tr><td colspan="3" class="text-center" data-i18n="dash.no_sales">No sales today</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-lg-4 col-sm-12 col-12 d-flex">
      <div class="card flex-fill">
        <div class="card-header pb-0">
          <h4 class="card-title mb-0" data-i18n="dash.orders_by_type">Orders by Type</h4>
        </div>
        <div class="card-body">
          <div id="orders_chart"></div>
        </div>
      </div>
    </div>
    <div class="col-lg-4 col-sm-12 col-12 d-flex">
      <div class="card flex-fill">
        <div class="card-header pb-0">
          <h4 class="card-title mb-0" data-i18n="dash.expenses_by_category">Expenses by Category</h4>
        </div>
        <div class="card-body">
          <div id="expenses_chart"></div>
        </div>
      </div>
    </div>
    <div class="col-lg-4 col-sm-12 col-12 d-flex">
      <div class="card flex-fill ${profitColor}">
        <div class="card-header pb-0">
          <h4 class="card-title mb-0" data-i18n="dash.net_profit">Net Profit</h4>
        </div>
        <div class="card-body d-flex align-items-center justify-content-center" style="min-height:200px">
          <h2 class="${netProfit >= 0 ? 'text-success' : 'text-danger'}" style="font-size:3rem">Rs ${netProfit.toFixed(2)}</h2>
        </div>
      </div>
    </div>
  </div>

  <div class="card mb-0">
    <div class="card-body">
      <h4 class="card-title" data-i18n="dash.list_items">List of items</h4>
      <div class="table-responsive">
        <table class="table datanew">
          <thead>
            <tr>
              <th>
                <label class="checkboxs">
                  <input type="checkbox" id="select-all">
                  <span class="checkmarks"></span>
                </label>
              </th>
              <th data-i18n="dash.item">Item Name</th>
              <th data-i18n="dash.category">Category</th>
              <th data-i18n="dash.subcategory">Sub Category</th>
              <th data-i18n="dash.price">price</th>
              <th data-i18n="dash.availability">Availability</th>
            </tr>
          </thead>
          <tbody>
            ${menus.length
              ? menus.map(menu => {
                  const price = typeof menu.price === 'number' ? menu.price.toFixed(2) : (menu.price || '0.00');
                  const available = menu.available !== undefined ? menu.available : (menu.status !== 'inactive');
                  return `
                <tr>
                  <td>
                    <label class="checkboxs">
                      <input type="checkbox">
                      <span class="checkmarks"></span>
                    </label>
                  </td>
                  <td class="productimgname">
                    <a href="javascript:void(0);">${menu.item}</a>
                  </td>
                  <td>${menu.category || '-'}</td>
                  <td>${menu.subCategory || '-'}</td>
                  <td>${price}</td>
                  <td>${available ? '<span class="badge bg-success" data-i18n="dash.available">Available</span>' : '<span class="badge bg-danger" data-i18n="dash.unavailable">Unavailable</span>'}</td>
                </tr>`}).join('')
              : '<tr><td colspan="6" class="text-center" data-i18n="dash.no_items">No menu items found</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
</div>
    `;

    renderLayout(app, 'dashboard', html);

    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.DataTable) {
        const initDataTable = (selector, opts) => {
          const table = app.querySelector(selector);
          if (!table || table.querySelector('tbody td[colspan]')) return;
          const $t = $(table);
          if ($t.length && !$.fn.DataTable.isDataTable($t[0])) $t.DataTable(opts);
        };
        initDataTable('.datanew', { pageLength: 10, bFilter: false });
        initDataTable('.datatable', { pageLength: 5, bFilter: false, bInfo: false });
      }

      if (typeof ApexCharts !== 'undefined') {
        const t = (typeof window !== 'undefined' && window.t) || (x => x);
        const salesEl = app.querySelector('#sales_charts');
        if (salesEl) {
          new ApexCharts(salesEl, {
            chart: { type: 'line', height: 300 },
            series: [{ name: t('dash.sales'), data: [totalEarnings] }, { name: t('dash.purchase'), data: [totalPurchaseAmount] }],
            colors: ['#28c76f', '#ea5455'],
            xaxis: { categories: [t('dash.sno')] },
            title: { text: t('dash.today_sales_purchases'), align: 'center' }
          }).render();
        }

        const ordersEl = app.querySelector('#orders_chart');
        if (ordersEl && orderTypes.length) {
          new ApexCharts(ordersEl, {
            chart: { type: 'donut', height: 280 },
            series: orderTypes.map(o => o.count),
            labels: orderTypes.map(o => o._id),
            colors: ['#28c76f', '#ff9f43', '#7367f0'],
            title: { text: t('dash.orders'), align: 'center' }
          }).render();
        }

        const expEl = app.querySelector('#expenses_chart');
        if (expEl && expenseCats.length) {
          new ApexCharts(expEl, {
            chart: { type: 'bar', height: 280 },
            series: [{ name: t('dash.amount'), data: expenseCats.map(c => c.total) }],
            xaxis: { categories: expenseCats.map(c => c._id || t('dash.category')) },
            colors: ['#ea5455'],
            title: { text: t('dash.expenses'), align: 'center' }
          }).render();
        }
      }
    }, 100);
  } catch (err) {
    app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load dashboard: ${err.message}</p></div></div>`;
  }
});
