require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

// Models
const Rol = require('../models/Rol');
const Persona = require('../models/Persona');
const Usuario = require('../models/Usuario');
const Menu = require('../models/menu');
const Supplier = require('../models/Supplier');
const InventoryItem = require('../models/InventoryItem');
const Customer = require('../models/Customer');
const Order = require('../models/order');
const Expense = require('../models/Expense');
const Purchase = require('../models/Purchase');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function pick(arr) { return arr[rand(0, arr.length - 1)]; }

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
const today = new Date();

// ---------------------------------------------------------------------------
// Data pools
// ---------------------------------------------------------------------------
const menuItems = [
  // Veg Starters
  { item: 'Veg Spring Rolls', category: 'Veg', subCategory: 'Starter', price: 5.99 },
  { item: 'Paneer Tikka', category: 'Veg', subCategory: 'Starter', price: 7.49 },
  { item: 'Vegetable Samosa', category: 'Veg', subCategory: 'Starter', price: 4.99 },
  { item: 'Hara Bhara Kabab', category: 'Veg', subCategory: 'Starter', price: 6.29 },
  { item: 'Mushroom Chilly', category: 'Veg', subCategory: 'Starter', price: 6.99 },
  // Veg Main Course
  { item: 'Palak Paneer', category: 'Veg', subCategory: 'Main Course', price: 11.99 },
  { item: 'Dal Makhani', category: 'Veg', subCategory: 'Main Course', price: 9.99 },
  { item: 'Chana Masala', category: 'Veg', subCategory: 'Main Course', price: 10.49 },
  { item: 'Vegetable Biryani', category: 'Veg', subCategory: 'Main Course', price: 12.99 },
  { item: 'Bhindi Do Pyaza', category: 'Veg', subCategory: 'Main Course', price: 10.99 },
  // Veg Roti / Rice
  { item: 'Butter Naan', category: 'Veg', subCategory: 'Roti', price: 2.99 },
  { item: 'Tandoori Roti', category: 'Veg', subCategory: 'Roti', price: 2.49 },
  { item: 'Garlic Naan', category: 'Veg', subCategory: 'Roti', price: 3.49 },
  { item: 'Steamed Rice', category: 'Veg', subCategory: 'Rice', price: 3.99 },
  { item: 'Jeera Rice', category: 'Veg', subCategory: 'Rice', price: 4.99 },
  // Veg Soups & Salads
  { item: 'Tomato Soup', category: 'Veg', subCategory: 'Soup', price: 4.49 },
  { item: 'Sweet Corn Soup', category: 'Veg', subCategory: 'Soup', price: 4.99 },
  { item: 'Garden Salad', category: 'Veg', subCategory: 'Salad', price: 5.49 },
  { item: 'Caesar Salad (Veg)', category: 'Veg', subCategory: 'Salad', price: 6.99 },
  // Non-Veg Starters
  { item: 'Chicken Tikka', category: 'Non-Veg', subCategory: 'Starter', price: 8.99 },
  { item: 'Fish Fry', category: 'Non-Veg', subCategory: 'Starter', price: 9.49 },
  { item: 'Chicken 65', category: 'Non-Veg', subCategory: 'Starter', price: 8.49 },
  { item: 'Prawn Tempura', category: 'Non-Veg', subCategory: 'Starter', price: 10.99 },
  // Non-Veg Main Course
  { item: 'Butter Chicken', category: 'Non-Veg', subCategory: 'Main Course', price: 14.99 },
  { item: 'Chicken Curry', category: 'Non-Veg', subCategory: 'Main Course', price: 12.99 },
  { item: 'Lamb Rogan Josh', category: 'Non-Veg', subCategory: 'Main Course', price: 16.99 },
  { item: 'Fish Curry', category: 'Non-Veg', subCategory: 'Main Course', price: 13.99 },
  { item: 'Chicken Biryani', category: 'Non-Veg', subCategory: 'Main Course', price: 13.99 },
  { item: 'Prawn Masala', category: 'Non-Veg', subCategory: 'Main Course', price: 15.99 },
  // Non-Veg Snacks / Side
  { item: 'Chicken Wings', category: 'Non-Veg', subCategory: 'Snack', price: 7.99 },
  { item: 'Egg Curry', category: 'Non-Veg', subCategory: 'Side Dish', price: 8.99 },
  // Beverages
  { item: 'Masala Chai', category: 'Veg', subCategory: 'Beverage', price: 2.49 },
  { item: 'Cold Coffee', category: 'Veg', subCategory: 'Beverage', price: 3.99 },
  { item: 'Mango Lassi', category: 'Veg', subCategory: 'Beverage', price: 4.49 },
  { item: 'Fresh Lime Soda', category: 'Veg', subCategory: 'Beverage', price: 3.49 },
  { item: 'Buttermilk', category: 'Veg', subCategory: 'Beverage', price: 2.99 },
  { item: 'Soft Drink', category: 'Veg', subCategory: 'Beverage', price: 1.99 },
  { item: 'Fresh Orange Juice', category: 'Veg', subCategory: 'Juice', price: 4.99 },
  // Desserts
  { item: 'Gulab Jamun', category: 'Veg', subCategory: 'Dessert', price: 3.99 },
  { item: 'Ice Cream', category: 'Veg', subCategory: 'Dessert', price: 3.49 },
  { item: 'Rice Pudding', category: 'Veg', subCategory: 'Dessert', price: 4.49 },
  { item: 'Brownie with Ice Cream', category: 'Veg', subCategory: 'Dessert', price: 5.99 },
];

const supplierData = [
  { name: 'FreshProduce Co.', contactInfo: '555-0101 - 100 Market St' },
  { name: 'Prime Meats Ltd.', contactInfo: '555-0102 - 200 Industrial Ave' },
  { name: 'Daily Dairy Supply', contactInfo: '555-0103 - 150 Dairy Ln' },
  { name: 'Spice World Inc.', contactInfo: '555-0104 - 75 Spice Rd' },
  { name: 'Beverage Distributors', contactInfo: '555-0105 - 50 Drink Dr' },
  { name: 'Bakery Goods Supply', contactInfo: '555-0106 - 30 Oven St' },
  { name: 'Seafood Market', contactInfo: '555-0107 - 22 Harbor Blvd' },
  { name: 'Organic Greens Farm', contactInfo: '555-0108 - 88 Green Valley' },
  { name: 'Frozen Food Warehouse', contactInfo: '555-0109 - 300 Freezer Ct' },
  { name: 'Oil & Grains Co.', contactInfo: '555-0110 - 60 Mill Rd' },
  { name: 'Packaging Solutions', contactInfo: '555-0111 - 45 Box St' },
  { name: 'Cleaning Supplies Inc.', contactInfo: '555-0112 - 12 Clean Way' },
];

const inventoryItemNames = [
  'Tomato', 'Onion', 'Potato', 'Garlic', 'Ginger', 'Green Chilli', 'Coriander',
  'Chicken Breast', 'Chicken Thigh', 'Mutton', 'Fish Fillet', 'Prawns', 'Eggs',
  'Milk', 'Butter', 'Cream', 'Cheese', 'Paneer', 'Yogurt',
  'Turmeric', 'Cumin', 'Coriander Powder', 'Red Chilli Powder', 'Garam Masala',
  'Coca Cola', 'Pepsi', 'Mineral Water', 'Orange Juice', 'Mango Juice',
  'Wheat Flour', 'Rice', 'Basmati Rice', 'Sugar', 'Salt', 'Cooking Oil',
  'Napkins', 'Takeaway Boxes', 'Plastic Cutlery', 'Cleaning Detergent', 'Hand Soap',
  'Frozen Peas', 'Frozen Mixed Veg', 'Ketchup', 'Mayonnaise', 'Vinegar',
  'Lettuce', 'Cucumber', 'Lemon', 'Cabbage', 'Capsicum',
  'Honey', 'Chocolate Syrup', 'Tea Leaves', 'Coffee Beans', 'Mango Pulp',
  'Chicken Stock', 'Tomato Puree', 'Pasta', 'Noodles', 'Breadcrumbs',
  'Olive Oil', 'Soy Sauce', 'Hot Sauce', 'BBQ Sauce', 'Mustard',
  'Baking Powder', 'Baking Soda', 'Vanilla Extract', 'Gelatin', 'Palm Oil',
  'Cinnamon Sticks', 'Cardamom', 'Cloves', 'Bay Leaves', 'Black Pepper',
  'Sesame Seeds', 'Poppy Seeds', 'Cashews', 'Almonds', 'Raisins',
];

const expenseTypes = [
  'Rent', 'Electricity Bill', 'Water Bill', 'Gas Bill', 'Internet',
  'Ingredients Purchase', 'Staff Salary', 'Maintenance', 'Marketing',
  'Insurance', 'Cleaning Service', 'Waste Disposal', 'Equipment Repair',
  'Licenses & Permits', 'Accounting Fees', 'Delivery Partner Commission',
  'Decoration', 'Music License', 'POS System', 'Pest Control',
];

const paymentMethods = ['cash', 'credit card', 'bank transfer', 'other'];

const customerNames = [
  'Carlos Mendoza', 'Maria Lopez', 'Jose Garcia', 'Ana Rodriguez', 'Luis Martinez',
  'Elena Sanchez', 'Miguel Torres', 'Sofia Hernandez', 'Ricardo Ramirez', 'Isabella Cruz',
  'Fernando Diaz', 'Valentina Morales', 'Andres Ortiz', 'Camila Vargas', 'Diego Castillo',
  'Lucia Reyes', 'Santiago Guzman', 'Gabriela Flores', 'Mateo Herrera', 'Emilia Jimenez',
  'Sebastian Medina', 'Daniela Rivas', 'Adrian Vega', 'Victoria Campos', 'Nicolas Aguilar',
  'Julieta Navarro', 'Pablo Salazar', 'Valeria Pena', 'Cristian Delgado', 'Renata Guerrero',
  'Alejandro Carrillo', 'Ximena Cordova', 'Manuel Espinoza', 'Paula Figueroa', 'Javier Ibarra',
  'Regina Lozano', 'Emiliano Maldonado', 'Fernanda Montoya', 'Leonardo Noriega', 'Mariana Padilla',
  'Gerardo Quintana', 'Patricia Rangel', 'Hector Salinas', 'Liliana Tovar', 'Ivan Urena',
  'Rosa Vela', 'Oscar Zavala', 'Alicia Paredes', 'Raul Cisneros',   'Diana Quintanilla', 'Alonso Bautista', 'Brenda Ceja', 'Cesar Dorantes',
  'Esther Escobar', 'Felipe Fajardo', 'Graciela Galvan', 'Humberto Herrera',
  'Irene Ibarra', 'Jaime Juarez', 'Karla Kuri', 'Laura Larios',
  'Mario Monroy', 'Nadia Nava', 'Octavio Ocampo', 'Perla Ponce',
  'Ramiro Rocha', 'Silvia Solis', 'Tania Trujillo', 'Ulises Urbina',
  'Veronica Vega', 'Wilfrido Wong', 'Xochitl Ximenez', 'Yolanda Yanez',
  'Zacarías Zavala', 'Adela Aguayo', 'Benito Barraza', 'Carolina Caro',
  'Dario Dueñas', 'Elva Esparza', 'Fausto Fuentes', 'Gloria Gamez',
  'Heriberto Grijalva', 'Ilse Iñiguez', 'Joaquin Jaimes', 'Lorena Luevano',
  'Martin Manriquez', 'Nelly Najar', 'Omar Olague', 'Paulina Partida',
  'Rogelio Quezada', 'Socorro Saenz', 'Teodoro Terrazas', 'Ursula Uribe',
  'Vicente Villalpando', 'Yadira Yañez', 'Abel Almaraz', 'Belen Ballesteros',
  'Cipriano Cardenas', 'Dulce Davila', 'Erasmo Escalera', 'Fabiola Fierro',
  'German Girón', 'Heliodoro Hidalgo', 'Indira Ibarra', 'Jerónimo Jaramillo',
  'Leticia Lerma', 'Modesto Munguia', 'Nereida Noriega', 'Osvaldo Orosco',
  'Pascual Peña', 'Rebeca Rendón', 'Salomon Sotelo', 'Teresa Treviño',
  'Ubaldo Ulloa', 'Vanessa Valdes', 'Wendy Waite', 'Xavier Xicale',
  'Yamileth Yepez', 'Zenaida Zarate', 'Arturo Almonte', 'Blanca Bermudez',
];

const orderComments = [
  '', '', '', '', '',
  'Extra spicy please', 'Less oil', 'No onions', 'Packing carefully',
  'Need cutlery', 'Birthday treat - add a candle', 'Quick delivery',
  'Call before arriving', 'Extra cheese on everything', 'Make it mild',
  'Double portion of rice', 'No ice in drinks', 'Add fork and spoon',
];

const vendors = [
  'Sysco Foods', 'US Foods', 'Performance Food Group', 'Gordon Food Service',
  'Food Service Direct', 'Bunzl Distribution', 'Martin Bros.', 'PFG',
  'Cheney Brothers', 'Reinhart FoodService',
];

const purchaseNotes = [
  'Monthly stock', 'Weekly order', 'Urgent delivery requested',
  'Promotional offer', 'Backorder fulfilled', 'Auto reorder',
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rms';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  const clear = process.argv.includes('--clear');
  if (clear) {
    console.log('Clearing existing data...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const c of collections) {
      if (c.name !== 'system.indexes') {
        await mongoose.connection.db.dropCollection(c.name);
      }
    }
    // Re-create indexes
    await Promise.all([
      Rol.createIndexes(),
      Persona.createIndexes(),
      Usuario.createIndexes(),
      Menu.createIndexes(),
      Supplier.createIndexes(),
      InventoryItem.createIndexes(),
      Customer.createIndexes(),
      Order.createIndexes(),
      Expense.createIndexes(),
      Purchase.createIndexes(),
    ]);
    console.log('All collections cleared\n');
  }

  // 1. Rol
  const [rol] = await Rol.create([{ nombre: 'admin', descripcion: 'Administrator' }]);
  console.log(`  1 Rol`);

  // 2. Persona
  const [persona] = await Persona.create([{
    ownerName: 'Rajesh Kumar',
    restaurantName: 'Spice Garden Restaurant',
    city: 'Mumbai',
    address: '42 Marine Drive, Colaba',
    mobile: 9876543210,
    currencySymbol: '$',
    taxRate: 10,
    theme: 'light',
  }]);
  const pid = persona._id;
  console.log(`  1 Persona`);

  // 3. Usuario
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await Usuario.create([{
    username: 'admin@spicegarden.com',
    password: hashedPassword,
    personaId: pid,
    rolId: rol._id,
    isadmin: true,
  }]);
  console.log(`  1 Usuario`);

  // 4. Menu
  const menuDocs = menuItems.map(m => ({
    personaId: pid,
    item: m.item,
    category: m.category,
    subCategory: m.subCategory,
    price: m.price,
    availability: Math.random() > 0.1,
  }));
  const menus = await Menu.create(menuDocs);
  const menuIds = menus.map(m => ({ _id: m._id, price: m.price }));
  console.log(`  ${menus.length} Menu items`);

  // 5. Suppliers
  const supplierDocs = supplierData.map(s => ({
    personaId: pid,
    name: s.name,
    contactInfo: s.contactInfo,
  }));
  const suppliers = await Supplier.create(supplierDocs);
  const supplierIds = suppliers.map(s => s._id);
  console.log(`  ${suppliers.length} Suppliers`);

  // 6. Inventory Items
  const invDocs = inventoryItemNames.map(name => ({
    personaId: pid,
    name,
    quantity: rand(10, 500),
    price: parseFloat((Math.random() * 40 + 1).toFixed(2)),
    supplier: pick(supplierIds),
  }));
  const invItems = await InventoryItem.create(invDocs);
  console.log(`  ${invItems.length} Inventory Items`);

  // 7. Customers
  const customerDocs = customerNames.map(name => ({
    personaId: pid,
    name,
    phone: `${rand(600, 999)}${rand(100, 999)}${rand(1000, 9999)}`,
    address: `${rand(1, 999)} ${pick(['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Cedar Ln', 'Maple Dr', 'Park Blvd', 'Lake View', 'Hill Rd', 'River St'])}`,
  }));
  const customers = await Customer.create(customerDocs);
  const customerIds = customers.map(c => ({ _id: c._id }));
  console.log(`  ${customers.length} Customers`);

  // 8. Orders (350)
  const orderDocs = [];
  for (let i = 0; i < 350; i++) {
    const itemCount = rand(1, 5);
    const items = [];
    let subtotal = 0;
    for (let j = 0; j < itemCount; j++) {
      const menuItem = pick(menuIds);
      const qty = rand(1, 3);
      items.push({ menuItem: menuItem._id, quantity: qty, price: menuItem.price });
      subtotal += menuItem.price * qty;
    }
    const taxRate = persona.taxRate / 100;
    const tax = parseFloat((subtotal * taxRate).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));
    const typeWeights = Math.random();
    const orderType = typeWeights < 0.5 ? 'dine in' : typeWeights < 0.8 ? 'take away' : 'online';
    orderDocs.push({
      personaId: pid,
      items,
      taxAmount: tax,
      totalAmount: total,
      orderType,
      comment: pick(orderComments),
      createdAt: randomDate(sixMonthsAgo, today),
    });
  }
  const orders = await Order.create(orderDocs);
  const orderIds = orders.map(o => o._id);
  console.log(`  ${orders.length} Orders`);

  // Link orders to random customers
  for (const customer of customers) {
    const customerOrders = pick(orderIds);
    customer.orders.push(customerOrders);
    // Remove picked so one order belongs to one customer ideally, but some may be unassigned
    const idx = orderIds.indexOf(customerOrders);
    if (idx > -1) orderIds.splice(idx, 1);
    if (orderIds.length === 0) break;
  }
  await Promise.all(customers.map(c => c.save()));
  console.log('  Orders linked to Customers');

  // 9. Expenses (100)
  const expenseDocs = [];
  for (let i = 0; i < 100; i++) {
    expenseDocs.push({
      personaId: pid,
      expenseType: pick(expenseTypes),
      expenseDate: randomDate(sixMonthsAgo, today),
      amount: parseFloat((Math.random() * 2000 + 20).toFixed(2)),
      description: `Monthly ${pick(expenseTypes)} expense`,
      paymentMethod: pick(paymentMethods),
      invoiceNumber: `INV-${rand(10000, 99999)}`,
      vendor: pick(vendors),
      category: pick(['Operations', 'Utilities', 'Food Cost', 'Marketing', 'Maintenance']),
    });
  }
  await Expense.create(expenseDocs);
  console.log(`  ${expenseDocs.length} Expenses`);

  // 10. Purchases (60)
  const purchaseDocs = [];
  for (let i = 0; i < 60; i++) {
    const itemCount = rand(1, 4);
    const items = [];
    let totalAmount = 0;
    for (let j = 0; j < itemCount; j++) {
      const invItem = pick(invItems);
      const qty = rand(5, 100);
      const unitPrice = invItem.price;
      const totalPrice = parseFloat((qty * unitPrice).toFixed(2));
      items.push({ itemName: invItem.name, quantity: qty, unitPrice, totalPrice });
      totalAmount += totalPrice;
    }
    purchaseDocs.push({
      personaId: pid,
      supplier: pick(supplierIds),
      items,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      purchaseDate: randomDate(sixMonthsAgo, today),
      notes: pick(purchaseNotes),
    });
  }
  await Purchase.create(purchaseDocs);
  console.log(`  ${purchaseDocs.length} Purchases\n`);

  const total = 1 + 1 + 1 + menus.length + suppliers.length + invItems.length +
    customers.length + orders.length + expenseDocs.length + purchaseDocs.length;
  console.log('========================================');
  console.log(`  Seed completed! Total records: ${total}`);
  console.log('========================================');
  console.log('\n  Admin login:');
  console.log('    Email:    admin@spicegarden.com');
  console.log('    Password: admin123\n');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
