
const Customer = require('../models/Customer')
const { logAudit } = require('../utils/audit');

exports.createCustomers = async function(req,res){

    // console.log(req.body);
    

    try {
        const personaId = req.personaId;
        const { name, phone, address } = req.body;
        const newCustomer = new Customer({ name, phone, address, personaId });
        await newCustomer.save();
        await logAudit(req, 'create', 'Customer', newCustomer._id, 'Created customer: ' + name);
        res.status(201).json(newCustomer);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }

}

exports.getCustomers = async (req, res) => {
    try {
        const personaId = req.personaId;
        const customers = await Customer.find({ personaId }).sort({ createdAt: -1 });
        res.render('customers-list', { customers });
    } catch (err) {
        res.status(500).send('Server Error');
    }
}

exports.deleteCustomer = async (req, res) => {
    try {
        const personaId = req.personaId;
        const customer = await Customer.findOneAndDelete({ _id: req.params.id, personaId });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        await logAudit(req, 'delete', 'Customer', customer._id, 'Deleted customer: ' + customer.name);
        res.json({ message: 'Customer deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateCustomer = async (req, res) => {
  try {
    const personaId = req.personaId;
    const { name, phone, address } = req.body;
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, personaId },
      { name, phone, address },
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    await logAudit(req, 'update', 'Customer', customer._id, 'Updated customer: ' + customer.name);
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};