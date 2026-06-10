/** Extra gate for admin panel — requires ADMIN_PANEL_PASSWORD header */
export const adminGate = (req, res, next) => {
  const secret = process.env.ADMIN_PANEL_PASSWORD;
  if (!secret) {
    return res.status(503).json({ success: false, message: 'Admin panel password not configured on server' });
  }
  const provided = req.headers['x-admin-gate'];
  if (provided !== secret) {
    return res.status(403).json({ success: false, message: 'Invalid admin panel password', code: 'ADMIN_GATE' });
  }
  next();
};

export const verifyAdminGate = (req, res) => {
  const secret = process.env.ADMIN_PANEL_PASSWORD;
  if (!secret) {
    return res.status(503).json({ success: false, message: 'ADMIN_PANEL_PASSWORD not set in server .env' });
  }
  if (req.body.password !== secret) {
    return res.status(403).json({ success: false, message: 'Wrong password' });
  }
  res.json({ success: true, message: 'Access granted' });
};
