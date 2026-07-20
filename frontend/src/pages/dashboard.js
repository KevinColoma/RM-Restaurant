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
    const mostPopular = data.mostPopularItems || [];

    const html = `
<div class="page-wrapper">
<div class="content">
  <div class="row">
    <div class="col-lg-3 col-sm-6 col-12">
      <div class="dash-widget dash2">
        <div class="dash-widgetimg">
          <span><img src="assets/img/icons/dash3.svg" alt="img"></span>
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
          <span><img src="assets/img/icons/dash4.svg" alt="img"></span>
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
          <span><img src="assets/img/icons/dash2.svg" alt="img"></span>
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
          <span><img src="assets/img/icons/dash1.svg" alt="img"></span>
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
                  : '<tr><td colspan="3" class="text-center">No sales today</td></tr>'
                }
              </tbody>
            </table>
          </div>
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
                  <td>${available ? '<span class="badge bg-success">Available</span>' : '<span class="badge bg-danger">Unavailable</span>'}</td>
                </tr>`}).join('')
              : '<tr><td colspan="6" class="text-center">No menu items found</td></tr>'
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
        // Skip DataTables when the body is just a "No data" colspan placeholder;
        // initializing over it throws a _DT_CellIndex error.
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
        const chartEl = app.querySelector('#sales_charts');
        if (chartEl) {
          const options = {
            chart: { type: 'line', height: 300 },
            series: [{
              name: 'Sales',
              data: [totalEarnings]
            }],
            xaxis: { categories: ['Today'] },
            title: { text: 'Today Sales', align: 'center' }
          };
          new ApexCharts(chartEl, options).render();
        }
      }
    }, 100);
  } catch (err) {
    app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load dashboard: ${err.message}</p></div></div>`;
  }
});
