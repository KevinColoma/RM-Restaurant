import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get } from '../lib/api.js';

registerRoute('/reports-sales', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  try {
    const res = await get('/reports/sales');
    const data = res || {};

    const salesByCategory = data.salesByCategory || {};
    const salesBySubCategory = data.salesBySubCategory || {};
    const salesByCategoryLabels = JSON.stringify(Object.keys(salesByCategory));
    const salesByCategoryData = JSON.stringify(Object.values(salesByCategory));
    const salesBySubCategoryLabels = JSON.stringify(Object.keys(salesBySubCategory));
    const salesBySubCategoryData = JSON.stringify(Object.values(salesBySubCategory));

    const html = `
<div class="page-wrapper cardhead">
<div class="content">
<div class="page-header">
<div class="row">
<div class="col-sm-12">
<h3 class="page-title">Sales Reports - Today</h3>
<ul class="breadcrumb">
<li class="breadcrumb-item"><a href="#/dashboard">Dashboard</a></li>
<li class="breadcrumb-item active">Reports</li>
</ul>
<div class="mt-2">
<a href="/api/export/sales/pdf" class="btn btn-sm btn-primary me-2">PDF</a>
<a href="/api/export/sales/csv" class="btn btn-sm btn-success">CSV</a>
</div>
</div>
</div>
</div>
<div class="row">
<div class="col-lg-6 col-sm-12">
<div class="card">
<div class="card-header"><div class="card-title">Sales by Category (Veg/Non-Veg)</div></div>
<div class="card-body"><div id="chartDonut" class="h-300"></div></div>
</div>
</div>
<div class="col-lg-6 col-sm-12">
<div class="card">
<div class="card-header"><div class="card-title">Sales by Sub Category</div></div>
<div class="card-body"><div id="chartPie" class="h-300"></div></div>
</div>
</div>
</div>
</div>
</div>`;

    renderLayout(app, 'reports-sales', html);

    setTimeout(() => {
      if (typeof ApexCharts !== 'undefined') {
        const donutEl = document.getElementById('chartDonut');
        if (donutEl) {
          new ApexCharts(donutEl, {
            chart: { type: 'donut', height: 300 },
            labels: Object.keys(salesByCategory),
            series: Object.values(salesByCategory),
            colors: ['#FF6384', '#36A2EB', '#FFCE56'],
            responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }]
          }).render();
        }
        const pieEl = document.getElementById('chartPie');
        if (pieEl) {
          new ApexCharts(pieEl, {
            chart: { type: 'pie', height: 300 },
            labels: Object.keys(salesBySubCategory),
            series: Object.values(salesBySubCategory),
            colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FFCD56', '#4D5360', '#C9CBCF', '#7E57C2'],
            responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }]
          }).render();
        }
      } else {
        console.warn('ApexCharts not loaded');
      }
    }, 100);
  } catch (err) {
    app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load: ${err.message}</p></div></div>`;
  }
});
