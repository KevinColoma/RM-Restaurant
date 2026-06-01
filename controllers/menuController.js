const Menu = require('../models/menu')
const Customer = require('../models/Customer')
const { logAudit } = require('../utils/audit');

// const getNextCode = async (restaurantId) => {
//     // Find the highest current code for the restaurant
//     const highestCodeDoc = await Menu.findOne({ restaurantId }).sort({ code: -1 }).exec();
//     const highestCode = highestCodeDoc ? highestCodeDoc.code : 0;
//     return highestCode + 1;
// };

const AddMenu = async (req,res)=>{
    const {  item, category, subCategory, price } = req.body;
   const  restaurantId= req.restaurant.restaurantId
//  console.log(restaurantId,item, category, subCategory, price);
    try {
        // const code = await getNextCode(restaurantId);

        const newItem = new Menu({
            restaurantId,
            item,
            category,
            subCategory,
            price,
            // code
        });

        const savedItem = await newItem.save();
        await logAudit(req, 'create', 'Menu', savedItem._id, 'Created menu item: ' + item);
        res.status(201).json(savedItem);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }

}

const GetMenu = async(req,res)=>{
    const restaurantId = req.restaurant.restaurantId; // Assuming `req.restaurant` is set by authentication middleware

    try {
        const menus = await Menu.find({ restaurantId });
        res.render('item-list', { menus }); // Render 'menu.ejs' and pass 'menus' to it
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
const GetPos = async(req,res)=>{
    const restaurantId = req.restaurant.restaurantId;

    try {
        const menus = await Menu.find({ restaurantId });
        const customers = await Customer.find({ restaurantId }).sort({ name: 1 });
        res.render('pos', { menus, customers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const UpdateMenu = async (req, res) => {
    const { item, category, subCategory, price } = req.body;
    const restaurantId = req.restaurant.restaurantId;

    try {
        const updatedItem = await Menu.findOneAndUpdate(
            { _id: req.params.id, restaurantId },
            { item, category, subCategory, price },
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        await logAudit(req, 'update', 'Menu', updatedItem._id, 'Updated menu item: ' + item);
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

const DeleteMenu = async (req, res) => {
    const restaurantId = req.restaurant.restaurantId;

    try {
        const deletedItem = await Menu.findOneAndDelete({ _id: req.params.id, restaurantId });

        if (!deletedItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        await logAudit(req, 'delete', 'Menu', deletedItem._id, 'Deleted menu item: ' + deletedItem.item);
        res.json({ message: 'Menu item deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports={ AddMenu,GetMenu,GetPos, UpdateMenu, DeleteMenu

}