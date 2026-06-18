require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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
  { item: 'Veg Spring Rolls', category: 'Veg', subCategory: 'Starter', price: 5.99 },
  { item: 'Paneer Tikka', category: 'Veg', subCategory: 'Starter', price: 7.49 },
  { item: 'Vegetable Samosa', category: 'Veg', subCategory: 'Starter', price: 4.99 },
  { item: 'Hara Bhara Kabab', category: 'Veg', subCategory: 'Starter', price: 6.29 },
  { item: 'Mushroom Chilly', category: 'Veg', subCategory: 'Starter', price: 6.99 },
  { item: 'Palak Paneer', category: 'Veg', subCategory: 'Main Course', price: 11.99 },
  { item: 'Dal Makhani', category: 'Veg', subCategory: 'Main Course', price: 9.99 },
  { item: 'Chana Masala', category: 'Veg', subCategory: 'Main Course', price: 10.49 },
  { item: 'Vegetable Biryani', category: 'Veg', subCategory: 'Main Course', price: 12.99 },
  { item: 'Bhindi Do Pyaza', category: 'Veg', subCategory: 'Main Course', price: 10.99 },
  { item: 'Butter Naan', category: 'Veg', subCategory: 'Roti', price: 2.99 },
  { item: 'Tandoori Roti', category: 'Veg', subCategory: 'Roti', price: 2.49 },
  { item: 'Garlic Naan', category: 'Veg', subCategory: 'Roti', price: 3.49 },
  { item: 'Steamed Rice', category: 'Veg', subCategory: 'Rice', price: 3.99 },
  { item: 'Jeera Rice', category: 'Veg', subCategory: 'Rice', price: 4.99 },
  { item: 'Tomato Soup', category: 'Veg', subCategory: 'Soup', price: 4.49 },
  { item: 'Sweet Corn Soup', category: 'Veg', subCategory: 'Soup', price: 4.99 },
  { item: 'Garden Salad', category: 'Veg', subCategory: 'Salad', price: 5.49 },
  { item: 'Caesar Salad (Veg)', category: 'Veg', subCategory: 'Salad', price: 6.99 },
  { item: 'Chicken Tikka', category: 'Non-Veg', subCategory: 'Starter', price: 8.99 },
  { item: 'Fish Fry', category: 'Non-Veg', subCategory: 'Starter', price: 9.49 },
  { item: 'Chicken 65', category: 'Non-Veg', subCategory: 'Starter', price: 8.49 },
  { item: 'Prawn Tempura', category: 'Non-Veg', subCategory: 'Starter', price: 10.99 },
  { item: 'Butter Chicken', category: 'Non-Veg', subCategory: 'Main Course', price: 14.99 },
  { item: 'Chicken Curry', category: 'Non-Veg', subCategory: 'Main Course', price: 12.99 },
  { item: 'Lamb Rogan Josh', category: 'Non-Veg', subCategory: 'Main Course', price: 16.99 },
  { item: 'Fish Curry', category: 'Non-Veg', subCategory: 'Main Course', price: 13.99 },
  { item: 'Chicken Biryani', category: 'Non-Veg', subCategory: 'Main Course', price: 13.99 },
  { item: 'Prawn Masala', category: 'Non-Veg', subCategory: 'Main Course', price: 15.99 },
  { item: 'Chicken Wings', category: 'Non-Veg', subCategory: 'Snack', price: 7.99 },
  { item: 'Egg Curry', category: 'Non-Veg', subCategory: 'Side Dish', price: 8.99 },
  { item: 'Masala Chai', category: 'Veg', subCategory: 'Beverage', price: 2.49 },
  { item: 'Cold Coffee', category: 'Veg', subCategory: 'Beverage', price: 3.99 },
  { item: 'Mango Lassi', category: 'Veg', subCategory: 'Beverage', price: 4.49 },
  { item: 'Fresh Lime Soda', category: 'Veg', subCategory: 'Beverage', price: 3.49 },
  { item: 'Buttermilk', category: 'Veg', subCategory: 'Beverage', price: 2.99 },
  { item: 'Soft Drink', category: 'Veg', subCategory: 'Beverage', price: 1.99 },
  { item: 'Fresh Orange Juice', category: 'Veg', subCategory: 'Juice', price: 4.99 },
  { item: 'Gulab Jamun', category: 'Veg', subCategory: 'Dessert', price: 3.99 },
  { item: 'Ice Cream', category: 'Veg', subCategory: 'Dessert', price: 3.49 },
  { item: 'Rice Pudding', category: 'Veg', subCategory: 'Dessert', price: 4.49 },
  { item: 'Brownie with Ice Cream', category: 'Veg', subCategory: 'Dessert', price: 5.99 },
];

const extraMenuItems = [
  { item: 'Tandoori Mushroom', category: 'Veg', subCategory: 'Starter', price: 7.99 },
  { item: 'Chilli Paneer', category: 'Veg', subCategory: 'Starter', price: 8.49 },
  { item: 'Veg Manchurian', category: 'Veg', subCategory: 'Snack', price: 6.99 },
  { item: 'Dal Tadka', category: 'Veg', subCategory: 'Main Course', price: 9.49 },
  { item: 'Aloo Gobi', category: 'Veg', subCategory: 'Main Course', price: 9.99 },
  { item: 'Mushroom Biryani', category: 'Veg', subCategory: 'Main Course', price: 11.99 },
  { item: 'Raita', category: 'Veg', subCategory: 'Side Dish', price: 2.99 },
  { item: 'Papadum', category: 'Veg', subCategory: 'Snack', price: 1.99 },
  { item: 'Tandoori Chicken', category: 'Non-Veg', subCategory: 'Starter', price: 10.99 },
  { item: 'Chicken Korma', category: 'Non-Veg', subCategory: 'Main Course', price: 13.99 },
  { item: 'Keema Naan', category: 'Non-Veg', subCategory: 'Roti', price: 4.99 },
  { item: 'Egg Fried Rice', category: 'Non-Veg', subCategory: 'Rice', price: 8.99 },
  { item: 'Chicken Noodles', category: 'Non-Veg', subCategory: 'Main Course', price: 9.99 },
  { item: 'Hot & Sour Soup', category: 'Veg', subCategory: 'Soup', price: 4.49 },
  { item: 'Lemonade', category: 'Veg', subCategory: 'Beverage', price: 2.99 },
  { item: 'Milkshake', category: 'Veg', subCategory: 'Beverage', price: 4.99 },
  { item: 'Falooda', category: 'Veg', subCategory: 'Dessert', price: 5.49 },
  { item: 'Kheer', category: 'Veg', subCategory: 'Dessert', price: 3.99 },
  { item: 'Pav Bhaji', category: 'Veg', subCategory: 'Main Course', price: 8.99 },
  { item: 'Dosa', category: 'Veg', subCategory: 'Main Course', price: 7.99 },
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

const extraSuppliers = [
  { name: 'Continental Delicacies', contactInfo: '555-0113 - 80 Gourmet Ave' },
  { name: 'Local Farmers Collective', contactInfo: '555-0114 - 5 Farm Rd' },
  { name: 'Premium Wines & Spirits', contactInfo: '555-0115 - 200 Vineyard Ln' },
  { name: 'Restaurant Tech Supplies', contactInfo: '555-0116 - 99 Innovation Dr' },
  { name: 'Eco-Packaging Co.', contactInfo: '555-0117 - 50 Green St' },
  { name: 'Gourmet Cheese Imports', contactInfo: '555-0118 - 30 Fromage Blvd' },
  { name: 'Asian Foods Wholesale', contactInfo: '555-0119 - 60 Oriental Ave' },
  { name: 'Coffee & Tea Traders', contactInfo: '555-0120 - 15 Brew Ln' },
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

const extraInventory = [
  'Basil Leaves', 'Mint Leaves', 'Rosemary', 'Thyme', 'Oregano',
  'Balsamic Vinegar', 'Rice Vinegar', 'Fish Sauce', 'Oyster Sauce', 'Sesame Oil',
  'Coconut Milk', 'Tofu', 'Tortillas', 'Pita Bread', 'Baguette',
  'Prosciutto', 'Salami', 'Bacon', 'Sausages', 'Ground Beef',
  'Cheddar Cheese', 'Mozzarella', 'Parmesan', 'Feta Cheese', 'Blue Cheese',
  'Mixed Nuts', 'Peanuts', 'Walnuts', 'Pine Nuts', 'Sunflower Seeds',
  'Dried Apricots', 'Dried Dates', 'Prunes', 'Cranberries', 'Raisins',
  'Canned Tomatoes', 'Canned Corn', 'Canned Beans', 'Olives', 'Capers',
  'Dark Chocolate', 'White Chocolate', 'Cocoa Powder', 'Caramel Sauce', 'Sprinkles',
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
  'Rosa Vela', 'Oscar Zavala', 'Alicia Paredes', 'Raul Cisneros', 'Diana Quintanilla',
  'Alonso Bautista', 'Brenda Ceja', 'Cesar Dorantes', 'Esther Escobar', 'Felipe Fajardo',
  'Graciela Galvan', 'Humberto Herrera', 'Irene Ibarra', 'Jaime Juarez', 'Karla Kuri',
  'Laura Larios', 'Mario Monroy', 'Nadia Nava', 'Octavio Ocampo', 'Perla Ponce',
  'Ramiro Rocha', 'Silvia Solis', 'Tania Trujillo', 'Ulises Urbina', 'Veronica Vega',
  'Wilfrido Wong', 'Xochitl Ximenez', 'Yolanda Yanez', 'Zacarias Zavala', 'Adela Aguayo',
  'Benito Barraza', 'Carolina Caro', 'Dario Duenas', 'Elva Esparza', 'Fausto Fuentes',
  'Gloria Gamez', 'Heriberto Grijalva', 'Ilse Iniguez', 'Joaquin Jaimes', 'Lorena Luevano',
  'Martin Manriquez', 'Nelly Najar', 'Omar Olague', 'Paulina Partida', 'Rogelio Quezada',
  'Socorro Saenz', 'Teodoro Terrazas', 'Ursula Uribe', 'Vicente Villalpando', 'Yadira Yanez',
  'Abel Almaraz', 'Belen Ballesteros', 'Cipriano Cardenas', 'Dulce Davila', 'Erasmo Escalera',
  'Fabiola Fierro', 'German Giron', 'Heliodoro Hidalgo', 'Indira Ibarra', 'Jerónimo Jaramillo',
  'Leticia Lerma', 'Modesto Munguia', 'Nereida Noriega', 'Osvaldo Orosco', 'Pascual Pena',
  'Rebeca Rendon', 'Salomon Sotelo', 'Teresa Trevino', 'Ubaldo Ulloa', 'Vanessa Valdes',
  'Wendy Waite', 'Xavier Xicale', 'Yamileth Yepez', 'Zenaida Zarate', 'Arturo Almonte',
  'Blanca Bermudez',
];

const extraCustomers = [
  'Aaron Acevedo', 'Beatriz Barcenas', 'Camilo Ceballos', 'Dora Delgado',
  'Eduardo Echeverria', 'Flor Favela', 'Gael Galindo', 'Helena Hinojosa',
  'Isaias Icedo', 'Jimena Jara', 'Kevin Kuri', 'Lizbeth Luebbert',
  'Mauricio Manzo', 'Nayeli Naranjo', 'Oliver Ozuna', 'Pamela Pablos',
  'Quetzalli Quinones', 'Rene Robledo', 'Sara Saldivar', 'Tomas Tellez',
  'Unity Uresti', 'Valentin Vaca', 'Yanet Yocupicio', 'Zoe Zuniga',
  'Adrian Alcaraz', 'Brisa Banda', 'Cristofer Carreon', 'Damaris Dominguez',
  'Efrain Escamilla', 'Fatima Fletes', 'Guadalupe Gatica', 'Hector Holguin',
  'Ithan Islas', 'Jazmin Jacquez', 'Kenya Kino', 'Lisandro Leal',
  'Marcos Matamoros', 'Nidia Norzagaray', 'Odalis Ordaz', 'Peter Payan',
  'Rafael Quintero', 'Sugey Sanez', 'Tadeo Talamantes', 'Uriel Urrea',
  'Viviana Valenzuela', 'Yahir Yepez', 'Zulema Zepeda', 'Armando Amaya',
  'Bianca Balli', 'Chuy Cardenas', 'Dania Delabra', 'Erick Escarcega',
  'Florencia Favila', 'Gustavo Gallegos', 'Hilda Holguin', 'Ivan Isordia',
  'Jessica Jelves', 'Kennia Kuri', 'Leobardo Lugo', 'Magda Moncada',
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

  const isAppend = process.argv.includes('--append');

  if (!isAppend) {
    // --clear mode
    console.log('Clearing existing data...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const c of collections) {
      if (c.name !== 'system.indexes') {
        await mongoose.connection.db.dropCollection(c.name);
      }
    }
    await Promise.all([
      Rol.createIndexes(), Persona.createIndexes(), Usuario.createIndexes(),
      Menu.createIndexes(), Supplier.createIndexes(), InventoryItem.createIndexes(),
      Customer.createIndexes(), Order.createIndexes(), Expense.createIndexes(), Purchase.createIndexes(),
    ]);
    console.log('All collections cleared\n');
  }

  // --- Base entities (always created in fresh mode, queried in append mode) ---
  let persona, pid;

  if (isAppend) {
    const existing = await Persona.findOne();
    if (!existing) throw new Error('No Persona found. Run without --append first.');
    persona = existing;
    pid = persona._id;
    console.log(`  Using existing Persona: ${persona.restaurantName}`);
  } else {
    // 1. Rol
    const [rol] = await Rol.create([{ nombre: 'admin', descripcion: 'Administrator' }]);
    console.log(`  1 Rol`);

    // 2. Persona
    [persona] = await Persona.create([{
      ownerName: 'Rajesh Kumar',
      restaurantName: 'Spice Garden Restaurant',
      city: 'Mumbai',
      address: '42 Marine Drive, Colaba',
      mobile: 9876543210,
      currencySymbol: '$',
      taxRate: 10,
      theme: 'light',
    }]);
    pid = persona._id;
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
      personaId: pid, item: m.item, category: m.category,
      subCategory: m.subCategory, price: m.price, availability: Math.random() > 0.1,
    }));
    const menus = await Menu.create(menuDocs);
    console.log(`  ${menus.length} Menu items`);

    // 5. Suppliers
    const supplierDocs = supplierData.map(s => ({ personaId: pid, name: s.name, contactInfo: s.contactInfo }));
    const suppliers = await Supplier.create(supplierDocs);
    console.log(`  ${suppliers.length} Suppliers`);

    // 6. Inventory Items
    const invDocs = inventoryItemNames.map(name => ({
      personaId: pid, name,
      quantity: rand(10, 500),
      price: parseFloat((Math.random() * 40 + 1).toFixed(2)),
      supplier: pick(suppliers.map(s => s._id)),
    }));
    await InventoryItem.create(invDocs);
    console.log(`  ${invDocs.length} Inventory Items`);

    // 7. Customers (first 121 names)
    const cNames = customerNames.slice(0, 121);
    const customerDocs = cNames.map(name => ({
      personaId: pid, name,
      phone: `${rand(600, 999)}${rand(100, 999)}${rand(1000, 9999)}`,
      address: `${rand(1, 999)} ${pick(['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Cedar Ln', 'Maple Dr', 'Park Blvd', 'Lake View', 'Hill Rd', 'River St'])}`,
    }));
    await Customer.create(customerDocs);
    console.log(`  ${customerDocs.length} Customers`);
  }

  // --- Append data (always created) ---

  // Fetch existing references needed for new records
  const existingMenuIds = (await Menu.find({ personaId: pid }, { price: 1 })).map(m => ({ _id: m._id, price: m.price }));
  const existingSupplierIds = (await Supplier.find({ personaId: pid })).map(s => s._id);
  const existingInvItems = await InventoryItem.find({ personaId: pid });

  // Extra Menu items
  let addedMenu = 0;
  if (isAppend && extraMenuItems.length > 0) {
    const existingNames = (await Menu.find({ personaId: pid }, { item: 1 })).map(m => m.item);
    const newItems = extraMenuItems.filter(m => !existingNames.includes(m.item));
    if (newItems.length > 0) {
      const extraMenuDocs = newItems.map(m => ({
        personaId: pid, item: m.item, category: m.category,
        subCategory: m.subCategory, price: m.price, availability: Math.random() > 0.1,
      }));
      const created = await Menu.create(extraMenuDocs);
      created.forEach(m => existingMenuIds.push({ _id: m._id, price: m.price }));
      addedMenu = created.length;
    }
  }
  if (addedMenu > 0) console.log(`  ${addedMenu} Menu items (extra)`);

  // Extra Suppliers
  let addedSuppliers = 0;
  if (isAppend && extraSuppliers.length > 0) {
    const existingNames = (await Supplier.find({ personaId: pid }, { name: 1 })).map(s => s.name);
    const newSuppliers = extraSuppliers.filter(s => !existingNames.includes(s.name));
    if (newSuppliers.length > 0) {
      const docs = newSuppliers.map(s => ({ personaId: pid, name: s.name, contactInfo: s.contactInfo }));
      const created = await Supplier.create(docs);
      created.forEach(s => existingSupplierIds.push(s._id));
      addedSuppliers = created.length;
    }
  }
  if (addedSuppliers > 0) console.log(`  ${addedSuppliers} Suppliers (extra)`);

  // Extra Inventory Items
  let addedInv = 0;
  if (isAppend && extraInventory.length > 0) {
    const existingNames = (await InventoryItem.find({ personaId: pid }, { name: 1 })).map(i => i.name);
    const newInv = extraInventory.filter(n => !existingNames.includes(n));
    if (newInv.length > 0) {
      const docs = newInv.map(name => ({
        personaId: pid, name,
        quantity: rand(10, 500),
        price: parseFloat((Math.random() * 40 + 1).toFixed(2)),
        supplier: pick(existingSupplierIds),
      }));
      const created = await InventoryItem.create(docs);
      created.forEach(i => existingInvItems.push(i));
      addedInv = created.length;
    }
  }
  if (addedInv > 0) console.log(`  ${addedInv} Inventory Items (extra)`);

  // Extra Customers (use remaining names not yet inserted)
  const existingCustomerEmails = new Set((await Customer.find({ personaId: pid }, { name: 1 })).map(c => c.name));
  const allCustomerNames = [...customerNames, ...extraCustomers];
  const unusedNames = allCustomerNames.filter(n => !existingCustomerEmails.has(n));

  const newCustomerDocs = unusedNames.map(name => ({
    personaId: pid, name,
    phone: `${rand(600, 999)}${rand(100, 999)}${rand(1000, 9999)}`,
    address: `${rand(1, 999)} ${pick(['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Cedar Ln', 'Maple Dr', 'Park Blvd', 'Lake View', 'Hill Rd', 'River St'])}`,
  }));
  const newCustomers = newCustomerDocs.length > 0 ? await Customer.create(newCustomerDocs) : [];
  if (newCustomers.length > 0) console.log(`  ${newCustomers.length} Customers (extra)`);

  // Extra Orders (500 new orders)
  const newOrderDocs = [];
  for (let i = 0; i < 500; i++) {
    const itemCount = rand(1, 5);
    const items = [];
    let subtotal = 0;
    for (let j = 0; j < itemCount; j++) {
      const menuItem = pick(existingMenuIds);
      const qty = rand(1, 3);
      items.push({ menuItem: menuItem._id, quantity: qty, price: menuItem.price });
      subtotal += menuItem.price * qty;
    }
    const taxRate = persona.taxRate / 100;
    const tax = parseFloat((subtotal * taxRate).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));
    const typeWeights = Math.random();
    const orderType = typeWeights < 0.5 ? 'dine in' : typeWeights < 0.8 ? 'take away' : 'online';
    newOrderDocs.push({
      personaId: pid, items, taxAmount: tax, totalAmount: total, orderType,
      comment: pick(orderComments), createdAt: randomDate(sixMonthsAgo, today),
    });
  }
  const newOrders = await Order.create(newOrderDocs);
  console.log(`  ${newOrders.length} Orders (extra)`);

  // Link new orders to new customers
  const allCustomers = await Customer.find({ personaId: pid });
  for (const customer of pick(allCustomers, Math.min(newOrders.length, allCustomers.length))) {
    const picked = pick(newOrders);
    customer.orders.push(picked._id);
    await customer.save();
  }
  console.log('  Orders linked to Customers');

  // Extra Expenses (140 new)
  const newExpenseDocs = [];
  for (let i = 0; i < 140; i++) {
    newExpenseDocs.push({
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
  await Expense.create(newExpenseDocs);
  console.log(`  ${newExpenseDocs.length} Expenses (extra)`);

  // Extra Purchases (100 new)
  const newPurchaseDocs = [];
  for (let i = 0; i < 100; i++) {
    const itemCount = rand(1, 4);
    const items = [];
    let totalAmount = 0;
    for (let j = 0; j < itemCount; j++) {
      const invItem = pick(existingInvItems);
      const qty = rand(5, 100);
      const unitPrice = invItem.price;
      const totalPrice = parseFloat((qty * unitPrice).toFixed(2));
      items.push({ itemName: invItem.name, quantity: qty, unitPrice, totalPrice });
      totalAmount += totalPrice;
    }
    newPurchaseDocs.push({
      personaId: pid, supplier: pick(existingSupplierIds), items,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      purchaseDate: randomDate(sixMonthsAgo, today), notes: pick(purchaseNotes),
    });
  }
  await Purchase.create(newPurchaseDocs);
  console.log(`  ${newPurchaseDocs.length} Purchases (extra)\n`);

  // Totals
  const total = await Promise.all([
    Rol.countDocuments(), Persona.countDocuments(), Usuario.countDocuments(),
    Menu.countDocuments(), Supplier.countDocuments(), InventoryItem.countDocuments(),
    Customer.countDocuments(), Order.countDocuments(), Expense.countDocuments(), Purchase.countDocuments(),
  ]);
  const [r, p, u, m, s, inv, c, o, e, pu] = total;
  const grand = total.reduce((a, b) => a + b, 0);

  console.log('========================================');
  console.log(`  Seed completed! Total records: ${grand}`);
  console.log('========================================');
  console.log(`  Rol: ${r}, Persona: ${p}, Usuario: ${u}`);
  console.log(`  Menu: ${m}, Suppliers: ${s}, Inventory: ${inv}`);
  console.log(`  Customers: ${c}, Orders: ${o}, Expenses: ${e}, Purchases: ${pu}`);
  if (!isAppend) {
    console.log('\n  Admin login:');
    console.log('    Email:    admin@spicegarden.com');
    console.log('    Password: admin123');
  }
  console.log();

  await mongoose.disconnect();
}

// -- Support both array-pick and simple pick
const _origPick = pick;
pick = function (arr, count) {
  if (count === undefined) return arr[rand(0, arr.length - 1)];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
