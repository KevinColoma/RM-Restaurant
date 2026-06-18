import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get } from '../lib/api.js';

registerRoute('/reports-dates', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  const html = `
<div class="page-wrapper cardhead">
<div class="content">
<div class="page-header">
<div class="row">
<div class="col-sm-12">
<h3 class="page-title">Sales Reports - By Date</h3>
<ul class="breadcrumb">
<li class="breadcrumb-item"><a href="#/dashboard">Dashboard</a></li>
<li class="breadcrumb-item active">Reports</li>
</ul>
</div>
</div>
</div>
<div class="row">
<div class="col-md-12">
<form id="dateRangeForm" class="row mb-4">
<div class="form-group col-md-3">
<label for="startDate">Start Date:</label>
<input type="date" class="form-control" id="startDate" name="startDate">
</div>
<div class="form-group col-md-3">
<label for="endDate">End Date:</label>
<input type="date" class="form-control" id="endDate" name="endDate">
</div>
<div class="form-group col-md-3 d-flex align-items-end">
<button type="submit" class="btn btn-primary w-100">Get Report</button>
</div>
<div class="form-group col-md-3 d-flex align-items-end">
<a href="/api/export/sales/pdf" class="btn btn-sm btn-primary me-2">PDF</a>
<a href="/api/export/sales/csv" class="btn btn-sm btn-success">CSV</a>
</div>
</form>
</div>
</div>
<div class="row" id="charts-row">
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
<div class="col-lg-6 col-sm-12">
<div class="card">
<div class="card-header"><div class="card-title">Most Popular Items</div></div>
<div class="card-body"><div id="chartBar" class="h-300"></div></div>
</div>
</div>
<div class="col-lg-6 col-sm-12">
<div class="card">
<div class="card-header"><div class="card-title">Average Order Value</div></div>
<div class="card-body"><div id="chartLine" class="h-300"></div></div>
</div>
</div>
<div class="col-lg-6 col-sm-12">
<div class="card">
<div class="card-header"><h5 class="card-title">Order Volume by Hour</h5></div>
<div class="card-body"><div id="order-volume-chart" class="h-300"></div></div>
</div>
</div>
<div class="col-lg-6 col-sm-12">
<div class="card">
<div class="card-header"><h5 class="card-title">Sales Over Time</h5></div>
<div class="card-body"><div id="sales-over-time-chart" class="h-300"></div></div>
</div>
</div>
<div class="col-lg-6 col-sm-12">
<div class="card">
<div class="card-header"><h5 class="card-title">Revenue by Order Type</h5></div>
<div class="card-body"><div id="revenue-order-type-chart" class="h-300"></div></div>
</div>
</div>
<div class="col-lg-6 col-sm-12">
<div class="card">
<div class="card-header"><h5 class="card-title">Order Type Distribution</h5></div>
<div class="card-body"><div id="order-type-chart" class="h-300"></div></div>
</div>
</div>
</div>
</div>
</div>`;

  renderLayout(app, 'reports-dates', html);

  let chartInstances = {};

  function destroyCharts() {
    Object.values(chartInstances).forEach(c => { if (c) c.destroy(); });
    chartInstances = {};
  }

  function renderCharts(salesData, ordersData) {
    destroyCharts();

    if (typeof ApexCharts === 'undefined') {
      console.warn('ApexCharts not loaded');
      return;
    }

    const sCat = salesData?.salesByCategory || {};
    const sSub = salesData?.salesBySubCategory || {};
    const popular = ordersData?.mostPopularItems || [];
    const avgValue = ordersData?.averageOrderValue || 0;
    const hourVolume = ordersData?.orderVolumeByHour || [];
    const salesOverTime = ordersData?.salesOverTime || {};
    const revByType = ordersData?.revenueByOrderType || { dineIn: 0, takeAway: 0, online: 0 };
    const orderTypes = ordersData?.orderTypeCounts || {};

    if (document.getElementById('chartDonut')) {
      chartInstances.donut = new ApexCharts(document.getElementById('chartDonut'), {
        chart: { type: 'donut', height: 300 },
        labels: Object.keys(sCat),
        series: Object.values(sCat),
        colors: ['#FF6384', '#36A2EB', '#FFCE56']
      });
      chartInstances.donut.render();
    }

    if (document.getElementById('chartPie')) {
      chartInstances.pie = new ApexCharts(document.getElementById('chartPie'), {
        chart: { type: 'pie', height: 300 },
        labels: Object.keys(sSub),
        series: Object.values(sSub),
        colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FFCD56', '#4D5360', '#C9CBCF', '#7E57C2']
      });
      chartInstances.pie.render();
    }

    if (document.getElementById('chartBar')) {
      chartInstances.bar = new ApexCharts(document.getElementById('chartBar'), {
        chart: { type: 'bar', height: 300 },
        series: [{ name: 'Orders', data: popular.map(i => i[1] || i.quantity || 0) }],
        xaxis: { categories: popular.map(i => i[0] || i.item || '') },
        colors: ['#36A2EB']
      });
      chartInstances.bar.render();
    }

    if (document.getElementById('chartLine')) {
      chartInstances.line = new ApexCharts(document.getElementById('chartLine'), {
        chart: { type: 'line', height: 300 },
        series: [{ name: 'Avg Order Value', data: [avgValue, avgValue, avgValue, avgValue, avgValue, avgValue] }],
        xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
        colors: ['#36A2EB']
      });
      chartInstances.line.render();
    }

    if (document.getElementById('order-volume-chart')) {
      chartInstances.hour = new ApexCharts(document.getElementById('order-volume-chart'), {
        chart: { type: 'bar', height: 300 },
        series: [{ name: 'Orders', data: hourVolume }],
        xaxis: { categories: Array.from({ length: 24 }, (_, i) => i + ':00') },
        colors: ['#FF6384']
      });
      chartInstances.hour.render();
    }

    if (document.getElementById('sales-over-time-chart')) {
      chartInstances.salesTime = new ApexCharts(document.getElementById('sales-over-time-chart'), {
        chart: { type: 'line', height: 300 },
        series: [{ name: 'Sales', data: Object.values(salesOverTime) }],
        xaxis: { categories: Object.keys(salesOverTime) },
        colors: ['#4BC0C0']
      });
      chartInstances.salesTime.render();
    }

    if (document.getElementById('revenue-order-type-chart')) {
      const revLabels = ['Dine In', 'Take Away', 'Online'];
      const revData = [revByType.dineIn || 0, revByType.takeAway || 0, revByType.online || 0];
      chartInstances.revenue = new ApexCharts(document.getElementById('revenue-order-type-chart'), {
        chart: { type: 'bar', height: 300 },
        series: [{ name: 'Revenue', data: revData }],
        xaxis: { categories: revLabels },
        colors: ['#36A2EB', '#FFCE56', '#FF6384']
      });
      chartInstances.revenue.render();
    }

    if (document.getElementById('order-type-chart')) {
      chartInstances.orderType = new ApexCharts(document.getElementById('order-type-chart'), {
        chart: { type: 'donut', height: 300 },
        labels: Object.keys(orderTypes),
        series: Object.values(orderTypes),
        colors: ['#36A2EB', '#FFCE56', '#FF6384']
      });
      chartInstances.orderType.render();
    }
  }

  document.getElementById('dateRangeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    if (!startDate || !endDate) {
      Swal.fire('Error!', 'Please select both start and end dates.', 'error');
      return;
    }

    try {
      const [salesData, ordersData] = await Promise.all([
        get('/reports/sales-by-date?startDate=' + startDate + '&endDate=' + endDate),
        get('/reports/orders-by-date?startDate=' + startDate + '&endDate=' + endDate)
      ]);
      renderCharts(salesData, ordersData);
    } catch (err) {
      Swal.fire('Error!', 'Failed to fetch report: ' + err.message, 'error');
    }
  });
});
