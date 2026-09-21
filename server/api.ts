import express, { Request, Response, NextFunction } from 'express';
import { query, run } from './db.ts';

const router = express.Router();

// Helper to extract or decode current user session
// For an accessible, rock-solid demo experience, we support token-based Bearer auth,
// demo switcher, and user lookup in SQLite.
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  // Find user by id (token can be user id or signed session)
  const users = query('SELECT id, name, email, role, department, avatar, createdAt FROM users WHERE id = ? OR email = ?', [token, token]);
  return users[0] || null;
}

// Middleware to enforce authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized. Please log in.' });
    return;
  }
  (req as any).user = user;
  next();
}

// Middleware to enforce Role-Based Access Control (RBAC)
function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user || getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        error: `Access denied. Role '${user.role}' does not have permission for this action. Required: ${allowedRoles.join(', ')}`
      });
      return;
    }
    (req as any).user = user;
    next();
  };
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const aliasEmail = normalizedEmail.includes('@toprun.com')
    ? normalizedEmail.replace('@toprun.com', '@robopart.com')
    : normalizedEmail.replace('@robopart.com', '@toprun.com');

  const users = query(
    'SELECT id, name, email, password, role, department, avatar, createdAt FROM users WHERE email = ? OR email = ?',
    [normalizedEmail, aliasEmail]
  );

  const user = users[0];
  if (!user) {
    res.status(401).json({ error: 'User with this email not found' });
    return;
  }

  // Check password (accept password123 or match stored)
  if (!password || (user.password !== password && password !== 'password123')) {
    res.status(401).json({ error: 'Invalid or missing password' });
    return;
  }

  const { password: _, ...userSafe } = user;
  res.json({
    token: user.id,
    user: userSafe
  });
});

router.get('/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user });
});

router.post('/auth/switch-demo', (req: Request, res: Response) => {
  const { role } = req.body;
  const users = query(
    'SELECT id, name, email, role, department, avatar, createdAt FROM users WHERE role = ? LIMIT 1',
    [role]
  );
  if (!users[0]) {
    res.status(404).json({ error: `Demo user for role '${role}' not found` });
    return;
  }
  res.json({
    token: users[0].id,
    user: users[0]
  });
});

// ----------------------------------------------------
// USER MANAGEMENT ROUTES (ADMIN ONLY)
// ----------------------------------------------------

router.get('/users', requireRole(['admin']), (_req: Request, res: Response) => {
  const users = query('SELECT id, name, email, role, department, avatar, createdAt FROM users ORDER BY createdAt ASC');
  res.json({ users });
});

router.post('/users', requireRole(['admin']), (req: Request, res: Response) => {
  const { name, email, role, department, password } = req.body;
  if (!name || !email || !role) {
    res.status(400).json({ error: 'Name, email, and role are required' });
    return;
  }

  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const avatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`;
  const createdAt = new Date().toISOString();

  try {
    run(
      `INSERT INTO users (id, name, email, password, role, department, avatar, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email.toLowerCase(), password || 'password123', role, department || 'Operations', avatar, createdAt]
    );

    res.status(201).json({
      user: { id, name, email: email.toLowerCase(), role, department, avatar, createdAt }
    });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to create user. Email may already exist.' });
  }
});

router.put('/users/:id', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role, department } = req.body;

  try {
    run(
      `UPDATE users SET name = ?, email = ?, role = ?, department = ? WHERE id = ?`,
      [name, email.toLowerCase(), role, department, id]
    );
    const updated = query('SELECT id, name, email, role, department, avatar, createdAt FROM users WHERE id = ?', [id]);
    res.json({ user: updated[0] });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = (req as any).user;
  if (currentUser.id === id) {
    res.status(400).json({ error: 'Cannot delete your own active administrator account' });
    return;
  }

  run('DELETE FROM users WHERE id = ?', [id]);
  res.json({ success: true, message: 'User deleted successfully' });
});

// ----------------------------------------------------
// SPARE PARTS ROUTES
// ----------------------------------------------------

router.get('/parts', (req: Request, res: Response) => {
  const { search, category, status, robotModel, sort, order } = req.query;

  let sql = 'SELECT * FROM parts WHERE 1=1';
  const params: any[] = [];

  if (search) {
    sql += ' AND (name LIKE ? OR partNumber LIKE ? OR robotModel LIKE ? OR supplier LIKE ? OR location LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (category && category !== 'all') {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (robotModel && robotModel !== 'all') {
    sql += ' AND robotModel = ?';
    params.push(robotModel);
  }

  const validSortColumns = ['stockLeft', 'consumed', 'needToOrder', 'name', 'unitCost', 'lastUpdated'];
  const sortCol = validSortColumns.includes(sort as string) ? (sort as string) : 'lastUpdated';
  const sortDirection = order === 'asc' ? 'ASC' : 'DESC';

  sql += ` ORDER BY ${sortCol} ${sortDirection}`;

  const parts = query(sql, params);
  res.json({ parts });
});

router.get('/parts/:id', (req: Request, res: Response) => {
  const parts = query('SELECT * FROM parts WHERE id = ?', [req.params.id]);
  if (!parts[0]) {
    res.status(404).json({ error: 'Part not found' });
    return;
  }
  res.json({ part: parts[0] });
});

// Add new part (Admin & Manager)
router.post('/parts', requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const {
    partNumber,
    name,
    category,
    robotModel,
    description,
    imageUrl,
    stockLeft,
    minThreshold,
    consumed,
    unitCost,
    unit,
    supplier,
    leadTimeDays,
    location
  } = req.body;

  if (!partNumber || !name || !category || !robotModel) {
    res.status(400).json({ error: 'partNumber, name, category, and robotModel are required' });
    return;
  }

  const id = `prt-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 5)}`;
  const stock = Number(stockLeft) || 0;
  const threshold = Number(minThreshold) || 5;
  const totalConsumed = Number(consumed) || 0;
  const cost = Number(unitCost) || 0.0;
  const unitName = unit || 'pcs';
  const lead = Number(leadTimeDays) || 7;

  // Calculate status & needToOrder
  let status = 'in_stock';
  let needToOrder = 0;
  if (stock === 0) {
    status = 'critical';
    needToOrder = threshold * 2;
  } else if (stock <= threshold) {
    status = stock <= Math.floor(threshold / 2) ? 'critical' : 'low_stock';
    needToOrder = (threshold * 2) - stock;
  }

  const now = new Date().toISOString();
  const defaultImg = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80';

  try {
    run(
      `INSERT INTO parts (
        id, partNumber, name, category, robotModel, description, imageUrl,
        stockLeft, minThreshold, consumed, needToOrder, unitCost, unit, supplier,
        leadTimeDays, location, status, lastUpdated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, partNumber, name, category, robotModel, description || '', imageUrl || defaultImg,
        stock, threshold, totalConsumed, needToOrder, cost, unitName, supplier || 'Global Robotics Supply',
        lead, location || 'General Warehouse', status, now
      ]
    );

    const user = (req as any).user;
    run(
      `INSERT INTO inventory_logs (id, partId, partNumber, partName, type, quantity, performedBy, notes, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [`log-${Date.now()}`, id, partNumber, name, 'adjusted', stock, `${user.name} (${user.role})`, `Added new part SKU to catalog (${stock} ${unitName})`, now]
    );

    const created = query('SELECT * FROM parts WHERE id = ?', [id]);
    res.status(201).json({ part: created[0] });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to create part. Part number might already exist.' });
  }
});

// Update part (Admin & Manager)
router.put('/parts/:id', requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = query('SELECT * FROM parts WHERE id = ?', [id]);
  if (!existing[0]) {
    res.status(404).json({ error: 'Part not found' });
    return;
  }

  const {
    partNumber,
    name,
    category,
    robotModel,
    description,
    imageUrl,
    stockLeft,
    minThreshold,
    unitCost,
    unit,
    supplier,
    leadTimeDays,
    location
  } = req.body;

  const stock = Number(stockLeft) !== undefined && !isNaN(Number(stockLeft)) ? Number(stockLeft) : existing[0].stockLeft;
  const threshold = Number(minThreshold) !== undefined && !isNaN(Number(minThreshold)) ? Number(minThreshold) : existing[0].minThreshold;
  const unitName = unit !== undefined ? unit : (existing[0].unit || 'pcs');

  let status = existing[0].status;
  let needToOrder = existing[0].needToOrder;

  if (stock === 0) {
    status = 'critical';
    needToOrder = Math.max(threshold * 2, 5);
  } else if (stock <= threshold) {
    status = stock <= Math.floor(threshold / 2) ? 'critical' : 'low_stock';
    needToOrder = Math.max(0, (threshold * 2) - stock);
  } else {
    status = 'in_stock';
    needToOrder = 0;
  }

  const now = new Date().toISOString();

  run(
    `UPDATE parts SET
      partNumber = ?, name = ?, category = ?, robotModel = ?, description = ?,
      imageUrl = ?, stockLeft = ?, minThreshold = ?, needToOrder = ?, unitCost = ?,
      unit = ?, supplier = ?, leadTimeDays = ?, location = ?, status = ?, lastUpdated = ?
     WHERE id = ?`,
    [
      partNumber || existing[0].partNumber,
      name || existing[0].name,
      category || existing[0].category,
      robotModel || existing[0].robotModel,
      description !== undefined ? description : existing[0].description,
      imageUrl || existing[0].imageUrl,
      stock,
      threshold,
      needToOrder,
      Number(unitCost) !== undefined && !isNaN(Number(unitCost)) ? Number(unitCost) : existing[0].unitCost,
      unitName,
      supplier || existing[0].supplier,
      Number(leadTimeDays) || existing[0].leadTimeDays,
      location || existing[0].location,
      status,
      now,
      id
    ]
  );

  // If stock count changed, record an adjustment audit log
  const user = (req as any).user;
  if (stock !== existing[0].stockLeft) {
    const diff = stock - existing[0].stockLeft;
    run(
      `INSERT INTO inventory_logs (id, partId, partNumber, partName, type, quantity, performedBy, notes, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `log-${Date.now()}`,
        id,
        partNumber || existing[0].partNumber,
        name || existing[0].name,
        'adjusted',
        Math.abs(diff),
        `${user.name} (${user.role})`,
        `Stock count modified directly: ${existing[0].stockLeft} -> ${stock} ${unitName} (${diff > 0 ? '+' : ''}${diff})`,
        now
      ]
    );
  }

  const updated = query('SELECT * FROM parts WHERE id = ?', [id]);
  res.json({ part: updated[0] });
});

// Delete part (Admin only)
router.delete('/parts/:id', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  run('DELETE FROM parts WHERE id = ?', [id]);
  run('DELETE FROM alerts WHERE partId = ?', [id]);
  res.json({ success: true, message: 'Part deleted successfully' });
});

// Consume / Use stock (Admin, Manager, Technician)
router.post('/parts/:id/consume', requireRole(['admin', 'manager', 'technician']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity, notes } = req.body;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const parts = query('SELECT * FROM parts WHERE id = ?', [id]);
  const part = parts[0];
  if (!part) {
    res.status(404).json({ error: 'Part not found' });
    return;
  }

  if (part.stockLeft < qty) {
    res.status(400).json({
      error: `Insufficient stock. Current stock is ${part.stockLeft}, but ${qty} was requested.`
    });
    return;
  }

  const newStock = part.stockLeft - qty;
  const newConsumed = part.consumed + qty;
  const now = new Date().toISOString();

  // Recalculate status and need to order
  let newStatus = 'in_stock';
  let needToOrder = 0;

  if (newStock === 0) {
    newStatus = 'critical';
    needToOrder = Math.max(part.minThreshold * 2, 5);
  } else if (newStock <= part.minThreshold) {
    newStatus = newStock <= Math.floor(part.minThreshold / 2) ? 'critical' : 'low_stock';
    needToOrder = Math.max(0, (part.minThreshold * 2) - newStock);
  }

  run(
    `UPDATE parts SET stockLeft = ?, consumed = ?, needToOrder = ?, status = ?, lastUpdated = ? WHERE id = ?`,
    [newStock, newConsumed, needToOrder, newStatus, now, id]
  );

  const user = (req as any).user;
  const performedBy = `${user.name} (${user.role.charAt(0).toUpperCase() + user.role.slice(1)})`;

  // Log inventory event
  run(
    `INSERT INTO inventory_logs (id, partId, partNumber, partName, type, quantity, performedBy, notes, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `log-${Date.now()}`,
      part.id,
      part.partNumber,
      part.name,
      'consumed',
      qty,
      performedBy,
      notes || `Consumed ${qty} unit(s) for robot maintenance`,
      now
    ]
  );

  // Trigger alert if low stock or critical
  if (newStatus === 'critical' || newStatus === 'low_stock') {
    const alertId = `alt-${Date.now()}`;
    const severity = newStatus === 'critical' ? 'critical' : 'warning';
    const alertTitle = newStock === 0 ? `Stock Depleted (0 left)` : `Low Stock Alert (${newStock} remaining)`;
    const alertMsg = `Part ${part.partNumber} - ${part.name} is now at ${newStock} unit(s) (threshold: ${part.minThreshold}). Recommended reorder: ${needToOrder} units.`;

    run(
      `INSERT INTO alerts (id, partId, partNumber, partName, severity, title, message, isResolved, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [alertId, part.id, part.partNumber, part.name, severity, alertTitle, alertMsg, now]
    );
  }

  const updated = query('SELECT * FROM parts WHERE id = ?', [id]);
  res.json({
    success: true,
    part: updated[0],
    message: `Successfully logged ${qty} unit(s) consumed. New stock: ${newStock}`
  });
});

// Restock parts (Admin & Manager)
router.post('/parts/:id/restock', requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity, notes } = req.body;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const parts = query('SELECT * FROM parts WHERE id = ?', [id]);
  const part = parts[0];
  if (!part) {
    res.status(404).json({ error: 'Part not found' });
    return;
  }

  const newStock = part.stockLeft + qty;
  const now = new Date().toISOString();

  let newStatus = 'in_stock';
  let needToOrder = 0;
  if (newStock <= part.minThreshold) {
    newStatus = newStock <= Math.floor(part.minThreshold / 2) ? 'critical' : 'low_stock';
    needToOrder = Math.max(0, (part.minThreshold * 2) - newStock);
  }

  run(
    `UPDATE parts SET stockLeft = ?, needToOrder = ?, status = ?, lastUpdated = ? WHERE id = ?`,
    [newStock, needToOrder, newStatus, now, id]
  );

  const user = (req as any).user;
  const performedBy = `${user.name} (${user.role.charAt(0).toUpperCase() + user.role.slice(1)})`;

  run(
    `INSERT INTO inventory_logs (id, partId, partNumber, partName, type, quantity, performedBy, notes, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `log-${Date.now()}`,
      part.id,
      part.partNumber,
      part.name,
      'restocked',
      qty,
      performedBy,
      notes || `Restocked ${qty} units via replenishment`,
      now
    ]
  );

  // If restored above threshold, resolve pending alerts for this part
  if (newStock > part.minThreshold) {
    run('UPDATE alerts SET isResolved = 1 WHERE partId = ? AND isResolved = 0', [id]);
  }

  const updated = query('SELECT * FROM parts WHERE id = ?', [id]);
  res.json({
    success: true,
    part: updated[0],
    message: `Restocked ${qty} units. Current stock: ${newStock}`
  });
});

// Reorder part (Admin & Manager)
router.post('/parts/:id/reorder', requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity, supplier } = req.body;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const parts = query('SELECT * FROM parts WHERE id = ?', [id]);
  const part = parts[0];
  if (!part) {
    res.status(404).json({ error: 'Part not found' });
    return;
  }

  const user = (req as any).user;
  const orderNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderId = `ord-${Date.now()}`;
  const totalCost = qty * part.unitCost;
  const now = new Date().toISOString();

  run(
    `INSERT INTO reorder_orders (id, orderNumber, partId, partNumber, partName, quantity, status, supplier, totalCost, orderedBy, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderId,
      orderNumber,
      part.id,
      part.partNumber,
      part.name,
      qty,
      'pending',
      supplier || part.supplier,
      totalCost,
      `${user.name} (${user.role})`,
      now
    ]
  );

  run('UPDATE parts SET status = ? WHERE id = ? AND status = ?', ['reorder_placed', id, 'critical']);

  res.status(201).json({
    success: true,
    order: {
      id: orderId,
      orderNumber,
      partId: part.id,
      partNumber: part.partNumber,
      partName: part.name,
      quantity: qty,
      status: 'pending',
      totalCost,
      supplier: supplier || part.supplier
    },
    message: `Purchase Order ${orderNumber} created for ${qty}x ${part.name}`
  });
});

// ----------------------------------------------------
// ALERTS & NOTIFICATIONS
// ----------------------------------------------------

router.get('/alerts', (_req: Request, res: Response) => {
  const alerts = query('SELECT * FROM alerts ORDER BY createdAt DESC');
  res.json({ alerts });
});

router.put('/alerts/:id/resolve', requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  run('UPDATE alerts SET isResolved = 1 WHERE id = ?', [id]);
  res.json({ success: true, message: 'Alert marked as resolved' });
});

// ----------------------------------------------------
// AUDIT LOGS
// ----------------------------------------------------

router.get('/inventory/logs', (req: Request, res: Response) => {
  const { partId } = req.query;
  let sql = 'SELECT * FROM inventory_logs';
  const params: any[] = [];
  if (partId) {
    sql += ' WHERE partId = ?';
    params.push(partId);
  }
  sql += ' ORDER BY timestamp DESC LIMIT 200';
  const logs = query(sql, params);
  res.json({ logs });
});

// ----------------------------------------------------
// REORDERS LIST & STATUS
// ----------------------------------------------------

router.get('/reorders', (_req: Request, res: Response) => {
  const orders = query('SELECT * FROM reorder_orders ORDER BY createdAt DESC');
  res.json({ orders });
});

router.put('/reorders/:id/status', requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ['pending', 'approved', 'shipped', 'received'];
  if (!valid.includes(status)) {
    res.status(400).json({ error: 'Invalid order status' });
    return;
  }

  run('UPDATE reorder_orders SET status = ? WHERE id = ?', [status, id]);

  // If marked as received, automatically restock the part
  if (status === 'received') {
    const orders = query('SELECT * FROM reorder_orders WHERE id = ?', [id]);
    const order = orders[0];
    if (order) {
      const parts = query('SELECT * FROM parts WHERE id = ?', [order.partId]);
      const part = parts[0];
      if (part) {
        const newStock = part.stockLeft + order.quantity;
        const newStatus = newStock > part.minThreshold ? 'in_stock' : (newStock <= Math.floor(part.minThreshold / 2) ? 'critical' : 'low_stock');
        const needToOrder = Math.max(0, (part.minThreshold * 2) - newStock);
        const now = new Date().toISOString();

        run(
          `UPDATE parts SET stockLeft = ?, needToOrder = ?, status = ?, lastUpdated = ? WHERE id = ?`,
          [newStock, needToOrder, newStatus, now, part.id]
        );

        run(
          `INSERT INTO inventory_logs (id, partId, partNumber, partName, type, quantity, performedBy, notes, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `log-${Date.now()}`,
            part.id,
            part.partNumber,
            part.name,
            'restocked',
            order.quantity,
            'Procurement System (Auto-receive PO)',
            `PO ${order.orderNumber} delivered and auto-stocked`,
            now
          ]
        );
      }
    }
  }

  res.json({ success: true, message: `Order status updated to ${status}` });
});

// ----------------------------------------------------
// DASHBOARD STATS & METRICS
// ----------------------------------------------------

router.get('/dashboard/stats', (_req: Request, res: Response) => {
  const allParts = query('SELECT * FROM parts');
  const activeAlerts = query('SELECT * FROM alerts WHERE isResolved = 0');
  const pendingOrders = query('SELECT * FROM reorder_orders WHERE status != ?', ['received']);

  let totalParts = allParts.length;
  let totalStockLeft = 0;
  let totalConsumed = 0;
  let lowStockCount = 0;
  let criticalCount = 0;
  let totalInventoryValue = 0;

  const categoryMap: Record<string, { count: number; stock: number; consumed: number }> = {};
  const statusMap: Record<string, number> = {
    in_stock: 0,
    low_stock: 0,
    critical: 0,
    reorder_placed: 0
  };

  for (const p of allParts) {
    totalStockLeft += p.stockLeft;
    totalConsumed += p.consumed;
    totalInventoryValue += (p.stockLeft * p.unitCost);

    if (p.status === 'low_stock') lowStockCount++;
    if (p.status === 'critical') criticalCount++;

    statusMap[p.status] = (statusMap[p.status] || 0) + 1;

    if (!categoryMap[p.category]) {
      categoryMap[p.category] = { count: 0, stock: 0, consumed: 0 };
    }
    categoryMap[p.category].count += 1;
    categoryMap[p.category].stock += p.stockLeft;
    categoryMap[p.category].consumed += p.consumed;
  }

  const categoryDistribution = Object.entries(categoryMap).map(([category, data]) => ({
    category,
    count: data.count,
    stock: data.stock,
    consumed: data.consumed
  }));

  const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count
  }));

  // Realistic monthly trend for interactive charts
  const monthlyConsumption = [
    { month: 'Sep', units: 28, cost: 24500 },
    { month: 'Oct', units: 34, cost: 31200 },
    { month: 'Nov', units: 41, cost: 38400 },
    { month: 'Dec', units: 39, cost: 35900 },
    { month: 'Jan', units: 48, cost: 46100 },
    { month: 'Feb', units: 52, cost: 49800 }
  ];

  res.json({
    totalParts,
    totalStockLeft,
    totalConsumed,
    lowStockCount,
    criticalCount,
    totalInventoryValue,
    pendingOrdersCount: pendingOrders.length,
    activeAlertsCount: activeAlerts.length,
    categoryDistribution,
    statusDistribution,
    monthlyConsumption
  });
});

// ----------------------------------------------------
// EXPORTS DATA ROUTE
// ----------------------------------------------------

router.get('/reports/export', (req: Request, res: Response) => {
  const format = (req.query.format as string) || 'json';
  const parts = query('SELECT * FROM parts ORDER BY name ASC');

  if (format === 'csv') {
    const headers = [
      'Part Number',
      'Name',
      'Category',
      'Robot Model',
      'Stock Left',
      'Consumed',
      'Min Threshold',
      'Need To Order',
      'Unit Cost (USD)',
      'Total Value (USD)',
      'Status',
      'Location',
      'Supplier'
    ];

    const rows = parts.map(p => [
      `"${p.partNumber}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.robotModel}"`,
      p.stockLeft,
      p.consumed,
      p.minThreshold,
      p.needToOrder,
      p.unitCost.toFixed(2),
      (p.stockLeft * p.unitCost).toFixed(2),
      `"${p.status}"`,
      `"${p.location}"`,
      `"${p.supplier}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="robopart-inventory-report.csv"');
    res.send(csvContent);
    return;
  }

  res.json({ parts, exportedAt: new Date().toISOString() });
});

export default router;
