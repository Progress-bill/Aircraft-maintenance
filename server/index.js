import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db, { initDatabase } from './database.js';
import { authenticateToken, requireAdmin, requireStaff, JWT_SECRET } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database and seed if empty
initDatabase();

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid aviation credentials.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'This technician/personnel account has been deactivated. Contact the Administrator.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      license_number: user.license_number
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Authentication successful. Welcome aboard.',
      token,
      user: payload
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// Current User Profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, status, license_number, created_at, last_login FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// ==========================================
// ADMIN USER MANAGEMENT ROUTES (Admin only)
// ==========================================

// Get all users
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, status, license_number, created_at, last_login
      FROM users
      ORDER BY created_at DESC
    `).all();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user accounts.' });
  }
});

// Create new user (Admin action)
app.post('/api/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, email, password, role, license_number, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and temporary password are required.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const userRole = role || 'technician';
    const userStatus = status || 'active';

    const result = db.prepare(`
      INSERT INTO users (name, email, password, role, status, license_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name.trim(), email.trim().toLowerCase(), hashedPassword, userRole, userStatus, license_number || null);

    const newUser = db.prepare('SELECT id, name, email, role, status, license_number, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: `User ${name} successfully registered with ${userRole} clearance.`,
      user: newUser
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user account.' });
  }
});

// Update user details / role / status (Admin action)
app.put('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, license_number, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'Target user account not found.' });
    }

    let query = 'UPDATE users SET name = ?, email = ?, role = ?, status = ?, license_number = ?';
    const params = [
      name || user.name,
      email ? email.toLowerCase().trim() : user.email,
      role || user.role,
      status || user.status,
      license_number !== undefined ? license_number : user.license_number
    ];

    if (password && password.trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password.trim(), salt);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    db.prepare(query).run(...params);

    const updated = db.prepare('SELECT id, name, email, role, status, license_number, created_at, last_login FROM users WHERE id = ?').get(id);

    res.json({ message: 'User updated successfully.', user: updated });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user account.' });
  }
});

// Delete user (Admin action)
app.delete('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot terminate your own active administrator account.' });
    }

    const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    res.json({ message: `User account for ${user.name} removed successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// ==========================================
// FLEET & AIRCRAFT ROUTES
// ==========================================

// Get all aircraft with statistics & counts
app.get('/api/aircraft', authenticateToken, (req, res) => {
  try {
    const aircraftList = db.prepare(`
      SELECT a.*,
        (SELECT COUNT(*) FROM maintenance_records WHERE aircraft_id = a.id) AS total_records_count,
        (SELECT COUNT(*) FROM maintenance_records WHERE aircraft_id = a.id AND status = 'in_progress') AS active_work_orders_count,
        (SELECT AVG(health_percent) FROM aircraft_subsystems WHERE aircraft_id = a.id) AS avg_health_score
      FROM aircraft a
      ORDER BY a.tail_number ASC
    `).all();

    res.json({ aircraft: aircraftList });
  } catch (err) {
    console.error('Fetch aircraft error:', err);
    res.status(500).json({ error: 'Failed to retrieve aircraft fleet.' });
  }
});

// Get single aircraft with full subsystems & maintenance logs
app.get('/api/aircraft/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const aircraft = db.prepare('SELECT * FROM aircraft WHERE id = ?').get(id);

    if (!aircraft) {
      return res.status(404).json({ error: 'Aircraft record not found.' });
    }

    const subsystems = db.prepare('SELECT * FROM aircraft_subsystems WHERE aircraft_id = ? ORDER BY id ASC').all(id);
    const records = db.prepare('SELECT * FROM maintenance_records WHERE aircraft_id = ? ORDER BY service_date DESC, id DESC').all(id);

    res.json({
      aircraft,
      subsystems,
      records
    });
  } catch (err) {
    console.error('Fetch single aircraft error:', err);
    res.status(500).json({ error: 'Failed to retrieve aircraft records.' });
  }
});

// Add new aircraft (Admin or Staff)
app.post('/api/aircraft', authenticateToken, requireStaff, (req, res) => {
  try {
    const {
      tail_number,
      model,
      manufacturer,
      serial_number,
      year,
      total_hours,
      total_cycles,
      status,
      location,
      assigned_engineer,
      next_inspection_type,
      next_inspection_date,
      next_inspection_hours,
      image_url
    } = req.body;

    if (!tail_number || !model || !manufacturer) {
      return res.status(400).json({ error: 'Tail number, model, and manufacturer are required.' });
    }

    const existing = db.prepare('SELECT id FROM aircraft WHERE UPPER(tail_number) = UPPER(?)').get(tail_number.trim());
    if (existing) {
      return res.status(400).json({ error: `Aircraft with registration ${tail_number.toUpperCase()} already exists in fleet.` });
    }

    const insert = db.prepare(`
      INSERT INTO aircraft (
        tail_number, model, manufacturer, serial_number, year,
        total_hours, total_cycles, status, location, assigned_engineer,
        next_inspection_type, next_inspection_date, next_inspection_hours, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      tail_number.trim().toUpperCase(),
      model.trim(),
      manufacturer.trim(),
      serial_number ? serial_number.trim() : 'N/A',
      parseInt(year) || new Date().getFullYear(),
      parseFloat(total_hours) || 0.0,
      parseInt(total_cycles) || 0,
      status || 'operational',
      location || 'Hangar Alpha',
      assigned_engineer || req.user.name,
      next_inspection_type || 'A-Check',
      next_inspection_date || null,
      parseFloat(next_inspection_hours) || (parseFloat(total_hours) || 0) + 500,
      image_url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80'
    );

    const newAircraftId = result.lastInsertRowid;

    // Seed default subsystems for the new aircraft
    const insertSubsystem = db.prepare(`
      INSERT INTO aircraft_subsystems (aircraft_id, system_name, health_percent, hours_since_overhaul, tbo_hours, status, last_inspected_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE, ?)
    `);

    const defaultSystems = [
      { name: 'Turbofan Engine #1 (Left)', health: 100, hours: 0, tbo: 5000, status: 'good', notes: 'Initial commissioning check nominal' },
      { name: 'Turbofan Engine #2 (Right)', health: 100, hours: 0, tbo: 5000, status: 'good', notes: 'Initial commissioning check nominal' },
      { name: 'Auxiliary Power Unit (APU)', health: 100, hours: 0, tbo: 4000, status: 'good', notes: 'Run test passed' },
      { name: 'Landing Gear & Brake Assemblies', health: 100, hours: 0, tbo: 4500, status: 'good', notes: 'Brake packs calibrated' },
      { name: 'Avionics, TCAS & Navigation Suites', health: 100, hours: 0, tbo: 8000, status: 'good', notes: 'Full avionics pass' },
      { name: 'Hydraulic System & Pressurization', health: 100, hours: 0, tbo: 5000, status: 'good', notes: 'High-pressure check passed' }
    ];

    defaultSystems.forEach(sys => {
      insertSubsystem.run(newAircraftId, sys.name, sys.health, sys.hours, sys.tbo, sys.status, sys.notes);
    });

    const created = db.prepare('SELECT * FROM aircraft WHERE id = ?').get(newAircraftId);
    res.status(201).json({ message: `Aircraft ${created.tail_number} added to fleet successfully.`, aircraft: created });
  } catch (err) {
    console.error('Create aircraft error:', err);
    res.status(500).json({ error: 'Failed to add aircraft to fleet.' });
  }
});

// Update aircraft details
app.put('/api/aircraft/:id', authenticateToken, requireStaff, (req, res) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT * FROM aircraft WHERE id = ?').get(id);

    if (!current) {
      return res.status(404).json({ error: 'Aircraft not found.' });
    }

    const {
      tail_number,
      model,
      manufacturer,
      serial_number,
      year,
      total_hours,
      total_cycles,
      status,
      location,
      assigned_engineer,
      next_inspection_type,
      next_inspection_date,
      next_inspection_hours,
      image_url
    } = req.body;

    db.prepare(`
      UPDATE aircraft SET
        tail_number = ?,
        model = ?,
        manufacturer = ?,
        serial_number = ?,
        year = ?,
        total_hours = ?,
        total_cycles = ?,
        status = ?,
        location = ?,
        assigned_engineer = ?,
        next_inspection_type = ?,
        next_inspection_date = ?,
        next_inspection_hours = ?,
        image_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      tail_number !== undefined ? tail_number.toUpperCase().trim() : current.tail_number,
      model || current.model,
      manufacturer || current.manufacturer,
      serial_number || current.serial_number,
      year !== undefined ? parseInt(year) : current.year,
      total_hours !== undefined ? parseFloat(total_hours) : current.total_hours,
      total_cycles !== undefined ? parseInt(total_cycles) : current.total_cycles,
      status || current.status,
      location || current.location,
      assigned_engineer || current.assigned_engineer,
      next_inspection_type || current.next_inspection_type,
      next_inspection_date !== undefined ? next_inspection_date : current.next_inspection_date,
      next_inspection_hours !== undefined ? parseFloat(next_inspection_hours) : current.next_inspection_hours,
      image_url || current.image_url,
      id
    );

    const updated = db.prepare('SELECT * FROM aircraft WHERE id = ?').get(id);
    res.json({ message: 'Aircraft specifications updated.', aircraft: updated });
  } catch (err) {
    console.error('Update aircraft error:', err);
    res.status(500).json({ error: 'Failed to update aircraft.' });
  }
});

// Delete aircraft (Admin only)
app.delete('/api/aircraft/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT tail_number FROM aircraft WHERE id = ?').get(id);

    if (!current) {
      return res.status(404).json({ error: 'Aircraft not found.' });
    }

    db.prepare('DELETE FROM aircraft WHERE id = ?').run(id);
    res.json({ message: `Aircraft ${current.tail_number} and all associated maintenance history decommissioned.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete aircraft.' });
  }
});

// ==========================================
// MAINTENANCE LOG RECORD ROUTES
// ==========================================

// Add maintenance record to an aircraft
app.post('/api/aircraft/:id/records', authenticateToken, requireStaff, (req, res) => {
  try {
    const { id } = req.params;
    const aircraft = db.prepare('SELECT * FROM aircraft WHERE id = ?').get(id);

    if (!aircraft) {
      return res.status(404).json({ error: 'Aircraft record not found.' });
    }

    const {
      work_order_number,
      title,
      type,
      category,
      service_date,
      hours_at_service,
      cycles_at_service,
      technician_name,
      technician_license,
      findings,
      corrective_action,
      parts_replaced,
      status,
      signoff_by,
      signoff_date,
      next_due_date,
      next_due_hours,
      notes,
      update_aircraft_hours
    } = req.body;

    if (!title || !findings || !corrective_action) {
      return res.status(400).json({ error: 'Title, findings description, and corrective action are required.' });
    }

    const woNum = work_order_number || `WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = db.prepare(`
      INSERT INTO maintenance_records (
        aircraft_id, work_order_number, title, type, category, service_date,
        hours_at_service, cycles_at_service, technician_name, technician_license,
        findings, corrective_action, parts_replaced, status, signoff_by, signoff_date,
        next_due_date, next_due_hours, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      woNum,
      title,
      type || 'scheduled',
      category || 'Routine Check',
      service_date || new Date().toISOString().split('T')[0],
      parseFloat(hours_at_service) || aircraft.total_hours,
      parseInt(cycles_at_service) || aircraft.total_cycles,
      technician_name || req.user.name,
      technician_license || req.user.license_number || 'TECH-AUTH',
      findings,
      corrective_action,
      parts_replaced || 'None',
      status || 'completed',
      signoff_by || (status === 'completed' ? req.user.name : null),
      signoff_date || (status === 'completed' ? new Date().toISOString().split('T')[0] : null),
      next_due_date || null,
      next_due_hours ? parseFloat(next_due_hours) : null,
      notes || ''
    );

    // Optionally update aircraft flight hours or status if specified
    if (update_aircraft_hours && parseFloat(hours_at_service) > aircraft.total_hours) {
      db.prepare('UPDATE aircraft SET total_hours = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(parseFloat(hours_at_service), id);
    }

    if (next_due_date) {
      db.prepare('UPDATE aircraft SET next_inspection_date = ? WHERE id = ?').run(next_due_date, id);
    }

    if (next_due_hours) {
      db.prepare('UPDATE aircraft SET next_inspection_hours = ? WHERE id = ?').run(parseFloat(next_due_hours), id);
    }

    const createdRecord = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Maintenance record logged successfully.', record: createdRecord });
  } catch (err) {
    console.error('Add maintenance record error:', err);
    res.status(500).json({ error: 'Failed to log maintenance record.' });
  }
});

// Update maintenance record (e.g. sign-off, update status)
app.put('/api/records/:id', authenticateToken, requireStaff, (req, res) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id);

    if (!current) {
      return res.status(404).json({ error: 'Maintenance record not found.' });
    }

    const {
      title,
      type,
      category,
      findings,
      corrective_action,
      parts_replaced,
      status,
      signoff_by,
      signoff_date,
      next_due_date,
      next_due_hours,
      notes
    } = req.body;

    db.prepare(`
      UPDATE maintenance_records SET
        title = ?,
        type = ?,
        category = ?,
        findings = ?,
        corrective_action = ?,
        parts_replaced = ?,
        status = ?,
        signoff_by = ?,
        signoff_date = ?,
        next_due_date = ?,
        next_due_hours = ?,
        notes = ?
      WHERE id = ?
    `).run(
      title || current.title,
      type || current.type,
      category || current.category,
      findings || current.findings,
      corrective_action || current.corrective_action,
      parts_replaced !== undefined ? parts_replaced : current.parts_replaced,
      status || current.status,
      signoff_by !== undefined ? signoff_by : current.signoff_by,
      signoff_date !== undefined ? signoff_date : current.signoff_date,
      next_due_date !== undefined ? next_due_date : current.next_due_date,
      next_due_hours !== undefined ? parseFloat(next_due_hours) : current.next_due_hours,
      notes !== undefined ? notes : current.notes,
      id
    );

    const updated = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id);
    res.json({ message: 'Record updated successfully.', record: updated });
  } catch (err) {
    console.error('Update record error:', err);
    res.status(500).json({ error: 'Failed to update record.' });
  }
});

// Delete maintenance record (Admin only)
app.delete('/api/records/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM maintenance_records WHERE id = ?').run(id);
    res.json({ message: 'Maintenance record deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete maintenance record.' });
  }
});

// Update Subsystem Health & Inspection
app.put('/api/subsystems/:id', authenticateToken, requireStaff, (req, res) => {
  try {
    const { id } = req.params;
    const { health_percent, hours_since_overhaul, status, notes } = req.body;

    db.prepare(`
      UPDATE aircraft_subsystems SET
        health_percent = COALESCE(?, health_percent),
        hours_since_overhaul = COALESCE(?, hours_since_overhaul),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        last_inspected_date = CURRENT_DATE
      WHERE id = ?
    `).run(health_percent, hours_since_overhaul, status, notes, id);

    const updated = db.prepare('SELECT * FROM aircraft_subsystems WHERE id = ?').get(id);
    res.json({ message: 'Subsystem parameters updated.', subsystem: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update subsystem status.' });
  }
});

// Overview Statistics API
app.get('/api/stats', authenticateToken, (req, res) => {
  try {
    const totalAircraft = db.prepare('SELECT COUNT(*) as count FROM aircraft').get().count;
    const operationalAircraft = db.prepare("SELECT COUNT(*) as count FROM aircraft WHERE status = 'operational'").get().count;
    const inMaintenance = db.prepare("SELECT COUNT(*) as count FROM aircraft WHERE status = 'maintenance'").get().count;
    const inspectionDue = db.prepare("SELECT COUNT(*) as count FROM aircraft WHERE status = 'inspection_due'").get().count;
    const grounded = db.prepare("SELECT COUNT(*) as count FROM aircraft WHERE status = 'grounded'").get().count;

    const totalHours = db.prepare('SELECT SUM(total_hours) as sum FROM aircraft').get().sum || 0;
    const totalRecords = db.prepare('SELECT COUNT(*) as count FROM maintenance_records').get().count;
    const activeWorkOrders = db.prepare("SELECT COUNT(*) as count FROM maintenance_records WHERE status = 'in_progress'").get().count;
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    res.json({
      totalAircraft,
      operationalAircraft,
      inMaintenance,
      inspectionDue,
      grounded,
      totalHours: Math.round(totalHours * 10) / 10,
      totalRecords,
      activeWorkOrders,
      totalUsers,
      fleetReadinessPercent: totalAircraft > 0 ? Math.round((operationalAircraft / totalAircraft) * 100) : 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate fleet statistics.' });
  }
});

// Test health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', system: 'Nero Aircraft Maintenance System API', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✈️ Nero Aircraft Maintenance Server listening on port ${PORT}`);
});
