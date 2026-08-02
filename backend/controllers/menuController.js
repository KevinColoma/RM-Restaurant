const Menu = require('../models/menu')
const Customer = require('../models/Customer')
const Persona = require('../models/Persona')
const { logAudit } = require('../utils/audit');
const { isValidObjectId } = require('../utils/validate');

// const getNextCode = async (restaurantId) => {
//     // Find the highest current code for the restaurant
//     const highestCodeDoc = await Menu.findOne({ restaurantId }).sort({ code: -1 }).exec();
//     const highestCode = highestCodeDoc ? highestCodeDoc.code : 0;
//     return highestCode + 1;
// };

const AddMenu = async (req,res)=>{
    const {  item, category, subCategory } = req.body;
    const  personaId= req.personaId
    const price = Number(req.body.price);
    // The SPA submits multipart/form-data, so booleans arrive as strings. Treat
    // both JSON and form bodies the same: default to available unless explicitly false.
    const availableRaw = req.body.available;
    const availability = availableRaw === undefined || availableRaw === true || availableRaw === 'true';
    try {
        const newItem = new Menu({
            personaId,
            item,
            category,
            subCategory,
            price,
            // Store the image as a MongoDB binary blob so it survives Render's
            // ephemeral filesystem. The URL streams the stored bytes back.
            imageData: req.file ? req.file.buffer : null,
            imageMime: req.file ? req.file.mimetype : null,
            availability
        });
        if (req.file) newItem.image = '/api/menu/' + newItem._id + '/image';

        const savedItem = await newItem.save();
        await logAudit(req, 'create', 'Menu', savedItem._id, 'Created menu item: ' + item);
        res.status(201).json(savedItem);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }

}

const GetMenu = async(req,res)=>{
    const personaId = req.personaId;

    try {
        const menus = await Menu.find({ personaId }).select('-imageData -imageMime');
        res.render('item-list', { menus }); // Render 'menu.ejs' and pass 'menus' to it
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
const GetPos = async(req,res)=>{
    const personaId = req.personaId;

    try {
        const menus = await Menu.find({ personaId }).select('-imageData -imageMime');
        const customers = await Customer.find({ personaId }).sort({ name: 1 });
        const persona = await Persona.findById(personaId);
        // Same default PlaceOrder uses when actually charging the order, so
        // this preview can never drift from what gets billed.
        const taxRate = (persona && persona.taxRate != null) ? persona.taxRate : 10;
        res.render('pos', { menus, customers, taxRate });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const UpdateMenu = async (req, res) => {
    const { item, category, subCategory, price, available } = req.body;
    const personaId = req.personaId;

    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
        const updatedItem = await Menu.findOneAndUpdate(
            { _id: req.params.id, personaId },
            { item, category, subCategory, price, availability: available !== undefined ? available : true },
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
    const personaId = req.personaId;

    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
        const deletedItem = await Menu.findOneAndDelete({ _id: req.params.id, personaId });

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