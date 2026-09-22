import initSqlJs from 'sql.js';
import type { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

function getDbConfig(): { dir: string; file: string } {
  const standardDir = path.join(process.cwd(), 'data');
  const tmpDir = path.join('/tmp', 'roboparts_data');

  try {
    if (!fs.existsSync(standardDir)) {
      fs.mkdirSync(standardDir, { recursive: true });
    }
    const testFile = path.join(standardDir, '.write_test');
    fs.writeFileSync(testFile, '1');
    fs.unlinkSync(testFile);
    return { dir: standardDir, file: path.join(standardDir, 'roboparts.sqlite') };
  } catch {
    if (!fs.existsSync(tmpDir)) {
      try { fs.mkdirSync(tmpDir, { recursive: true }); } catch {}
    }
    return { dir: tmpDir, file: path.join(tmpDir, 'roboparts.sqlite') };
  }
}

const { dir: DATA_DIR, file: DB_PATH } = getDbConfig();

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

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized');
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

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      createdAt TEXT NOT NULL
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
      totalCost REAL NOT NULL,
      orderedBy TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  // Migrate parts table to clean relational schema with only requested fields:
  // Item number, Item Name, item Description, Location, minimum threshold, Image, unit price
  const partsTableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='parts';");
  const partsExists = (partsTableCheck[0]?.values?.length || 0) > 0;

  if (partsExists) {
    const tableInfo = db.exec("PRAGMA table_info(parts);");
    const columns = (tableInfo[0]?.values || []).map((v: any) => v[1] as string);
    if (columns.includes('robotModel') || columns.includes('supplier') || columns.includes('leadTimeDays') || !columns.includes('categoryId') || !columns.includes('locationId')) {
      console.log('Migrating parts table to relational database schema...');
      // Read existing parts
      const oldPartsRes = db.exec("SELECT * FROM parts;");
      const oldRows = oldPartsRes[0]?.values || [];
      const colIndexMap: Record<string, number> = {};
      (oldPartsRes[0]?.columns || []).forEach((c: string, idx: number) => {
        colIndexMap[c] = idx;
      });

      // Drop old parts table
      db.run("DROP TABLE parts;");

      // Create new clean parts table
      db.run(`
        CREATE TABLE parts (
          id TEXT PRIMARY KEY,
          partNumber TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          categoryId TEXT NOT NULL,
          locationId TEXT NOT NULL,
          minThreshold INTEGER NOT NULL DEFAULT 5,
          imageUrl TEXT,
          unitCost REAL NOT NULL DEFAULT 0.0,
          stockLeft INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'in_stock',
          lastUpdated TEXT NOT NULL,
          FOREIGN KEY (categoryId) REFERENCES categories(id),
          FOREIGN KEY (locationId) REFERENCES locations(id)
        );
      `);

      // Seed categories and locations first if needed
      seedCategoriesAndLocations(db);

      // Re-insert migrated rows
      for (const row of oldRows) {
        const id = row[colIndexMap['id']] as string;
        const partNumber = row[colIndexMap['partNumber']] as string;
        const name = row[colIndexMap['name']] as string;
        const description = (row[colIndexMap['description']] as string) || '';
        const rawCategory = (row[colIndexMap['category']] as string) || 'General Category';
        const rawLocation = (row[colIndexMap['location']] as string) || 'Bay 1, Rack A';
        const minThreshold = (row[colIndexMap['minThreshold']] as number) || 5;
        const imageUrl = (row[colIndexMap['imageUrl']] as string) || '';
        const unitCost = (row[colIndexMap['unitCost']] as number) || 0;
        const stockLeft = (row[colIndexMap['stockLeft']] as number) || 0;
        const status = (row[colIndexMap['status']] as string) || 'in_stock';
        const lastUpdated = (row[colIndexMap['lastUpdated']] as string) || new Date().toISOString();

        const catId = getOrCreateCategory(db, rawCategory);
        const locId = getOrCreateLocation(db, rawLocation);

        db.run(
          `INSERT INTO parts (id, partNumber, name, description, categoryId, locationId, minThreshold, imageUrl, unitCost, stockLeft, status, lastUpdated)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, partNumber, name, description, catId, locId, minThreshold, imageUrl, unitCost, stockLeft, status, lastUpdated]
        );
      }
      console.log('Migration to clean relational schema complete.');
    }
  } else {
    db.run(`
      CREATE TABLE parts (
        id TEXT PRIMARY KEY,
        partNumber TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        categoryId TEXT NOT NULL,
        locationId TEXT NOT NULL,
        minThreshold INTEGER NOT NULL DEFAULT 5,
        imageUrl TEXT,
        unitCost REAL NOT NULL DEFAULT 0.0,
        stockLeft INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'in_stock',
        lastUpdated TEXT NOT NULL,
        FOREIGN KEY (categoryId) REFERENCES categories(id),
        FOREIGN KEY (locationId) REFERENCES locations(id)
      );
    `);
  }

  try {
    db.run(`UPDATE users SET email = REPLACE(email, '@robopart.com', '@toprun.com') WHERE email LIKE '%@robopart.com';`);
  } catch (e) {
    // Ignore error
  }

  try {
    // Clean up any 3rd-party Unsplash URLs from existing database records
    db.run(`UPDATE users SET avatar = '' WHERE avatar LIKE '%unsplash.com%';`);
    db.run(`UPDATE parts SET imageUrl = '' WHERE imageUrl LIKE '%unsplash.com%';`);
  } catch (e) {
    // Ignore error
  }

  try {
    // Delete orphan alerts referencing parts that do not exist in the database
    db.run(`DELETE FROM alerts WHERE partId NOT IN (SELECT id FROM parts);`);
  } catch (e) {
    // Ignore error
  }
}

export function getOrCreateCategory(db: Database, name: string): string {
  const trimmed = name.trim();
  const existing = db.exec("SELECT id FROM categories WHERE LOWER(name) = LOWER(?);", [trimmed]);
  if (existing[0]?.values?.[0]?.[0]) {
    return existing[0].values[0][0] as string;
  }
  const id = `cat-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6)}`;
  db.run("INSERT INTO categories (id, name, createdAt) VALUES (?, ?, ?);", [id, trimmed, new Date().toISOString()]);
  return id;
}

export function getOrCreateLocation(db: Database, name: string): string {
  const trimmed = name.trim();
  const existing = db.exec("SELECT id FROM locations WHERE LOWER(name) = LOWER(?);", [trimmed]);
  if (existing[0]?.values?.[0]?.[0]) {
    return existing[0].values[0][0] as string;
  }
  const id = `loc-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6)}`;
  db.run("INSERT INTO locations (id, name, createdAt) VALUES (?, ?, ?);", [id, trimmed, new Date().toISOString()]);
  return id;
}

function seedCategoriesAndLocations(db: Database) {
  const catCountRes = db.exec("SELECT COUNT(*) as count FROM categories;");
  const catCount = (catCountRes[0]?.values[0]?.[0] as number) || 0;
  if (catCount === 0) {
    const defaultCategories = [
      'Actuators & Motors',
      'Sensors & Feedback',
      'End Effectors & Tooling',
      'Controllers & Electronics',
      'Pneumatics & Hydraulics',
      'Power & Cables',
      'Mechanical & Structural'
    ];
    for (const name of defaultCategories) {
      getOrCreateCategory(db, name);
    }
  }

  const locCountRes = db.exec("SELECT COUNT(*) as count FROM locations;");
  const locCount = (locCountRes[0]?.values[0]?.[0] as number) || 0;
  if (locCount === 0) {
    const defaultLocations = [
      'Aisle 1, Bin E-12',
      'Aisle 2, Bin M-04',
      'Aisle 3, Bin S-02',
      'Aisle 4, Bin E-01',
      'Rack 1, Shelf B-2',
      'Rack 2, Bin P-09',
      'Cabinet 4, Drawer 1',
      'Secure Vault A, Bay 2'
    ];
    for (const name of defaultLocations) {
      getOrCreateLocation(db, name);
    }
  }
}

function seedInitialData(db: Database) {
  // 1. Seed Users if table is empty
  const userCountRes = db.exec("SELECT COUNT(*) as count FROM users;");
  const userCount = (userCountRes[0]?.values[0]?.[0] as number) || 0;
  if (userCount === 0) {
    console.log('Seeding users table...');
    const users = [
      {
        id: 'usr_admin',
        name: 'Dr. Elena Vance',
        email: 'admin@toprun.com',
        password: 'password123',
        role: 'admin',
        department: 'Robotics Engineering & Operations',
        avatar: '',
        createdAt: '2025-01-10T08:00:00.000Z'
      },
      {
        id: 'usr_mgr',
        name: 'Marcus Reyes',
        email: 'manager@toprun.com',
        password: 'password123',
        role: 'manager',
        department: 'Inventory & Procurement',
        avatar: '',
        createdAt: '2025-01-12T09:30:00.000Z'
      },
      {
        id: 'usr_tech',
        name: 'Alex Mercer',
        email: 'tech@toprun.com',
        password: 'password123',
        role: 'technician',
        department: 'Field Maintenance & Robotics Service',
        avatar: '',
        createdAt: '2025-01-15T10:00:00.000Z'
      },
      {
        id: 'usr_viewer',
        name: 'Sarah Jenkins',
        email: 'viewer@toprun.com',
        password: 'password123',
        role: 'viewer',
        department: 'Safety & Regulatory Compliance',
        avatar: '',
        createdAt: '2025-01-20T11:15:00.000Z'
      }
    ];

    for (const u of users) {
      db.run(
        `INSERT INTO users (id, name, email, password, role, department, avatar, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.name, u.email, u.password, u.role, u.department, u.avatar, u.createdAt]
      );
    }
  }

  // 2. Seed Robot Spare Parts if table is empty
  const partCountRes = db.exec("SELECT COUNT(*) as count FROM parts;");
  const partCount = (partCountRes[0]?.values[0]?.[0] as number) || 0;
  if (partCount === 0) {
    console.log('Seeding spare parts catalog...');
    const rawParts = [
      {
        id: 'prt-001',
        partNumber: 'HD-CSG-20-80',
        name: 'Harmonic Drive Strain Wave Reducer',
        category: 'Actuators & Motors',
        description: 'Zero-backlash precision gear assembly for joint 2 & 3 rotation, 80:1 ratio with cross-roller bearing.',
        imageUrl: '',
        stockLeft: 2,
        minThreshold: 5,
        unitCost: 1450.00,
        location: 'Aisle 2, Bin M-04',
        status: 'critical',
        lastUpdated: '2025-02-14T09:12:00.000Z'
      },
      {
        id: 'prt-002',
        partNumber: 'MXN-ECI-40',
        name: 'Maxon EC-i 40 100W Brushless Servo Motor',
        category: 'Actuators & Motors',
        description: 'High-torque brushless DC motor with hall sensors and digital incremental encoder for robotic quadrupeds.',
        imageUrl: '',
        stockLeft: 4,
        minThreshold: 6,
        unitCost: 820.00,
        location: 'Rack 1, Shelf B-2',
        status: 'low_stock',
        lastUpdated: '2025-02-16T11:45:00.000Z'
      },
      {
        id: 'prt-003',
        partNumber: 'SICK-DSL-EKM36',
        name: 'SICK HIPERFACE DSL Absolute Motor Encoder',
        category: 'Sensors & Feedback',
        description: 'High-resolution single-cable absolute optical rotary encoder for servo position synchronization.',
        imageUrl: '',
        stockLeft: 0,
        minThreshold: 4,
        unitCost: 780.00,
        location: 'Cabinet 4, Drawer 1',
        status: 'critical',
        lastUpdated: '2025-02-19T16:30:00.000Z'
      },
      {
        id: 'prt-004',
        partNumber: 'ROB-2F85',
        name: 'Robotiq 2F-85 Adaptive Parallel Gripper Finger Kit',
        category: 'End Effectors & Tooling',
        description: 'Hardened silicone grip pads, dual link drive mechanism, and mechanical coupling flange.',
        imageUrl: '',
        stockLeft: 7,
        minThreshold: 4,
        unitCost: 620.00,
        location: 'Aisle 1, Bin E-12',
        status: 'in_stock',
        lastUpdated: '2025-02-18T14:10:00.000Z'
      },
      {
        id: 'prt-005',
        partNumber: 'OMR-E3Z-D61',
        name: 'Omron Photoelectric Proximity Sensor 24VDC',
        category: 'Sensors & Feedback',
        description: 'Diffuse-reflective optical sensor, 100mm sensing distance with IP67 washdown rating.',
        imageUrl: '',
        stockLeft: 16,
        minThreshold: 8,
        unitCost: 95.00,
        location: 'Aisle 3, Bin S-02',
        status: 'in_stock',
        lastUpdated: '2025-02-17T10:00:00.000Z'
      },
      {
        id: 'prt-006',
        partNumber: 'KUK-KRC4-PC',
        name: 'KUKA KRC4 Industrial Motherboard & Core Controller',
        category: 'Controllers & Electronics',
        description: 'Main industrial PC board with EtherCAT real-time master interface and isolated safety bus.',
        imageUrl: '',
        stockLeft: 1,
        minThreshold: 3,
        unitCost: 3850.00,
        location: 'Secure Vault A, Bay 2',
        status: 'critical',
        lastUpdated: '2025-02-15T08:20:00.000Z'
      },
      {
        id: 'prt-007',
        partNumber: 'SMC-MGPL25-50',
        name: 'SMC Compact Pneumatic Guided Cylinder',
        category: 'Pneumatics & Hydraulics',
        description: 'Compact guide cylinder, 25mm bore, 50mm stroke with ball bushing bearing for high-cycle tooling.',
        imageUrl: '',
        stockLeft: 3,
        minThreshold: 5,
        unitCost: 285.00,
        location: 'Rack 2, Bin P-09',
        status: 'low_stock',
        lastUpdated: '2025-02-18T11:00:00.000Z'
      },
      {
        id: 'prt-008',
        partNumber: 'MW-NDR-480-24',
        name: 'Mean Well 24V 20A 480W Industrial DIN Rail PSU',
        category: 'Power & Cables',
        description: 'Ultra-slim single phase DIN rail switching power supply with 92.5% efficiency and active PFC.',
        imageUrl: '',
        stockLeft: 12,
        minThreshold: 4,
        unitCost: 110.00,
        location: 'Aisle 4, Bin E-01',
        status: 'in_stock',
        lastUpdated: '2025-02-10T14:00:00.000Z'
      }
    ];

    for (const p of rawParts) {
      const catId = getOrCreateCategory(db, p.category);
      const locId = getOrCreateLocation(db, p.location);
      db.run(
        `INSERT INTO parts (
          id, partNumber, name, description, categoryId, locationId,
          minThreshold, imageUrl, unitCost, stockLeft, status, lastUpdated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id, p.partNumber, p.name, p.description, catId, locId,
          p.minThreshold, p.imageUrl, p.unitCost, p.stockLeft, p.status, p.lastUpdated
        ]
      );
    }
  }

  // 3. Seed sample Inventory Logs if table is empty
  const logCountRes = db.exec("SELECT COUNT(*) as count FROM inventory_logs;");
  const logCount = (logCountRes[0]?.values[0]?.[0] as number) || 0;
  if (logCount === 0) {
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
        partId: 'prt-002',
        partNumber: 'MXN-ECI-40',
        partName: 'Maxon EC-i 40 100W Brushless Servo Motor',
        type: 'restocked',
        quantity: 4,
        performedBy: 'Marcus Reyes (Manager)',
        notes: 'Replenishment delivery batch #MXN-9942 checked into shelf B-2.',
        timestamp: '2025-02-16T11:45:00.000Z'
      }
    ];

    for (const l of logs) {
      db.run(
        `INSERT INTO inventory_logs (id, partId, partNumber, partName, type, quantity, performedBy, notes, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [l.id, l.partId, l.partNumber, l.partName, l.type, l.quantity, l.performedBy, l.notes, l.timestamp]
      );
    }
  }

  // 4. Seed sample Reorder Purchase Orders if table is empty
  const reorderCountRes = db.exec("SELECT COUNT(*) as count FROM reorder_orders;");
  const reorderCount = (reorderCountRes[0]?.values[0]?.[0] as number) || 0;
  if (reorderCount === 0) {
    const reorders = [
      {
        id: 'ord-001',
        orderNumber: 'PO-2025-001',
        partId: 'prt-003',
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
        `INSERT INTO reorder_orders (id, orderNumber, partId, partNumber, partName, quantity, status, totalCost, orderedBy, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [o.id, o.orderNumber, o.partId, o.partNumber, o.partName, o.quantity, o.status, o.totalCost, o.orderedBy, o.createdAt]
      );
    }
  }

  console.log('Database tables verified and seeded successfully!');
}
