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
    },
    {
      id: 'usr_manager',
      name: 'Marcus Reyes',
      email: 'manager@toprun.com',
      password: 'password123',
      role: 'manager',
      department: 'Inventory & Procurement',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: '2025-01-12T09:30:00.000Z'
    },
    {
      id: 'usr_tech',
      name: 'Alex Mercer',
      email: 'tech@toprun.com',
      password: 'password123',
      role: 'technician',
      department: 'Field Maintenance & Assembly',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      createdAt: '2025-01-15T11:00:00.000Z'
    },
    {
      id: 'usr_viewer',
      name: 'Sarah Jenkins',
      email: 'viewer@toprun.com',
      password: 'password123',
      role: 'viewer',
      department: 'Audit & Safety Compliance',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      createdAt: '2025-01-20T14:15:00.000Z'
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
    },
    {
      id: 'prt-003',
      partNumber: 'ROBQ-2F-85',
      name: 'Robotiq 2F-85 Adaptive Electric Gripper',
      category: 'End Effectors & Grippers',
      robotModel: 'Universal UR10e',
      description: 'Programmable dual-finger collaborative gripper with 85mm stroke, force feedback and quick coupling.',
      imageUrl: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=500&auto=format&fit=crop&q=80',
      stockLeft: 7,
      minThreshold: 4,
      consumed: 9,
      needToOrder: 0,
      unitCost: 3600.00,
      supplier: 'Robotiq Inc.',
      leadTimeDays: 7,
      location: 'Cabinet C, Drawer 1',
      status: 'in_stock',
      lastUpdated: '2025-02-17T16:20:00.000Z'
    },
    {
      id: 'prt-004',
      partNumber: 'INT-RS-D435I',
      name: 'Intel RealSense D435i Depth Camera Module',
      category: 'Sensors & Vision',
      robotModel: 'Autonomous Mobile Robot (AMR)',
      description: 'Active stereo depth perception with integrated IMU for SLAM navigation and obstacle avoidance.',
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=80',
      stockLeft: 1,
      minThreshold: 6,
      consumed: 22,
      needToOrder: 9,
      unitCost: 495.00,
      supplier: 'Intel Vision Systems',
      leadTimeDays: 5,
      location: 'Optics Lab, Shelf O-1',
      status: 'critical',
      lastUpdated: '2025-02-18T10:05:00.000Z'
    },
    {
      id: 'prt-005',
      partNumber: 'OMR-OS32C',
      name: 'Omron OS32C Safety Laser Scanner LiDAR',
      category: 'Sensors & Vision',
      robotModel: 'KUKA KR QUANTEC',
      description: 'Type 3 laser scanner with 270° detection angle, 4m safety zone, and dual OSSD safety outputs.',
      imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
      stockLeft: 3,
      minThreshold: 4,
      consumed: 7,
      needToOrder: 3,
      unitCost: 2150.00,
      supplier: 'Omron Industrial Automation',
      leadTimeDays: 12,
      location: 'Safety Cage, Bin S-02',
      status: 'low_stock',
      lastUpdated: '2025-02-18T14:30:00.000Z'
    },
    {
      id: 'prt-006',
      partNumber: 'KUKA-SMARTPAD-2',
      name: 'KUKA KRC4 smartPAD Teach Pendant',
      category: 'Compute & Control Boards',
      robotModel: 'KUKA KR QUANTEC',
      description: '8.4-inch capacitive multi-touch programming pendant with 6D mouse, emergency stop switch and USB 3.0.',
      imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=80',
      stockLeft: 5,
      minThreshold: 3,
      consumed: 4,
      needToOrder: 0,
      unitCost: 4200.00,
      supplier: 'KUKA Robotics GmbH',
      leadTimeDays: 21,
      location: 'Electronics Vault, Shelf E-3',
      status: 'in_stock',
      lastUpdated: '2025-02-10T12:00:00.000Z'
    },
    {
      id: 'prt-007',
      partNumber: 'BCK-CX5130',
      name: 'Beckhoff CX5130 Embedded PC Controller',
      category: 'Compute & Control Boards',
      robotModel: 'ABB IRB 6700',
      description: 'DIN-rail industrial PC with Intel Atom E3827 dual-core processor, EtherCAT master interface and UPS.',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
      stockLeft: 6,
      minThreshold: 3,
      consumed: 5,
      needToOrder: 0,
      unitCost: 1890.00,
      supplier: 'Beckhoff Automation',
      leadTimeDays: 15,
      location: 'Electronics Vault, Shelf E-1',
      status: 'in_stock',
      lastUpdated: '2025-02-12T09:00:00.000Z'
    },
    {
      id: 'prt-008',
      partNumber: 'BD-SPOT-BAT605',
      name: 'Spot 605Wh Swappable Li-Ion Battery Pack',
      category: 'Power & Battery Systems',
      robotModel: 'Boston Dynamics Spot',
      description: 'Smart lithium-ion cartridge with CAN bus telemetry, thermal management and quick-release latching.',
      imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop&q=80',
      stockLeft: 2,
      minThreshold: 5,
      consumed: 14,
      needToOrder: 6,
      unitCost: 2800.00,
      supplier: 'Boston Dynamics Hardware',
      leadTimeDays: 14,
      location: 'Battery Charging Station Room',
      status: 'critical',
      lastUpdated: '2025-02-19T08:15:00.000Z'
    },
    {
      id: 'prt-009',
      partNumber: 'FESTO-DFM-25',
      name: 'Festo DFM-25-100 Guided Pneumatic Cylinder',
      category: 'Pneumatics & Hydraulics',
      robotModel: 'FANUC M-20iA',
      description: 'Double-acting guided drive with recirculating ball bearing guide and end-position cushioning.',
      imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=500&auto=format&fit=crop&q=80',
      stockLeft: 11,
      minThreshold: 6,
      consumed: 12,
      needToOrder: 0,
      unitCost: 340.00,
      supplier: 'Festo Corporation',
      leadTimeDays: 5,
      location: 'Pneumatics Bay, Bin P-11',
      status: 'in_stock',
      lastUpdated: '2025-02-15T15:40:00.000Z'
    },
    {
      id: 'prt-010',
      partNumber: 'HRT-HAN-MOD15M',
      name: 'Harting Han-Modular Robot Cable Assembly 15m',
      category: 'Cables & Connectors',
      robotModel: 'ABB IRB 6700',
      description: 'Shielded high-flex torsional dress pack cable for power, Profinet, and emergency safety loops.',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
      stockLeft: 4,
      minThreshold: 5,
      consumed: 16,
      needToOrder: 5,
      unitCost: 650.00,
      supplier: 'Harting Electric',
      leadTimeDays: 8,
      location: 'Cable Spool Rack, Section 3',
      status: 'low_stock',
      lastUpdated: '2025-02-19T13:20:00.000Z'
    },
    {
      id: 'prt-011',
      partNumber: 'SCK-EGP-40',
      name: 'Schunk EGP 40 Electric 2-Finger Gripper',
      category: 'End Effectors & Grippers',
      robotModel: 'FANUC LR Mate 200iD',
      description: 'High-speed compact electric parallel gripper with brush-less servomotor for electronics assembly.',
      imageUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=500&auto=format&fit=crop&q=80',
      stockLeft: 8,
      minThreshold: 4,
      consumed: 8,
      needToOrder: 0,
      unitCost: 1750.00,
      supplier: 'Schunk Intec',
      leadTimeDays: 10,
      location: 'Cabinet C, Drawer 2',
      status: 'in_stock',
      lastUpdated: '2025-02-13T10:10:00.000Z'
    },
    {
      id: 'prt-012',
      partNumber: 'SICK-DSL-EKM36',
      name: 'SICK HIPERFACE DSL Absolute Motor Encoder',
      category: 'Sensors & Vision',
      robotModel: 'KUKA KR QUANTEC',
      description: 'Single-cable optical motor feedback system with SIL3/PL e functional safety rating.',
      imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=500&auto=format&fit=crop&q=80',
      stockLeft: 0,
      minThreshold: 4,
      consumed: 15,
      needToOrder: 8,
      unitCost: 780.00,
      supplier: 'SICK Sensor Intelligence',
      leadTimeDays: 14,
      location: 'Sensors Rack, Bin S-09',
      status: 'critical',
      lastUpdated: '2025-02-19T17:00:00.000Z'
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
    },
    {
      id: 'log-002',
      partId: 'prt-004',
      partNumber: 'INT-RS-D435I',
      partName: 'Intel RealSense D435i Depth Camera Module',
      type: 'consumed',
      quantity: 2,
      performedBy: 'Alex Mercer (Technician)',
      notes: 'Replaced cracked front optics on AMR Fleet Unit #08 and #11.',
      timestamp: '2025-02-18T10:05:00.000Z'
    },
    {
      id: 'log-003',
      partId: 'prt-008',
      partNumber: 'BD-SPOT-BAT605',
      partName: 'Spot 605Wh Swappable Li-Ion Battery Pack',
      type: 'consumed',
      quantity: 1,
      performedBy: 'Marcus Reyes (Manager)',
      notes: 'Deployed replacement battery pack for Spot inspection unit in Substation B.',
      timestamp: '2025-02-19T08:15:00.000Z'
    },
    {
      id: 'log-004',
      partId: 'prt-003',
      partNumber: 'ROBQ-2F-85',
      partName: 'Robotiq 2F-85 Adaptive Electric Gripper',
      type: 'restocked',
      quantity: 4,
      performedBy: 'Marcus Reyes (Manager)',
      notes: 'PO-8821 received from Robotiq and verified in QA.',
      timestamp: '2025-02-17T16:20:00.000Z'
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
    },
    {
      id: 'alt-002',
      partId: 'prt-004',
      partNumber: 'INT-RS-D435I',
      partName: 'Intel RealSense D435i Depth Camera Module',
      severity: 'critical',
      title: 'Critical Low Stock (1 Left)',
      message: 'Stock has fallen to 1 unit (threshold is 6). Order 9 units recommended.',
      isResolved: 0,
      createdAt: '2025-02-18T10:06:00.000Z'
    },
    {
      id: 'alt-003',
      partId: 'prt-001',
      partNumber: 'HD-CSG-20-80',
      partName: 'Harmonic Drive Strain Wave Reducer',
      severity: 'critical',
      title: 'Stock Below Minimum Threshold',
      message: 'Stock level is 2 (threshold is 5). Lead time is 14 days.',
      isResolved: 0,
      createdAt: '2025-02-14T09:15:00.000Z'
    },
    {
      id: 'alt-004',
      partId: 'prt-002',
      partNumber: 'MXN-ECI-40',
      partName: 'Maxon EC-i 40 100W Brushless Servo Motor',
      severity: 'warning',
      title: 'Low Stock Advisory',
      message: 'Current stock is 4 units (threshold is 6). Prepare purchase requisition.',
      isResolved: 0,
      createdAt: '2025-02-16T11:46:00.000Z'
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
