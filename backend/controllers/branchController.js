const { logAudit } = require('../utils/audit');
const Branch = require('../models/branchRestaurant');

exports.addBranchPage = (req, res) => {
    res.render('add-branch');
}

exports.getBranches = async (req, res) => {
    try {
        const personaId = req.personaId;
        const branches = await Branch.find({ personaId });
        res.render('branches-list', { branches });
    } catch (err) {
        res.status(500).send('Server Error');
    }
}

exports.createBranch = async (req, res) => {
    try {
        const personaId = req.personaId;
        const { Parent_Rest, ownerName, restaurantName, city, address, email, mobile } = req.body;
        const branch = new Branch({ personaId, Parent_Rest, ownerName, restaurantName, city, address, email, mobile });
        await branch.save();
        await logAudit(req, 'create', 'Branch', branch._id, 'Created branch: ' + req.body.restaurantName);
        res.status(201).json(branch);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.getBranchById = async (req, res) => {
    try {
        const personaId = req.personaId;
        const branch = await Branch.findOne({ _id: req.params.id, personaId });
        if (!branch) return res.status(404).json({ error: 'Branch not found' });
        res.json(branch);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.updateBranch = async (req, res) => {
    try {
        const personaId = req.personaId;
        const branch = await Branch.findOneAndUpdate(
            { _id: req.params.id, personaId },
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
        const personaId = req.personaId;
        const branch = await Branch.findOneAndDelete({ _id: req.params.id, personaId });
        if (!branch) return res.status(404).json({ error: 'Branch not found' });
        await logAudit(req, 'delete', 'Branch', branch._id, 'Deleted branch: ' + branch.restaurantName);
        res.json({ message: 'Branch deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
