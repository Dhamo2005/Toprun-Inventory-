import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'roboparts.sqlite');

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
      console.log('Loaded existing SQLite database from', DB_PATH);
    } catch (err) {
      console.error('Failed to load existing SQLite db, initializing fresh:', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('Created new in-memory SQLite database');
  }

  // Create tables
  createSchema(db);
  seedInitialData(db);
  saveDb();

  return db;
}

export function saveDb(): void {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

export function query<T = any>(sql: string, params: any[] = []): T[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

export function run(sql: string, params: any[] = []): void {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  saveDb();
}

function createSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      avatar TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS parts (
      id TEXT PRIMARY KEY,
      partNumber TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      robotModel TEXT NOT NULL,
      description TEXT,
      imageUrl TEXT,
      stockLeft INTEGER NOT NULL DEFAULT 0,
      minThreshold INTEGER NOT NULL DEFAULT 5,
      consumed INTEGER NOT NULL DEFAULT 0,
      needToOrder INTEGER NOT NULL DEFAULT 0,
      unitCost REAL NOT NULL DEFAULT 0.0,
      unit TEXT DEFAULT 'pcs',
      supplier TEXT NOT NULL,
      leadTimeDays INTEGER NOT NULL DEFAULT 7,
      location TEXT NOT NULL,
      status TEXT NOT NULL,
      lastUpdated TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id TEXT PRIMARY KEY,
      partId TEXT NOT NULL,
      partNumber TEXT NOT NULL,
      partName TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      performedBy TEXT NOT NULL,
      notes TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      partId TEXT NOT NULL,
      partNumber TEXT NOT NULL,
      partName TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      isResolved INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reorder_orders (
      id TEXT PRIMARY KEY,
      orderNumber TEXT UNIQUE NOT NULL,
      partId TEXT NOT NULL,
      partNumber TEXT NOT NULL,
      partName TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT NOT NULL,
      supplier TEXT NOT NULL,
      totalCost REAL NOT NULL,
      orderedBy TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  try {
    db.run(`ALTER TABLE parts ADD COLUMN unit TEXT DEFAULT 'pcs';`);
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    db.run(`UPDATE users SET email = REPLACE(email, '@robopart.com', '@toprun.com') WHERE email LIKE '%@robopart.com';`);
  } catch (e) {
    // Ignore error
  }
}

function seedInitialData(db: Database) {
  // Check if users already seeded
  const userCount = db.exec("SELECT COUNT(*) as count FROM users;");
  const count = userCount[0]?.values[0]?.[0] as number || 0;
  if (count > 0) return;

  console.log('Seeding initial SQLite database tables...');

  // Seed Users: Admin, Manager, Technician, Viewer
  const users = [
    {
      id: 'usr_admin',
      name: 'Dr. Elena Vance',
      email: 'admin@toprun.com',
      password: 'password123',
      role: 'admin',
      department: 'Robotics Engineering & Operations',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: '2025-01-10T08:00:00.000Z'
    }
  ];

  for (const u of users) {
    db.run(
      `INSERT INTO users (id, name, email, password, role, department, avatar, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.name, u.email, u.password, u.role, u.department, u.avatar, u.createdAt]
    );
  }

  // Seed High-Tech Robot Spare Parts
  const parts = [
    {
      id: 'prt-001',
      partNumber: 'HD-CSG-20-80',
      name: 'Harmonic Drive Strain Wave Reducer',
      category: 'Actuators & Motors',
      robotModel: 'Universal UR10e',
      description: 'Zero-backlash precision gear assembly for joint 2 & 3 rotation, 80:1 ratio with cross-roller bearing.',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
      stockLeft: 2,
      minThreshold: 5,
      consumed: 18,
      needToOrder: 8,
      unitCost: 1450.00,
      supplier: 'Harmonic Drive LLC',
      leadTimeDays: 14,
      location: 'Aisle 2, Bin M-04',
      status: 'critical',
      lastUpdated: '2025-02-14T09:12:00.000Z'
    },
    {
      id: 'prt-002',
      partNumber: 'MXN-ECI-40',
      name: 'Maxon EC-i 40 100W Brushless Servo Motor',
      category: 'Actuators & Motors',
      robotModel: 'Boston Dynamics Spot',
      description: 'High-torque brushless DC motor with hall sensors and digital incremental encoder for robotic quadrupeds.',
      imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&auto=format&fit=crop&q=80',
      stockLeft: 4,
      minThreshold: 6,
      consumed: 24,
      needToOrder: 6,
      unitCost: 820.00,
      supplier: 'Maxon Precision Motors',
      leadTimeDays: 10,
      location: 'Rack 1, Shelf B-2',
      status: 'low_stock',
      lastUpdated: '2025-02-16T11:45:00.000Z'
    }
  ];

  for (const p of parts) {
    db.run(
      `INSERT INTO parts (
        id, partNumber, name, category, robotModel, description, imageUrl,
        stockLeft, minThreshold, consumed, needToOrder, unitCost, supplier,
        leadTimeDays, location, status, lastUpdated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id, p.partNumber, p.name, p.category, p.robotModel, p.description, p.imageUrl,
        p.stockLeft, p.minThreshold, p.consumed, p.needToOrder, p.unitCost, p.supplier,
        p.leadTimeDays, p.location, p.status, p.lastUpdated
      ]
    );
  }

  // Seed sample Inventory Logs
  const logs = [
    {
      id: 'log-001',
      partId: 'prt-001',
      partNumber: 'HD-CSG-20-80',
      partName: 'Harmonic Drive Strain Wave Reducer',
      type: 'consumed',
      quantity: 1,
      performedBy: 'Alex Mercer (Technician)',
      notes: 'Emergency Joint 3 gear replacement on Cell 4 UR10e after torque fault.',
      timestamp: '2025-02-14T09:12:00.000Z'
    }
  ];

  for (const l of logs) {
    db.run(
      `INSERT INTO inventory_logs (id, partId, partNumber, partName, type, quantity, performedBy, notes, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [l.id, l.partId, l.partNumber, l.partName, l.type, l.quantity, l.performedBy, l.notes, l.timestamp]
    );
  }

  // Seed sample Alerts
  const alerts = [
    {
      id: 'alt-001',
      partId: 'prt-012',
      partNumber: 'SICK-DSL-EKM36',
      partName: 'SICK HIPERFACE DSL Absolute Motor Encoder',
      severity: 'critical',
      title: 'Stock Depleted (0 Remaining)',
      message: 'Zero units remaining in stock. KUKA KR QUANTEC line has no safety backup encoders.',
      isResolved: 0,
      createdAt: '2025-02-19T17:00:00.000Z'
    }
  ];

  for (const a of alerts) {
    db.run(
      `INSERT INTO alerts (id, partId, partNumber, partName, severity, title, message, isResolved, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.partId, a.partNumber, a.partName, a.severity, a.title, a.message, a.isResolved, a.createdAt]
    );
  }

  // Seed sample Reorder Purchase Orders
  const reorders = [
    {
      id: 'ord-001',
      orderNumber: 'PO-2025-001',
      partId: 'prt-012',
      partNumber: 'SICK-DSL-EKM36',
      partName: 'SICK HIPERFACE DSL Absolute Motor Encoder',
      quantity: 8,
      status: 'pending',
      supplier: 'SICK Sensor Intelligence',
      totalCost: 6240.00,
      orderedBy: 'Marcus Reyes (Manager)',
      createdAt: '2025-02-19T17:15:00.000Z'
    },
    {
      id: 'ord-002',
      orderNumber: 'PO-2025-002',
      partId: 'prt-001',
      partNumber: 'HD-CSG-20-80',
      partName: 'Harmonic Drive Strain Wave Reducer',
      quantity: 8,
      status: 'approved',
      supplier: 'Harmonic Drive LLC',
      totalCost: 11600.00,
      orderedBy: 'Dr. Elena Vance (Admin)',
      createdAt: '2025-02-15T10:00:00.000Z'
    }
  ];

  for (const o of reorders) {
    db.run(
      `INSERT INTO reorder_orders (id, orderNumber, partId, partNumber, partName, quantity, status, supplier, totalCost, orderedBy, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [o.id, o.orderNumber, o.partId, o.partNumber, o.partName, o.quantity, o.status, o.supplier, o.totalCost, o.orderedBy, o.createdAt]
    );
  }

  console.log('Seeded SQLite database successfully!');
}
