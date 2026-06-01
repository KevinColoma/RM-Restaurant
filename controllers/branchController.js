const { logAudit } = require('../utils/audit');
const Branch = require('../models/branchRestaurant');

exports.addBranchPage = (req, res) => {
    res.render('add-branch');
}

exports.getBranches = async (req, res) => {
    try {
        const restaurantId = req.restaurant.restaurantId;
        const branches = await Branch.find({ restaurantID: restaurantId });
        res.render('branches-list', { branches });
    } catch (err) {
        res.status(500).send('Server Error');
    }
}

exports.createBranch = async (req, res) => {
    try {
        const restaurantID = req.restaurant.restaurantId;
        const { Parent_Rest, ownerName, restaurantName, city, address, email, mobile } = req.body;
        const branch = new Branch({ restaurantID, Parent_Rest, ownerName, restaurantName, city, address, email, mobile });
        await branch.save();
        await logAudit(req, 'create', 'Branch', branch._id, 'Created branch: ' + req.body.restaurantName);
        res.status(201).json(branch);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.getBranchById = async (req, res) => {
    try {
        const restaurantId = req.restaurant.restaurantId;
        const branch = await Branch.findOne({ _id: req.params.id, restaurantID: restaurantId });
        if (!branch) return res.status(404).json({ error: 'Branch not found' });
        res.json(branch);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.updateBranch = async (req, res) => {
    try {
        const restaurantId = req.restaurant.restaurantId;
        const branch = await Branch.findOneAndUpdate(
            { _id: req.params.id, restaurantID: restaurantId },
            req.body,
            { new: true }
        );
        if (!branch) return res.status(404).json({ error: 'Branch not found' });
        await logAudit(req, 'update', 'Branch', branch._id, 'Updated branch: ' + branch.restaurantName);
        res.json(branch);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.deleteBranch = async (req, res) => {
    try {
        const restaurantId = req.restaurant.restaurantId;
        const branch = await Branch.findOneAndDelete({ _id: req.params.id, restaurantID: restaurantId });
        if (!branch) return res.status(404).json({ error: 'Branch not found' });
        await logAudit(req, 'delete', 'Branch', branch._id, 'Deleted branch: ' + branch.restaurantName);
        res.json({ message: 'Branch deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
