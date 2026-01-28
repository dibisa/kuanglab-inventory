import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';
import xlsx from 'xlsx';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Database setup
const dbPath = path.join(__dirname, 'inventory.db');
let db;

// Helper functions for sql.js
function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results[0] || null;
}

function runSql(sql, params = []) {
  db.run(sql, params);
  saveDb();
  const result = db.exec("SELECT last_insert_rowid() as id");
  return { lastInsertRowid: result[0]?.values[0]?.[0] };
}

async function initDb() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // Initialize tables
  db.run(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building TEXT,
      room TEXT,
      cabinet TEXT,
      shelf TEXT,
      bin TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS chemicals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cas_number TEXT,
      formula TEXT,
      molecular_weight REAL,
      quantity REAL,
      unit TEXT,
      hazard_class TEXT,
      hazard_statements TEXT,
      storage_conditions TEXT,
      supplier TEXT,
      catalog_number TEXT,
      lot_number TEXT,
      expiry_date DATE,
      date_received DATE,
      cost REAL,
      sds_url TEXT,
      notes TEXT,
      location_id INTEGER,
      category TEXT,
      purity TEXT,
      grade TEXT,
      state TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (location_id) REFERENCES locations(id)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      model TEXT,
      manufacturer TEXT,
      serial_number TEXT,
      asset_tag TEXT,
      status TEXT DEFAULT 'Available',
      calibration_date DATE,
      next_calibration DATE,
      purchase_date DATE,
      warranty_expiry DATE,
      cost REAL,
      manual_url TEXT,
      notes TEXT,
      location_id INTEGER,
      category TEXT,
      measurement_range TEXT,
      accuracy TEXT,
      resolution TEXT,
      measurement_units TEXT,
      operating_conditions TEXT,
      limitations TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (location_id) REFERENCES locations(id)
    )
  `);

  // Reservations table
  db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      user_email TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      start_time TEXT,
      end_time TEXT,
      purpose TEXT,
      notes TEXT,
      status TEXT DEFAULT 'confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    )
  `);

  // Budget items table
  db.run(`
    CREATE TABLE IF NOT EXISTS budget_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      item TEXT NOT NULL,
      vendor_model TEXT,
      description TEXT,
      cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Consumables table
  db.run(`
    CREATE TABLE IF NOT EXISTS consumables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      item TEXT NOT NULL,
      vendor TEXT,
      estimated_cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  saveDb();
}

// Middleware
app.use(cors());
app.use(express.json());

// File upload config
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// ===================== LOCATION ROUTES =====================

app.get('/api/locations', (req, res) => {
  try {
    const locations = queryAll('SELECT * FROM locations ORDER BY building, room, cabinet, shelf');
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/locations', (req, res) => {
  try {
    const { building, room, cabinet, shelf, bin } = req.body;
    const result = runSql(
      'INSERT INTO locations (building, room, cabinet, shelf, bin) VALUES (?, ?, ?, ?, ?)',
      [building, room, cabinet, shelf, bin]
    );
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/locations/:id', (req, res) => {
  try {
    runSql('DELETE FROM locations WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== CHEMICAL ROUTES =====================

app.get('/api/chemicals', (req, res) => {
  try {
    const { search, category, hazard, location } = req.query;
    let query = `
      SELECT c.*, l.building, l.room, l.cabinet, l.shelf, l.bin
      FROM chemicals c
      LEFT JOIN locations l ON c.location_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (c.name LIKE ? OR c.cas_number LIKE ? OR c.formula LIKE ? OR c.catalog_number LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (category) {
      query += ` AND c.category = ?`;
      params.push(category);
    }
    if (hazard) {
      query += ` AND c.hazard_class LIKE ?`;
      params.push(`%${hazard}%`);
    }
    if (location) {
      query += ` AND c.location_id = ?`;
      params.push(parseInt(location));
    }

    query += ` ORDER BY c.name`;
    const chemicals = queryAll(query, params);
    res.json(chemicals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chemicals/:id', (req, res) => {
  try {
    const chemical = queryOne(`
      SELECT c.*, l.building, l.room, l.cabinet, l.shelf, l.bin
      FROM chemicals c
      LEFT JOIN locations l ON c.location_id = l.id
      WHERE c.id = ?
    `, [parseInt(req.params.id)]);
    
    if (!chemical) {
      return res.status(404).json({ error: 'Chemical not found' });
    }
    res.json(chemical);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chemicals', (req, res) => {
  try {
    const fields = Object.keys(req.body).filter(k => req.body[k] !== undefined && req.body[k] !== '');
    const values = fields.map(k => req.body[k]);
    const placeholders = fields.map(() => '?').join(', ');
    
    const result = runSql(
      `INSERT INTO chemicals (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    );
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/chemicals/:id', (req, res) => {
  try {
    const fields = Object.keys(req.body).filter(k => k !== 'id' && k !== 'building' && k !== 'room' && k !== 'cabinet' && k !== 'shelf' && k !== 'bin');
    const values = fields.map(k => req.body[k]);
    const setClause = fields.map(k => `${k} = ?`).join(', ');
    
    runSql(
      `UPDATE chemicals SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, parseInt(req.params.id)]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/chemicals/:id', (req, res) => {
  try {
    runSql('DELETE FROM chemicals WHERE id = ?', [parseInt(req.params.id)]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== EQUIPMENT ROUTES =====================

app.get('/api/equipment', (req, res) => {
  try {
    const { search, category, status, location } = req.query;
    let query = `
      SELECT e.*, l.building, l.room, l.cabinet, l.shelf, l.bin
      FROM equipment e
      LEFT JOIN locations l ON e.location_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (e.name LIKE ? OR e.model LIKE ? OR e.serial_number LIKE ? OR e.manufacturer LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (category) {
      query += ` AND e.category = ?`;
      params.push(category);
    }
    if (status) {
      query += ` AND e.status = ?`;
      params.push(status);
    }
    if (location) {
      query += ` AND e.location_id = ?`;
      params.push(parseInt(location));
    }

    query += ` ORDER BY e.name`;
    const equipment = queryAll(query, params);
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/equipment/:id', (req, res) => {
  try {
    const equipment = queryOne(`
      SELECT e.*, l.building, l.room, l.cabinet, l.shelf, l.bin
      FROM equipment e
      LEFT JOIN locations l ON e.location_id = l.id
      WHERE e.id = ?
    `, [parseInt(req.params.id)]);
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/equipment', (req, res) => {
  try {
    const fields = Object.keys(req.body).filter(k => req.body[k] !== undefined && req.body[k] !== '');
    const values = fields.map(k => req.body[k]);
    const placeholders = fields.map(() => '?').join(', ');
    
    const result = runSql(
      `INSERT INTO equipment (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    );
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/equipment/:id', (req, res) => {
  try {
    const fields = Object.keys(req.body).filter(k => k !== 'id' && k !== 'building' && k !== 'room' && k !== 'cabinet' && k !== 'shelf' && k !== 'bin');
    const values = fields.map(k => req.body[k]);
    const setClause = fields.map(k => `${k} = ?`).join(', ');
    
    runSql(
      `UPDATE equipment SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, parseInt(req.params.id)]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/equipment/:id', (req, res) => {
  try {
    runSql('DELETE FROM equipment WHERE id = ?', [parseInt(req.params.id)]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== IMPORT ROUTES =====================

app.post('/api/import/:type', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const type = req.params.type;
    let imported = 0;

    const columnMapping = {
      'name': ['name', 'chemical name', 'chemical', 'product name', 'item name'],
      'cas_number': ['cas', 'cas number', 'cas#', 'cas no', 'cas no.'],
      'formula': ['formula', 'molecular formula', 'chemical formula'],
      'molecular_weight': ['mw', 'molecular weight', 'mol weight', 'mol. weight'],
      'quantity': ['quantity', 'qty', 'amount', 'stock'],
      'unit': ['unit', 'units', 'uom'],
      'hazard_class': ['hazard', 'hazard class', 'hazards', 'ghs'],
      'supplier': ['supplier', 'vendor', 'manufacturer', 'mfr'],
      'catalog_number': ['catalog', 'catalog number', 'cat#', 'cat no', 'product number'],
      'lot_number': ['lot', 'lot number', 'lot#', 'batch'],
      'category': ['category', 'type', 'class'],
      'purity': ['purity', 'grade', 'purity %'],
      'state': ['state', 'physical state', 'form'],
      'notes': ['notes', 'comments', 'remarks']
    };

    function findColumn(row, field) {
      const variations = columnMapping[field] || [field];
      for (const key of Object.keys(row)) {
        if (variations.includes(key.toLowerCase().trim())) {
          return row[key];
        }
      }
      return null;
    }

    if (type === 'chemicals') {
      for (const row of data) {
        const name = findColumn(row, 'name');
        if (name) {
          runSql(
            `INSERT INTO chemicals (name, cas_number, formula, molecular_weight, quantity, unit, hazard_class, supplier, catalog_number, lot_number, category, purity, state, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              name,
              findColumn(row, 'cas_number'),
              findColumn(row, 'formula'),
              findColumn(row, 'molecular_weight'),
              findColumn(row, 'quantity'),
              findColumn(row, 'unit'),
              findColumn(row, 'hazard_class'),
              findColumn(row, 'supplier'),
              findColumn(row, 'catalog_number'),
              findColumn(row, 'lot_number'),
              findColumn(row, 'category'),
              findColumn(row, 'purity'),
              findColumn(row, 'state'),
              findColumn(row, 'notes')
            ]
          );
          imported++;
        }
      }
    } else if (type === 'equipment') {
      for (const row of data) {
        const name = findColumn(row, 'name') || row['Name'] || row['Equipment'];
        if (name) {
          runSql(
            `INSERT INTO equipment (name, model, manufacturer, serial_number, status, category, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              name,
              row['Model'] || row['model'],
              row['Manufacturer'] || row['manufacturer'] || row['Brand'],
              row['Serial Number'] || row['serial_number'] || row['Serial'],
              row['Status'] || row['status'] || 'Available',
              row['Category'] || row['category'] || row['Type'],
              row['Notes'] || row['notes'] || row['Comments']
            ]
          );
          imported++;
        }
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ success: true, imported, total: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== STATS ROUTES =====================

app.get('/api/stats', (req, res) => {
  try {
    const chemicalCount = queryOne('SELECT COUNT(*) as count FROM chemicals')?.count || 0;
    const equipmentCount = queryOne('SELECT COUNT(*) as count FROM equipment')?.count || 0;
    const locationCount = queryOne('SELECT COUNT(*) as count FROM locations')?.count || 0;
    const lowStock = queryOne('SELECT COUNT(*) as count FROM chemicals WHERE quantity < 10')?.count || 0;
    const categories = queryAll('SELECT DISTINCT category FROM chemicals WHERE category IS NOT NULL');
    const hazardClasses = queryAll('SELECT DISTINCT hazard_class FROM chemicals WHERE hazard_class IS NOT NULL');

    res.json({
      chemicalCount,
      equipmentCount,
      locationCount,
      lowStock,
      categories: categories.map(c => c.category),
      hazardClasses: hazardClasses.map(h => h.hazard_class)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== RESERVATION ROUTES =====================

app.get('/api/reservations', (req, res) => {
  try {
    const { equipment_id, start_date, end_date } = req.query;
    let query = `
      SELECT r.*, e.name as equipment_name, e.model as equipment_model
      FROM reservations r
      LEFT JOIN equipment e ON r.equipment_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (equipment_id) {
      query += ` AND r.equipment_id = ?`;
      params.push(parseInt(equipment_id));
    }
    if (start_date) {
      query += ` AND r.end_date >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND r.start_date <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY r.start_date, r.start_time`;
    const reservations = queryAll(query, params);
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reservations/:id', (req, res) => {
  try {
    const reservation = queryOne(`
      SELECT r.*, e.name as equipment_name, e.model as equipment_model
      FROM reservations r
      LEFT JOIN equipment e ON r.equipment_id = e.id
      WHERE r.id = ?
    `, [parseInt(req.params.id)]);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reservations', (req, res) => {
  try {
    const { equipment_id, user_name, user_email, start_date, end_date, start_time, end_time, purpose, notes } = req.body;
    
    if (!equipment_id || !user_name || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for conflicts
    const conflicts = queryAll(`
      SELECT * FROM reservations 
      WHERE equipment_id = ? 
        AND status != 'cancelled'
        AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?) OR (start_date >= ? AND end_date <= ?))
    `, [equipment_id, end_date, start_date, start_date, start_date, start_date, end_date]);

    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'This equipment is already reserved for the selected dates' });
    }

    const result = runSql(
      `INSERT INTO reservations (equipment_id, user_name, user_email, start_date, end_date, start_time, end_time, purpose, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [equipment_id, user_name, user_email, start_date, end_date, start_time, end_time, purpose, notes]
    );

    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/reservations/:id', (req, res) => {
  try {
    const fields = Object.keys(req.body).filter(k => k !== 'id' && k !== 'equipment_name' && k !== 'equipment_model');
    const values = fields.map(k => req.body[k]);
    const setClause = fields.map(k => `${k} = ?`).join(', ');
    
    runSql(
      `UPDATE reservations SET ${setClause} WHERE id = ?`,
      [...values, parseInt(req.params.id)]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/reservations/:id', (req, res) => {
  try {
    runSql('DELETE FROM reservations WHERE id = ?', [parseInt(req.params.id)]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// BUDGET API
// ============================================================
app.get('/api/budget', (req, res) => {
  try {
    const items = queryAll('SELECT * FROM budget_items ORDER BY category, item');
    const summary = queryAll(`
      SELECT category, SUM(cost) as total_cost, COUNT(*) as item_count 
      FROM budget_items 
      GROUP BY category 
      ORDER BY total_cost DESC
    `);
    res.json({ items, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/budget', (req, res) => {
  try {
    const { category, item, vendor_model, description, cost } = req.body;
    const result = runSql(
      `INSERT INTO budget_items (category, item, vendor_model, description, cost)
       VALUES (?, ?, ?, ?, ?)`,
      [category, item, vendor_model, description, cost]
    );
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// CONSUMABLES API
// ============================================================
app.get('/api/consumables', (req, res) => {
  try {
    const items = queryAll('SELECT * FROM consumables ORDER BY category, item');
    const summary = queryAll(`
      SELECT category, SUM(estimated_cost) as total_cost, COUNT(*) as item_count 
      FROM consumables 
      GROUP BY category 
      ORDER BY category
    `);
    res.json({ items, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/consumables', (req, res) => {
  try {
    const { category, item, vendor, estimated_cost } = req.body;
    const result = runSql(
      `INSERT INTO consumables (category, item, vendor, estimated_cost)
       VALUES (?, ?, ?, ?)`,
      [category, item, vendor, estimated_cost]
    );
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🧪 Lab Inventory Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
