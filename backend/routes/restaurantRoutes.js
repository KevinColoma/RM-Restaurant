const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController')
const {requireAuth} = require('../middleware/authMiddleware')
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
const { isValidObjectId } = require('../utils/validate')





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
router.get('/addmenupage',requireAuth,(req,res)=>{
    res.render('add-item')
})

router.get('/edit-item/:id', requireAuth, async (req, res) => {
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

router.get('/pos',requireAuth,menuController.GetPos)
router.get('/getmenu',requireAuth,menuController.GetMenu)
router.post('/api/addmenu',requireAuth,menuController.AddMenu)
router.put('/api/menu/:id',requireAuth,menuController.UpdateMenu)
router.delete('/api/menu/:id',requireAuth,menuController.DeleteMenu)
router.post ('/api/placeorder',requireAuth,orderController.PlaceOrder)
router.get('/orders-list', requireAuth, orderController.GetOrders)

// All report releted  routes 

router.get('/chart-js',requireAuth,(req,res)=>{

    res.render('chart-js')

})

router.get('/api/reports/sales',requireAuth, reportController.sales)
router.get('/api/reports/orders',requireAuth, reportController.orders)

// All report releted  routes 

router.get('/datechart',requireAuth,(req,res)=>{

    res.render('datechart')

})

router.get('/api/reports/sales-by-date',requireAuth, datereportController.salesByDate)
router.get('/api/reports/orders-by-date',requireAuth, datereportController.ordersByDate)


//inventroy coontroller routes 
router.get('/addinventory',requireAuth,inventoryController.addInventory)

router.post('/api/addinventory',requireAuth, inventoryController.addItem);
router.get('/get-expense-list',requireAuth,inventoryController.getItem)
router.get('/edit-inventory/:id', requireAuth, async (req, res) => {
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
router.put('/api/inventory/:id',requireAuth,inventoryController.updateItem)
router.delete('/api/inventory/:id',requireAuth,inventoryController.deleteInventory );



// suppliers related routes 


router.post('/api/suppliers',requireAuth, supplierController.createSupplier);
router.get('/api/suppliers',requireAuth, supplierController.getSuppliers);
router.get('/suppliers-list', requireAuth, supplierController.getSuppliersPage);
router.get('/api/suppliers/:id' ,requireAuth, supplierController.getSupplierById);
router.put('/api/suppliers/:id' ,requireAuth, supplierController.updateSupplier);
router.delete('/api/suppliers/:id' ,requireAuth, supplierController.deleteSupplier);


//all expense related rouets are here 

router.get('/addexpense',requireAuth,expenseController.addExpensePage)


router.post('/api/addexpense',requireAuth,expenseController.addExpense)
router.get('/getexpense',requireAuth, expenseController.getExpense);
router.delete('/api/expense/:id', requireAuth, expenseController.deleteExpense);



// all cutomer related routes 

router.post('/api/customers',requireAuth,customerController.createCustomers)
router.get('/customers-list', requireAuth, customerController.getCustomers)
router.put('/api/customers/:id', requireAuth, customerController.updateCustomer)
router.delete('/api/customers/:id', requireAuth, customerController.deleteCustomer)

// branch related routes

router.get('/branches', requireAuth, branchController.getBranches)
router.get('/add-branch', requireAuth, branchController.addBranchPage)
router.post('/api/branches', requireAuth, branchController.createBranch)
router.get('/api/branches/:id', requireAuth, branchController.getBranchById)
router.put('/api/branches/:id', requireAuth, branchController.updateBranch)
router.delete('/api/branches/:id', requireAuth, branchController.deleteBranch)

// purchase related routes

router.get('/purchase-list', requireAuth, purchaseController.listPurchases)
router.get('/add-purchase', requireAuth, purchaseController.addPurchasePage)
router.post('/api/purchases', requireAuth, purchaseController.createPurchase)
router.get('/api/purchases/:id', requireAuth, purchaseController.getPurchaseById)
router.delete('/api/purchases/:id', requireAuth, purchaseController.deletePurchase)

// expense edit routes

router.get('/edit-expense/:id', requireAuth, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).send('Invalid ID');
        const expense = await Expense.findOne({ _id: req.params.id, personaId: req.personaId });
        if (!expense) return res.status(404).send('Expense not found');
        res.render('edit-expense', { expense });
    } catch (err) {
        res.status(500).send('Server Error');
    }
})
router.put('/api/expense/:id', requireAuth, expenseController.updateExpense)

// Profile routes
router.get('/profile', requireAuth, profileController.getProfile)
router.put('/api/profile', requireAuth, (req, res, next) => { req.upload.single('avatar')(req, res, next); }, profileController.updateProfile)
router.post('/api/profile/avatar', requireAuth, (req, res, next) => { req.upload.single('avatar')(req, res, next); }, profileController.uploadAvatar)
router.put('/api/profile/password', requireAuth, profileController.changePassword)

// Settings routes
router.get('/settings', requireAuth, settingsController.getSettings)
router.put('/api/settings', requireAuth, settingsController.updateSettings)

// Export routes
router.get('/export/menu/csv', requireAuth, exportController.exportMenuCsv)
router.get('/export/menu/pdf', requireAuth, exportController.exportMenuPdf)
router.get('/export/orders/csv', requireAuth, exportController.exportOrdersCsv)
router.get('/export/orders/pdf', requireAuth, exportController.exportOrdersPdf)
router.get('/export/customers/csv', requireAuth, exportController.exportCustomersCsv)
router.get('/export/customers/pdf', requireAuth, exportController.exportCustomersPdf)
router.get('/export/expenses/csv', requireAuth, exportController.exportExpensesCsv)
router.get('/export/expenses/pdf', requireAuth, exportController.exportExpensesPdf)
router.get('/export/inventory/csv', requireAuth, exportController.exportInventoryCsv)
router.get('/export/inventory/pdf', requireAuth, exportController.exportInventoryPdf)
router.get('/export/branches/csv', requireAuth, exportController.exportBranchesCsv)
router.get('/export/branches/pdf', requireAuth, exportController.exportBranchesPdf)
router.get('/export/suppliers/csv', requireAuth, exportController.exportSuppliersCsv)
router.get('/export/suppliers/pdf', requireAuth, exportController.exportSuppliersPdf)
router.get('/export/sales/csv', requireAuth, exportController.exportSalesCsv)
router.get('/export/sales/pdf', requireAuth, exportController.exportSalesPdf)
router.get('/export/purchases/csv', requireAuth, exportController.exportPurchasesCsv)
router.get('/export/purchases/pdf', requireAuth, exportController.exportPurchasesPdf)

// Order cancel route
router.delete('/api/orders/:id', requireAuth, orderController.deleteOrder)

// Audit log route
router.get('/audit-log', requireAuth, auditController.getAuditLog)

module.exports = router;