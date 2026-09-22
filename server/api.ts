import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { query, run, getDb, getOrCreateCategory, getOrCreateLocation } from './db.ts';

const router = express.Router();

// Server-side uploads storage directory with serverless fallback
function getUploadsDir(): string {
  const standardDir = path.join(process.cwd(), 'uploads');
  const tmpDir = path.join('/tmp', 'uploads');
  try {
    if (!fs.existsSync(standardDir)) {
      fs.mkdirSync(standardDir, { recursive: true });
    }
    return standardDir;
  } catch {
    if (!fs.existsSync(tmpDir)) {
      try { fs.mkdirSync(tmpDir, { recursive: true }); } catch {}
    }
    return tmpDir;
  }
}
const uploadsDir = getUploadsDir();

// Configure multer file handler for server storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `part-${cleanBase || 'img'}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, SVG, GIF) are allowed'));
    }
  }
});

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

/**
 * Synchronizes notifications and stock alerts directly from the live database.
 * Ensures the `alerts` table strictly reflects current inventory items and counts.
 */
export function syncAlertsWithDatabase() {
  try {
    const parts = query(`
      SELECT p.*, c.name as category, l.name as location
      FROM parts p
      LEFT JOIN categories c ON p.categoryId = c.id
      LEFT JOIN locations l ON p.locationId = l.id
    `);
    const validPartIds = new Set(parts.map(p => p.id));

    // 1. Clean up stale alerts for parts that no longer exist in the database
    const existingAlerts = query('SELECT * FROM alerts');
    for (const alt of existingAlerts) {
      if (!validPartIds.has(alt.partId)) {
        run('DELETE FROM alerts WHERE id = ?', [alt.id]);
      }
    }

    const now = new Date().toISOString();

    // 2. Synchronize active alerts for all inventory items in the database
    for (const part of parts) {
      const stock = Number(part.stockLeft) || 0;
      const threshold = Number(part.minThreshold) || 0;

      if (stock <= threshold) {
        const isCritical = stock === 0 || stock <= Math.floor(threshold / 2);
        const severity = isCritical ? 'critical' : 'warning';
        const title = stock === 0
          ? `Stock Depleted: ${part.partNumber}`
          : isCritical
          ? `Critical Low Stock: ${part.partNumber} (${stock} left)`
          : `Low Stock Alert: ${part.partNumber} (${stock} left)`;

        const locText = part.location ? ` at ${part.location}` : '';
        const message = `${part.name} (Item #${part.partNumber}) has ${stock} in stock${locText}, which is at or below the minimum threshold of ${threshold}.`;

        const existing = query('SELECT * FROM alerts WHERE partId = ? ORDER BY createdAt DESC', [part.id]);
        const active = existing.find(a => a.isResolved === 0);

        if (active) {
          // Update details to match current database values
          run(
            `UPDATE alerts SET partNumber = ?, partName = ?, severity = ?, title = ?, message = ? WHERE id = ?`,
            [part.partNumber, part.name, severity, title, message, active.id]
          );
        } else if (existing.length === 0) {
          // Create new active alert from database item
          const alertId = `alt-${part.id}-${Date.now()}`;
          run(
            `INSERT INTO alerts (id, partId, partNumber, partName, severity, title, message, isResolved, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
            [alertId, part.id, part.partNumber, part.name, severity, title, message, now]
          );
        }
      } else {
        // Stock is healthy and restored above threshold; resolve any active alerts for this part
        run('UPDATE alerts SET isResolved = 1 WHERE partId = ? AND isResolved = 0', [part.id]);
      }
    }
  } catch (err) {
    console.error('Error synchronizing alerts with database:', err);
  }
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

router.put('/auth/profile', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { name, email, department, avatar } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  if (!email || !email.trim()) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if email is already taken by another account
  const existing = query('SELECT id FROM users WHERE email = ? AND id != ?', [normalizedEmail, currentUser.id]);
  if (existing.length > 0) {
    res.status(400).json({ error: 'Email address is already in use by another account' });
    return;
  }

  try {
    const finalAvatar = avatar !== undefined ? (avatar ? avatar.trim() : '') : (currentUser.avatar || '');
    const finalDept = department !== undefined ? department.trim() : (currentUser.department || 'Operations');

    run(
      `UPDATE users SET name = ?, email = ?, department = ?, avatar = ? WHERE id = ?`,
      [name.trim(), normalizedEmail, finalDept, finalAvatar, currentUser.id]
    );

    const updated = query(
      'SELECT id, name, email, role, department, avatar, createdAt FROM users WHERE id = ?',
      [currentUser.id]
    );

    res.json({
      success: true,
      user: updated[0],
      message: 'Profile details updated successfully'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

router.put('/auth/change-password', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword) {
    res.status(400).json({ error: 'Current password is required' });
    return;
  }
  if (!newPassword || newPassword.trim().length < 4) {
    res.status(400).json({ error: 'New password must be at least 4 characters long' });
    return;
  }

  const users = query('SELECT password FROM users WHERE id = ?', [currentUser.id]);
  const userRecord = users[0];
  if (!userRecord) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (userRecord.password !== currentPassword && currentPassword !== 'password123') {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  try {
    run('UPDATE users SET password = ? WHERE id = ?', [newPassword, currentUser.id]);
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update password' });
  }
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
  const avatar = '';
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
// CATEGORIES & LOCATIONS (RELATIONAL ENFORCEMENT)
// ----------------------------------------------------

router.get('/categories', (_req: Request, res: Response) => {
  const categories = query('SELECT id, name, createdAt FROM categories ORDER BY name ASC');
  res.json({ categories });
});

router.post('/categories', requireRole(['admin', 'manager', 'technician']), (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }
  const db = getDb();
  const id = getOrCreateCategory(db, name.trim());
  const rows = query('SELECT id, name, createdAt FROM categories WHERE id = ?', [id]);
  res.status(201).json({ category: rows[0] });
});

router.get('/locations', (_req: Request, res: Response) => {
  const locations = query('SELECT id, name, createdAt FROM locations ORDER BY name ASC');
  res.json({ locations });
});

router.post('/locations', requireRole(['admin', 'manager', 'technician']), (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Location name is required' });
    return;
  }
  const db = getDb();
  const id = getOrCreateLocation(db, name.trim());
  const rows = query('SELECT id, name, createdAt FROM locations WHERE id = ?', [id]);
  res.status(201).json({ location: rows[0] });
});

// ----------------------------------------------------
// SPARE PARTS ROUTES
// ----------------------------------------------------

function getPartById(id: string) {
  const parts = query(`
    SELECT 
      p.id, p.partNumber, p.name, p.description,
      p.categoryId, COALESCE(c.name, 'Uncategorized') as category,
      p.locationId, COALESCE(l.name, 'Unassigned') as location,
      p.minThreshold, p.imageUrl, p.unitCost, p.stockLeft, p.status, p.lastUpdated
    FROM parts p
    LEFT JOIN categories c ON p.categoryId = c.id
    LEFT JOIN locations l ON p.locationId = l.id
    WHERE p.id = ?
  `, [id]);
  return parts[0] || null;
}

router.get('/parts', (req: Request, res: Response) => {
  const { search, category, location, status, sort, order } = req.query;

  let sql = `
    SELECT 
      p.id, p.partNumber, p.name, p.description,
      p.categoryId, COALESCE(c.name, 'Uncategorized') as category,
      p.locationId, COALESCE(l.name, 'Unassigned') as location,
      p.minThreshold, p.imageUrl, p.unitCost, p.stockLeft, p.status, p.lastUpdated
    FROM parts p
    LEFT JOIN categories c ON p.categoryId = c.id
    LEFT JOIN locations l ON p.locationId = l.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    sql += ' AND (p.name LIKE ? OR p.partNumber LIKE ? OR p.description LIKE ? OR c.name LIKE ? OR l.name LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (category && category !== 'all') {
    sql += ' AND (p.categoryId = ? OR c.name = ?)';
    params.push(category, category);
  }

  if (location && location !== 'all') {
    sql += ' AND (p.locationId = ? OR l.name = ?)';
    params.push(location, location);
  }

  if (status && status !== 'all') {
    sql += ' AND p.status = ?';
    params.push(status);
  }

  const validSortColumns: Record<string, string> = {
    stockLeft: 'p.stockLeft',
    name: 'p.name',
    unitCost: 'p.unitCost',
    minThreshold: 'p.minThreshold',
    lastUpdated: 'p.lastUpdated',
    partNumber: 'p.partNumber',
    category: 'c.name',
    location: 'l.name'
  };
  const sortCol = validSortColumns[sort as string] || 'p.lastUpdated';
  const sortDirection = order === 'asc' ? 'ASC' : 'DESC';

  sql += ` ORDER BY ${sortCol} ${sortDirection}`;

  const parts = query(sql, params);
  res.json({ parts });
});

router.get('/parts/:id', (req: Request, res: Response) => {
  const part = getPartById(req.params.id);
  if (!part) {
    res.status(404).json({ error: 'Part not found' });
    return;
  }
  res.json({ part });
});

// Add new part (Admin & Manager)
router.post('/parts', requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const {
    partNumber,
    name,
    description,
    categoryId,
    category,
    locationId,
    location,
    minThreshold,
    imageUrl,
    unitCost,
    stockLeft
  } = req.body;

  if (!partNumber || !name) {
    res.status(400).json({ error: 'Item number (partNumber) and Item Name (name) are required' });
    return;
  }

  const db = getDb();

  // Resolve relational Category (no duplicates)
  let finalCatId = categoryId;
  if (!finalCatId && category) {
    finalCatId = getOrCreateCategory(db, category);
  } else if (category && !finalCatId) {
    finalCatId = getOrCreateCategory(db, category);
  } else if (category && finalCatId) {
    const catCheck = query('SELECT id FROM categories WHERE id = ?', [finalCatId]);
    if (!catCheck[0]) {
      finalCatId = getOrCreateCategory(db, category);
    }
  }
  if (!finalCatId) {
    finalCatId = getOrCreateCategory(db, 'General Category');
  }

  // Resolve relational Location (no duplicates)
  let finalLocId = locationId;
  if (!finalLocId && location) {
    finalLocId = getOrCreateLocation(db, location);
  } else if (location && !finalLocId) {
    finalLocId = getOrCreateLocation(db, location);
  } else if (location && finalLocId) {
    const locCheck = query('SELECT id FROM locations WHERE id = ?', [finalLocId]);
    if (!locCheck[0]) {
      finalLocId = getOrCreateLocation(db, location);
    }
  }
  if (!finalLocId) {
    finalLocId = getOrCreateLocation(db, 'General Storage');
  }

  const id = `prt-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 5)}`;
  const stock = Number(stockLeft) || 0;
  const threshold = Number(minThreshold) || 5;
  const cost = Number(unitCost) || 0.0;

  // Calculate status
  let status = 'in_stock';
  if (stock === 0) {
    status = 'critical';
  } else if (stock <= threshold) {
    status = stock <= Math.floor(threshold / 2) ? 'critical' : 'low_stock';
  }

  const now = new Date().toISOString();
  const defaultImg = '';

  try {
    run(
      `INSERT INTO parts (
        id, partNumber, name, description, categoryId, locationId,
        minThreshold, imageUrl, unitCost, stockLeft, status, lastUpdated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, partNumber.trim(), name.trim(), description || '', finalCatId, finalLocId,
        threshold, imageUrl || defaultImg, cost, stock, status, now
      ]
    );

    const user = (req as any).user;
    run(
      `INSERT INTO inventory_logs (id, partId, partNumber, partName, type, quantity, performedBy, notes, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [`log-${Date.now()}`, id, partNumber, name, 'adjusted', stock, `${user.name} (${user.role})`, `Added new item #${partNumber} to catalog (${stock} in stock)`, now]
    );

    const created = getPartById(id);
    syncAlertsWithDatabase();
    res.status(201).json({ part: created });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to create part. Item number might already exist.' });
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
    description,
    categoryId,
    category,
    locationId,
    location,
    minThreshold,
    imageUrl,
    unitCost,
    stockLeft
  } = req.body;

  const db = getDb();

  // Resolve category if provided
  let finalCatId = existing[0].categoryId;
  if (categoryId) {
    finalCatId = categoryId;
  } else if (category) {
    finalCatId = getOrCreateCategory(db, category);
  }

  // Resolve location if provided
  let finalLocId = existing[0].locationId;
  if (locationId) {
    finalLocId = locationId;
  } else if (location) {
    finalLocId = getOrCreateLocation(db, location);
  }

  const stock = Number(stockLeft) !== undefined && !isNaN(Number(stockLeft)) ? Number(stockLeft) : existing[0].stockLeft;
  const threshold = Number(minThreshold) !== undefined && !isNaN(Number(minThreshold)) ? Number(minThreshold) : existing[0].minThreshold;

  let status = existing[0].status;
  if (stock === 0) {
    status = 'critical';
  } else if (stock <= threshold) {
    status = stock <= Math.floor(threshold / 2) ? 'critical' : 'low_stock';
  } else {
    status = 'in_stock';
  }

  const now = new Date().toISOString();

  run(
    `UPDATE parts SET
      partNumber = ?, name = ?, description = ?, categoryId = ?, locationId = ?,
      minThreshold = ?, imageUrl = ?, unitCost = ?, stockLeft = ?, status = ?, lastUpdated = ?
     WHERE id = ?`,
    [
      partNumber ? partNumber.trim() : existing[0].partNumber,
      name ? name.trim() : existing[0].name,
      description !== undefined ? description : existing[0].description,
      finalCatId,
      finalLocId,
      threshold,
      imageUrl || existing[0].imageUrl,
      Number(unitCost) !== undefined && !isNaN(Number(unitCost)) ? Number(unitCost) : existing[0].unitCost,
      stock,
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
        `Stock modified: ${existing[0].stockLeft} -> ${stock} (${diff > 0 ? '+' : ''}${diff})`,
        now
      ]
    );
  }

  syncAlertsWithDatabase();
  const updated = getPartById(id);
  res.json({ part: updated });
});

// Delete part (Admin and Manager)
router.delete('/parts/:id', requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const existingParts = query('SELECT * FROM parts WHERE id = ?', [id]);
    const part = existingParts[0];

    const user = (req as any).user;
    if (part) {
      const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      run(
        `INSERT INTO inventory_logs (id, partId, partNumber, partName, type, quantity, performedBy, notes, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logId,
          part.id,
          part.partNumber,
          part.name,
          'adjusted',
          0,
          `${user?.name || 'Administrator'} (${user?.role || 'admin'})`,
          `Deleted item #${part.partNumber} from inventory catalog`,
          now
        ]
      );
    }

    run('DELETE FROM parts WHERE id = ?', [id]);
    run('DELETE FROM alerts WHERE partId = ?', [id]);
    syncAlertsWithDatabase();
    res.json({ success: true, message: 'Part deleted successfully', id });
  } catch (err: any) {
    console.error('Error deleting part:', err);
    res.status(500).json({ error: err.message || 'Failed to delete part' });
  }
});

// Consume / Use stock (Admin, Manager, Technician)
router.post('/parts/:id/consume', requireRole(['admin', 'manager', 'technician']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity, notes } = req.body;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const part = getPartById(id);
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
  const now = new Date().toISOString();

  let newStatus = 'in_stock';
  if (newStock === 0) {
    newStatus = 'critical';
  } else if (newStock <= part.minThreshold) {
    newStatus = newStock <= Math.floor(part.minThreshold / 2) ? 'critical' : 'low_stock';
  }

  run(
    `UPDATE parts SET stockLeft = ?, status = ?, lastUpdated = ? WHERE id = ?`,
    [newStock, newStatus, now, id]
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
      notes || `Consumed ${qty} unit(s) for maintenance`,
      now
    ]
  );

  syncAlertsWithDatabase();
  const updated = getPartById(id);
  res.json({
    success: true,
    part: updated,
    message: `Successfully logged ${qty} unit(s) consumed. New stock: ${newStock}`
  });
});

// Restock parts (Admin & Manager)
router.post('/parts/:id/restock', requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity, notes } = req.body;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const part = getPartById(id);
  if (!part) {
    res.status(404).json({ error: 'Part not found' });
    return;
  }

  const newStock = part.stockLeft + qty;
  const now = new Date().toISOString();

  let newStatus = 'in_stock';
  if (newStock <= part.minThreshold) {
    newStatus = newStock <= Math.floor(part.minThreshold / 2) ? 'critical' : 'low_stock';
  }

  run(
    `UPDATE parts SET stockLeft = ?, status = ?, lastUpdated = ? WHERE id = ?`,
    [newStock, newStatus, now, id]
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

  syncAlertsWithDatabase();
  const updated = getPartById(id);
  res.json({
    success: true,
    part: updated,
    message: `Restocked ${qty} units. Current stock: ${newStock}`
  });
});

// Reorder part (Admin & Manager)
router.post('/parts/:id/reorder', requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const part = getPartById(id);
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
    `INSERT INTO reorder_orders (id, orderNumber, partId, partNumber, partName, quantity, status, totalCost, orderedBy, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderId,
      orderNumber,
      part.id,
      part.partNumber,
      part.name,
      qty,
      'pending',
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
      totalCost
    },
    message: `Purchase Order ${orderNumber} created for ${qty}x ${part.name}`
  });
});

// ----------------------------------------------------
// ALERTS & NOTIFICATIONS
// ----------------------------------------------------

router.get('/alerts', (_req: Request, res: Response) => {
  syncAlertsWithDatabase();
  const alerts = query('SELECT * FROM alerts ORDER BY isResolved ASC, createdAt DESC');
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
        const now = new Date().toISOString();

        run(
          `UPDATE parts SET stockLeft = ?, status = ?, lastUpdated = ? WHERE id = ?`,
          [newStock, newStatus, now, part.id]
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
  syncAlertsWithDatabase();
  const allParts = query(`
    SELECT 
      p.id, p.partNumber, p.name, p.description,
      p.categoryId, COALESCE(c.name, 'Uncategorized') as category,
      p.locationId, COALESCE(l.name, 'Unassigned') as location,
      p.minThreshold, p.imageUrl, p.unitCost, p.stockLeft, p.status, p.lastUpdated
    FROM parts p
    LEFT JOIN categories c ON p.categoryId = c.id
    LEFT JOIN locations l ON p.locationId = l.id
  `);
  const activeAlerts = query('SELECT * FROM alerts WHERE isResolved = 0');
  const pendingOrders = query("SELECT * FROM reorder_orders WHERE status != 'received'");

  const consumedLogs = query("SELECT SUM(quantity) as total FROM inventory_logs WHERE type = 'consumed'");
  const totalConsumed = consumedLogs[0]?.total ? Number(consumedLogs[0].total) : 0;

  let totalParts = allParts.length;
  let totalStockLeft = 0;
  let lowStockCount = 0;
  let criticalCount = 0;
  let totalInventoryValue = 0;

  const categoryMap: Record<string, { count: number; stock: number }> = {};
  const statusMap: Record<string, number> = {
    in_stock: 0,
    low_stock: 0,
    critical: 0,
    reorder_placed: 0
  };

  for (const p of allParts) {
    totalStockLeft += p.stockLeft;
    totalInventoryValue += (p.stockLeft * p.unitCost);

    if (p.status === 'low_stock') lowStockCount++;
    if (p.status === 'critical') criticalCount++;

    statusMap[p.status] = (statusMap[p.status] || 0) + 1;

    if (!categoryMap[p.category]) {
      categoryMap[p.category] = { count: 0, stock: 0 };
    }
    categoryMap[p.category].count += 1;
    categoryMap[p.category].stock += p.stockLeft;
  }

  const categoryDistribution = Object.entries(categoryMap).map(([category, data]) => ({
    category,
    count: data.count,
    stock: data.stock
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
  const parts = query(`
    SELECT 
      p.id, p.partNumber, p.name, p.description,
      COALESCE(c.name, 'Uncategorized') as category,
      COALESCE(l.name, 'Unassigned') as location,
      p.minThreshold, p.imageUrl, p.unitCost, p.stockLeft, p.status, p.lastUpdated
    FROM parts p
    LEFT JOIN categories c ON p.categoryId = c.id
    LEFT JOIN locations l ON p.locationId = l.id
    ORDER BY p.name ASC
  `);

  if (format === 'csv') {
    const headers = [
      'Item Number',
      'Item Name',
      'Description',
      'Category',
      'Location',
      'Min Threshold',
      'Current Stock',
      'Unit Price (USD)',
      'Total Value (USD)',
      'Status',
      'Last Updated'
    ];

    const rows = parts.map(p => [
      `"${p.partNumber}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.location}"`,
      p.minThreshold,
      p.stockLeft,
      p.unitCost.toFixed(2),
      (p.stockLeft * p.unitCost).toFixed(2),
      `"${p.status}"`,
      `"${p.lastUpdated}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.csv"');
    res.send(csvContent);
    return;
  }

  res.json({ parts, exportedAt: new Date().toISOString() });
});

// ----------------------------------------------------
// FILE UPLOAD HANDLER FOR PARTS IMAGES (STORED ON SERVER)
// ----------------------------------------------------

router.post('/upload', requireAuth, (req: Request, res: Response) => {
  upload.single('image')(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }

    // 1. Standard Multipart Form File from browser File input
    if (req.file) {
      const relativeUrl = `/uploads/${req.file.filename}`;
      return res.json({
        success: true,
        imageUrl: relativeUrl,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    }

    // 2. Base64 encoded payload fallback (handles drag & drop / canvas / clipboard)
    if (req.body && req.body.image && typeof req.body.image === 'string' && req.body.image.startsWith('data:image/')) {
      try {
        const matches = req.body.image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (!matches) {
          return res.status(400).json({ error: 'Invalid base64 image data format' });
        }
        const rawExt = matches[1].toLowerCase();
        const ext = rawExt === 'jpeg' ? '.jpg' : `.${rawExt.replace(/\+xml/, '')}`;
        const buffer = Buffer.from(matches[2], 'base64');
        const customName = req.body.fileName ? path.basename(req.body.fileName, path.extname(req.body.fileName)).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30) : 'part';
        const filename = `part-${customName}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        const filePath = path.join(uploadsDir, filename);

        await fs.promises.writeFile(filePath, buffer);

        return res.json({
          success: true,
          imageUrl: `/uploads/${filename}`,
          fileName: filename,
          size: buffer.length
        });
      } catch (writeErr: any) {
        return res.status(500).json({ error: 'Failed to write image file to server storage' });
      }
    }

    return res.status(400).json({ error: 'No image file uploaded' });
  });
});

// Explicit API route for retrieving uploaded images
router.get('/uploads/:filename', (req: Request, res: Response) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(uploadsDir, safeFilename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Image not found on server' });
  }
});

export default router;
