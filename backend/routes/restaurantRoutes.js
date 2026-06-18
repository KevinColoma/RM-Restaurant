const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController')
const {requireAuth} = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
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
const Expense = require('../models/Expense')





router.get('/',(req,res)=>{
    res.render('signup')
})
router.get('/signin',(req,res)=>{
    res.render('signin')
})
router.get('/forgot-password',(req,res)=>{
    res.render('forgot-password')
})

router.get('/index',requireAuth,dashboardController.Dashboard)


router.post('/api/signup', restaurantController.SignUp );
router.post('/api/signin',restaurantController.SignIn)
router.post('/api/log-out',restaurantController.LogOut)
router.get('/api/personas', requireAuth, restaurantController.getPersonas)

// All menu relate routes are here
router.get('/addmenupage',requireAuth,requireRole('admin'),(req,res)=>{
    res.render('add-item')
})

router.get('/edit-item/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const Menu = require('../models/menu');
        const menu = await Menu.findOne({ _id: req.params.id, personaId: req.personaId });
        if (!menu) return res.status(404).send('Menu item not found');
        res.render('edit-item', { menu });
    } catch (err) {
        res.status(500).send(err.message);
    }
})

router.get('/pos',requireAuth,menuController.GetPos)
router.get('/getmenu',requireAuth,menuController.GetMenu)
router.post('/api/addmenu',requireAuth,requireRole('admin'),menuController.AddMenu)
router.put('/api/menu/:id',requireAuth,requireRole('admin'),menuController.UpdateMenu)
router.delete('/api/menu/:id',requireAuth,requireRole('admin'),menuController.DeleteMenu)
router.post ('/api/placeorder',requireAuth,orderController.PlaceOrder)
router.get('/orders-list', requireAuth, orderController.GetOrders)

// All report releted  routes 

router.get('/chart-js',requireAuth,requireRole('admin'),(req,res)=>{

    res.render('chart-js')

})

router.get('/api/reports/sales',requireRole('admin'),reportController.sales)
router.get('/api/reports/orders',requireRole('admin'),reportController.orders)

// All report releted  routes 

router.get('/datechart',requireAuth,requireRole('admin'),(req,res)=>{

    res.render('datechart')

})

router.get('/api/reports/sales-by-date',requireRole('admin'),datereportController.salesByDate)
router.get('/api/reports/orders-by-date',requireRole('admin'),datereportController.ordersByDate)


//inventroy coontroller routes 
router.get('/addinventory',requireAuth,requireRole('admin'),inventoryController.addInventory)

router.post('/api/addinventory',requireAuth,requireRole('admin'), inventoryController.addItem);
router.get('/get-expense-list',requireAuth,requireRole('admin'),inventoryController.getItem)
router.get('/edit-inventory/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
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
router.put('/api/inventory/:id',requireAuth,requireRole('admin'),inventoryController.updateItem)
router.delete('/api/inventory/:id',requireAuth,requireRole('admin'),inventoryController.deleteInventory );



// suppliers related routes 


router.post('/api/suppliers',requireAuth,requireRole('admin'), supplierController.createSupplier);
router.get('/api/suppliers',requireAuth,requireRole('admin'), supplierController.getSuppliers);
router.get('/suppliers-list', requireAuth, requireRole('admin'), supplierController.getSuppliersPage);
router.get('/api/suppliers/:id' ,requireAuth,requireRole('admin'), supplierController.getSupplierById);
router.put('/api/suppliers/:id' ,requireAuth,requireRole('admin'), supplierController.updateSupplier);
router.delete('/api/suppliers/:id' ,requireAuth,requireRole('admin'), supplierController.deleteSupplier);


//all expense related rouets are here 

router.get('/addexpense',requireAuth,requireRole('admin'),expenseController.addExpensePage)


router.post('/api/addexpense',requireAuth,requireRole('admin'),expenseController.addExpense)
router.get('/getexpense',requireAuth,requireRole('admin'), expenseController.getExpense);
router.delete('/api/expense/:id', requireAuth, requireRole('admin'), expenseController.deleteExpense);



// all cutomer related routes 

router.post('/api/customers',requireAuth,customerController.createCustomers)
router.get('/customers-list', requireAuth, customerController.getCustomers)
router.put('/api/customers/:id', requireAuth, customerController.updateCustomer)
router.delete('/api/customers/:id', requireAuth, customerController.deleteCustomer)

// branch related routes

router.get('/branches', requireAuth, requireRole('admin'), branchController.getBranches)
router.get('/add-branch', requireAuth, requireRole('admin'), branchController.addBranchPage)
router.post('/api/branches', requireAuth, requireRole('admin'), branchController.createBranch)
router.get('/api/branches/:id', requireAuth, requireRole('admin'), branchController.getBranchById)
router.put('/api/branches/:id', requireAuth, requireRole('admin'), branchController.updateBranch)
router.delete('/api/branches/:id', requireAuth, requireRole('admin'), branchController.deleteBranch)

// purchase related routes

router.get('/purchase-list', requireAuth, requireRole('admin'), purchaseController.listPurchases)
router.get('/add-purchase', requireAuth, requireRole('admin'), purchaseController.addPurchasePage)
router.post('/api/purchases', requireAuth, requireRole('admin'), purchaseController.createPurchase)
router.get('/api/purchases/:id', requireAuth, requireRole('admin'), purchaseController.getPurchaseById)
router.delete('/api/purchases/:id', requireAuth, requireRole('admin'), purchaseController.deletePurchase)

// expense edit routes

router.get('/edit-expense/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const expense = await Expense.findOne({ _id: req.params.id, personaId: req.personaId });
        if (!expense) return res.status(404).send('Expense not found');
        res.render('edit-expense', { expense });
    } catch (err) {
        res.status(500).send('Server Error');
    }
})
router.put('/api/expense/:id', requireAuth, requireRole('admin'), expenseController.updateExpense)

// Profile routes
router.get('/profile', requireAuth, profileController.getProfile)
router.put('/api/profile', requireAuth, (req, res, next) => { req.upload.single('avatar')(req, res, next); }, profileController.updateProfile)
router.post('/api/profile/avatar', requireAuth, (req, res, next) => { req.upload.single('avatar')(req, res, next); }, profileController.uploadAvatar)
router.put('/api/profile/password', requireAuth, profileController.changePassword)

// Settings routes
router.get('/settings', requireAuth, requireRole('admin'), settingsController.getSettings)
router.put('/api/settings', requireAuth, requireRole('admin'), settingsController.updateSettings)

// Export routes
router.get('/export/menu/csv', requireAuth, requireRole('admin'), exportController.exportMenuCsv)
router.get('/export/menu/pdf', requireAuth, requireRole('admin'), exportController.exportMenuPdf)
router.get('/export/orders/csv', requireAuth, requireRole('admin'), exportController.exportOrdersCsv)
router.get('/export/orders/pdf', requireAuth, requireRole('admin'), exportController.exportOrdersPdf)
router.get('/export/customers/csv', requireAuth, requireRole('admin'), exportController.exportCustomersCsv)
router.get('/export/customers/pdf', requireAuth, requireRole('admin'), exportController.exportCustomersPdf)
router.get('/export/expenses/csv', requireAuth, requireRole('admin'), exportController.exportExpensesCsv)
router.get('/export/expenses/pdf', requireAuth, requireRole('admin'), exportController.exportExpensesPdf)
router.get('/export/inventory/csv', requireAuth, requireRole('admin'), exportController.exportInventoryCsv)
router.get('/export/inventory/pdf', requireAuth, requireRole('admin'), exportController.exportInventoryPdf)
router.get('/export/branches/csv', requireAuth, requireRole('admin'), exportController.exportBranchesCsv)
router.get('/export/branches/pdf', requireAuth, requireRole('admin'), exportController.exportBranchesPdf)
router.get('/export/suppliers/csv', requireAuth, requireRole('admin'), exportController.exportSuppliersCsv)
router.get('/export/suppliers/pdf', requireAuth, requireRole('admin'), exportController.exportSuppliersPdf)
router.get('/export/sales/csv', requireAuth, requireRole('admin'), exportController.exportSalesCsv)
router.get('/export/sales/pdf', requireAuth, requireRole('admin'), exportController.exportSalesPdf)
router.get('/export/purchases/csv', requireAuth, requireRole('admin'), exportController.exportPurchasesCsv)
router.get('/export/purchases/pdf', requireAuth, requireRole('admin'), exportController.exportPurchasesPdf)

// Order cancel route
router.delete('/api/orders/:id', requireAuth, requireRole('admin'), orderController.deleteOrder)

// Audit log route
router.get('/audit-log', requireAuth, requireRole('admin'), auditController.getAuditLog)

module.exports = router;