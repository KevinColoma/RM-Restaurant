const writeExemptPaths = ['/api/profile', '/api/pos', '/api/placeorder', '/api/orders', '/api/session'];

function isExempt(path) {
  return writeExemptPaths.some(p => path.startsWith(p));
}

const requireWriteAccess = (req, res, next) => {
  if (isExempt(req.path)) return next();
  if (req.method === 'GET') return next();
  const userRole = req.usuario?.rolId?.nombre;
  if (userRole !== 'admin') {
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ success: false, message: 'Forbidden: write access requires admin role' });
    }
    return res.status(403).send('Forbidden: write access requires admin role');
  }
  next();
};

module.exports = { requireWriteAccess };
