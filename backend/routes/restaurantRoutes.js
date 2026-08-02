const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController')
const {requireAuth} = require('../middleware/authMiddleware')
const {requireWriteAccess} = require('../middleware/roleMiddleware')
const protect = [requireAuth, requireWriteAccess]
const menuController = require('../controllers/menuController')
const orderController = require('../controllers/orderController')
const reportController = require('../controllers/reportController')
const datereportController =require('../controllers/datereportController')
const inventoryController = require('../controllers/inventoryController');
const expenseController = require('../controllers/expenseController')
const supplierController = require('../controllers/supplierController');
const dashboardController = require('../controllers/dashController');
const customerController = require('../controllers/customerController')
const branchController = require('../controllers/branchController')
const exportController = require('../controllers/exportController')
const profileController = require('../controllers/profileController')
const settingsController = require('../controllers/settingsController')
const purchaseController = require('../controllers/purchaseController')
const auditController = require('../controllers/auditController')
const apiController = require('../controllers/apiController')
const Expense = require('../models/Expense')
const { isValidObjectId } = require('../utils/validate')





router.get('/',(req,res)=>{
    res.render('signup')
})
router.get('/signup',(req,res)=>{
    res.render('signup')
})
router.get('/signin',(req,res)=>{
    res.render('signin')
})
router.get('/forgot-password',(req,res)=>{
    res.render('forgot-password')
})

router.get('/index',protect,dashboardController.Dashboard)


router.post('/api/signup', restaurantController.SignUp );
router.post('/api/signin',restaurantController.SignIn)
router.post('/api/log-out',restaurantController.LogOut)
router.post('/api/session/release',restaurantController.ReleaseSession)
router.get('/api/personas', protect, restaurantController.getPersonas)

// All menu relate routes are here
router.get('/addmenupage',protect,(req,res)=>{
    res.render('add-item')
})

router.get('/edit-item/:id', protect, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).send('Invalid ID');
        const Menu = require('../models/menu');
        const menu = await Menu.findOne({ _id: req.params.id, personaId: req.personaId });
        if (!menu) return res.status(404).send('Menu item not found');
        res.render('edit-item', { menu });
    } catch (err) {
        res.status(500).send(err.message);
    }
})

router.get('/pos',protect,menuController.GetPos)
router.get('/getmenu',protect,menuController.GetMenu)
router.post('/api/addmenu',protect,menuController.AddMenu)
router.put('/api/menu/:id',protect,menuController.UpdateMenu)
router.delete('/api/menu/:id',protect,menuController.DeleteMenu)
router.post ('/api/placeorder',protect,orderController.PlaceOrder)
router.get('/orders-list', protect, orderController.GetOrders)

// All report releted  routes 

router.get('/chart-js',protect,(req,res)=>{

    res.render('chart-js')

})

router.get('/api/reports/sales',protect, reportController.sales)
router.get('/api/reports/orders',protect, reportController.orders)

// All report releted  routes 

router.get('/datechart',protect,(req,res)=>{

    res.render('datechart')

})

router.get('/api/reports/sales-by-date',protect, datereportController.salesByDate)
router.get('/api/reports/orders-by-date',protect, datereportController.ordersByDate)


//inventroy coontroller routes 
router.get('/addinventory',protect,inventoryController.addInventory)

router.post('/api/addinventory',protect, inventoryController.addItem);
router.get('/get-expense-list',protect,inventoryController.getItem)
router.get('/edit-inventory/:id', protect, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).send('Invalid ID');
        const InventoryItem = require('../models/InventoryItem');
        const Supplier = require('../models/Supplier');
        const item = await InventoryItem.findOne({ _id: req.params.id, personaId: req.personaId });
        if (!item) return res.status(404).send('Item not found');
        const suppliers = await Supplier.find({ personaId: req.personaId });
        res.render('edit-inventory', { item, suppliers });
    } catch (err) {
        res.status(500).send(err.message);
    }
})
router.put('/api/inventory/:id',protect,inventoryController.updateItem)
router.delete('/api/inventory/:id',protect,inventoryController.deleteInventory );



// suppliers related routes 


router.post('/api/suppliers',protect, supplierController.createSupplier);
router.get('/api/suppliers',protect, supplierController.getSuppliers);
router.get('/suppliers-list', protect, supplierController.getSuppliersPage);
router.get('/api/suppliers/:id' ,protect, supplierController.getSupplierById);
router.put('/api/suppliers/:id' ,protect, supplierController.updateSupplier);
router.delete('/api/suppliers/:id' ,protect, supplierController.deleteSupplier);


//all expense related rouets are here 

router.get('/addexpense',protect,expenseController.addExpensePage)


router.post('/api/addexpense',protect,expenseController.addExpense)
router.get('/getexpense',protect, expenseController.getExpense);
router.delete('/api/expense/:id', protect, expenseController.deleteExpense);

// ── JSON API consumed by the SPA ─────────────────────────────────────────────
// Everything above serves the EJS app and stays as it is. These expose the same
// data as JSON under the paths the SPA already calls, which until now matched
// no route and fell through to the catch-all - so lists came back as the app's
// own HTML and reads looked empty while writes 404'd.

// Expenses
router.get('/api/expenses', protect, expenseController.listExpenses);
router.post('/api/expenses', protect, expenseController.addExpense);
router.get('/api/expenses/edit/:id', protect, expenseController.getExpenseById);
router.put('/api/expenses/:id', protect, expenseController.updateExpense);
router.delete('/api/expenses/:id', protect, expenseController.deleteExpense);

// Menu
router.get('/api/menu', protect, apiController.listMenu);
router.post('/api/menu', protect, (req, res, next) => { req.menuUpload.single('image')(req, res, next); }, menuController.AddMenu);
// Streams a menu item's image stored as a binary blob in MongoDB (the filesystem
// on Render is ephemeral, so uploads can't live in public/uploads).
router.get('/api/menu/:id/image', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const Menu = require('../models/menu');
    const menu = await Menu.findById(req.params.id).select('imageData imageMime').lean();
    if (!menu || !menu.imageData) return res.status(404).json({ error: 'Image not found' });
    res.set('Content-Type', menu.imageMime || 'image/png');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(menu.imageData.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inventory
router.get('/api/inventory', protect, apiController.listInventory);
router.post('/api/inventory', protect, inventoryController.addItem);
router.get('/api/inventory/edit/:id', protect, apiController.getInventoryItem);

// Customers, branches, purchases and orders (creates/updates already existed)
router.get('/api/customers', protect, apiController.listCustomers);
router.get('/api/branches', protect, apiController.listBranches);
router.get('/api/purchases', protect, apiController.listPurchases);
router.get('/api/orders', protect, apiController.listOrders);

// Screens that read a composite payload
router.get('/api/dashboard', protect, dashboardController.DashboardJson);
router.get('/api/pos', protect, apiController.getPos);
router.get('/api/profile', protect, apiController.getProfile);
router.get('/api/settings', protect, apiController.getSettings);
router.get('/api/audit-log', protect, apiController.listAuditLog);



// all cutomer related routes 

router.post('/api/customers',protect,customerController.createCustomers)
router.get('/customers-list', protect, customerController.getCustomers)
router.put('/api/customers/:id', protect, customerController.updateCustomer)
router.delete('/api/customers/:id', protect, customerController.deleteCustomer)

// branch related routes

router.get('/branches', protect, branchController.getBranches)
router.get('/add-branch', protect, branchController.addBranchPage)
router.post('/api/branches', protect, branchController.createBranch)
router.get('/api/branches/:id', protect, branchController.getBranchById)
router.put('/api/branches/:id', protect, branchController.updateBranch)
router.delete('/api/branches/:id', protect, branchController.deleteBranch)

// purchase related routes

router.get('/purchase-list', protect, purchaseController.listPurchases)
router.get('/add-purchase', protect, purchaseController.addPurchasePage)
router.post('/api/purchases', protect, purchaseController.createPurchase)
router.get('/api/purchases/:id', protect, purchaseController.getPurchaseById)
router.delete('/api/purchases/:id', protect, purchaseController.deletePurchase)

// expense edit routes

router.get('/edit-expense/:id', protect, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).send('Invalid ID');
        const expense = await Expense.findOne({ _id: req.params.id, personaId: req.personaId });
        if (!expense) return res.status(404).send('Expense not found');
        res.render('edit-expense', { expense });
    } catch (err) {
        res.status(500).send('Server Error');
    }
})
router.put('/api/expense/:id', protect, expenseController.updateExpense)

// Profile routes
router.get('/profile', protect, profileController.getProfile)
router.put('/api/profile', protect, (req, res, next) => { req.upload.single('avatar')(req, res, next); }, profileController.updateProfile)
router.post('/api/profile/avatar', protect, (req, res, next) => { req.upload.single('avatar')(req, res, next); }, profileController.uploadAvatar)
router.put('/api/profile/password', protect, profileController.changePassword)

// Settings routes
router.get('/settings', protect, settingsController.getSettings)
router.put('/api/settings', protect, settingsController.updateSettings)

// Export routes
router.get('/export/menu/csv', protect, exportController.exportMenuCsv)
router.get('/export/menu/pdf', protect, exportController.exportMenuPdf)
router.get('/export/orders/csv', protect, exportController.exportOrdersCsv)
router.get('/export/orders/pdf', protect, exportController.exportOrdersPdf)
router.get('/export/customers/csv', protect, exportController.exportCustomersCsv)
router.get('/export/customers/pdf', protect, exportController.exportCustomersPdf)
router.get('/export/expenses/csv', protect, exportController.exportExpensesCsv)
router.get('/export/expenses/pdf', protect, exportController.exportExpensesPdf)
router.get('/export/inventory/csv', protect, exportController.exportInventoryCsv)
router.get('/export/inventory/pdf', protect, exportController.exportInventoryPdf)
router.get('/export/branches/csv', protect, exportController.exportBranchesCsv)
router.get('/export/branches/pdf', protect, exportController.exportBranchesPdf)
router.get('/export/suppliers/csv', protect, exportController.exportSuppliersCsv)
router.get('/export/suppliers/pdf', protect, exportController.exportSuppliersPdf)
router.get('/export/sales/csv', protect, exportController.exportSalesCsv)
router.get('/export/sales/pdf', protect, exportController.exportSalesPdf)
router.get('/export/purchases/csv', protect, exportController.exportPurchasesCsv)
router.get('/export/purchases/pdf', protect, exportController.exportPurchasesPdf)

// Order cancel route
router.delete('/api/orders/:id', protect, orderController.deleteOrder)

// Audit log routes
router.get('/audit-log', protect, auditController.getAuditLog)
router.get('/export/audit-log/csv', protect, exportController.exportAuditLogCsv)
router.get('/export/audit-log/pdf', protect, exportController.exportAuditLogPdf)

module.exports = router;