import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'nero_aircraft.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'technician',
      status TEXT NOT NULL DEFAULT 'active',
      license_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS aircraft (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tail_number TEXT UNIQUE NOT NULL,
      model TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      serial_number TEXT NOT NULL,
      year INTEGER NOT NULL,
      total_hours REAL NOT NULL DEFAULT 0.0,
      total_cycles INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'operational',
      location TEXT NOT NULL,
      assigned_engineer TEXT,
      next_inspection_type TEXT,
      next_inspection_date TEXT,
      next_inspection_hours REAL,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS maintenance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aircraft_id INTEGER NOT NULL,
      work_order_number TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      service_date TEXT NOT NULL,
      hours_at_service REAL NOT NULL,
      cycles_at_service INTEGER,
      technician_name TEXT NOT NULL,
      technician_license TEXT,
      findings TEXT NOT NULL,
      corrective_action TEXT NOT NULL,
      parts_replaced TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      signoff_by TEXT,
      signoff_date TEXT,
      next_due_date TEXT,
      next_due_hours REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS aircraft_subsystems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aircraft_id INTEGER NOT NULL,
      system_name TEXT NOT NULL,
      health_percent INTEGER NOT NULL DEFAULT 100,
      hours_since_overhaul REAL NOT NULL DEFAULT 0.0,
      tbo_hours REAL NOT NULL DEFAULT 3500.0,
      status TEXT NOT NULL DEFAULT 'good',
      last_inspected_date TEXT,
      notes TEXT,
      FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE CASCADE
    );
  `);

  seedData();
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  if (userCount === 0) {
    console.log('Seeding initial admin and users...');
    const salt = bcrypt.genSaltSync(10);
    const adminPassword = bcrypt.hashSync('Admin@123', salt);
    const techPassword = bcrypt.hashSync('Tech@123', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password, role, status, license_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('Chief Administrator', 'admin@nero.aero', adminPassword, 'admin', 'active', 'AERO-ADM-001');
    insertUser.run('Prudence Murau (Lead Tech)', 'prudence@nero.aero', techPassword, 'engineer', 'active', 'FAA-A&P-982144');
    insertUser.run('Alexandre Renault (Inspector)', 'alex.renault@nero.aero', techPassword, 'inspector', 'active', 'EASA-PART66-7731');
    console.log('Seeded users: admin@nero.aero / Admin@123');
  }

  const aircraftCount = db.prepare('SELECT COUNT(*) as count FROM aircraft').get().count;

  if (aircraftCount === 0) {
    console.log('Seeding initial aircraft fleet and maintenance records...');

    const insertAircraft = db.prepare(`
      INSERT INTO aircraft (
        tail_number, model, manufacturer, serial_number, year, total_hours, total_cycles,
        status, location, assigned_engineer, next_inspection_type, next_inspection_date,
        next_inspection_hours, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const ac1 = insertAircraft.run(
      'NR-B738',
      'Boeing 737-800 Next-Gen',
      'The Boeing Company',
      'MSN-39824',
      2018,
      4820.5,
      3140,
      'operational',
      'Hangar Alpha - Bay 1',
      'Prudence Murau',
      'A-Check (600hr)',
      '2026-11-20',
      5000.0,
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80'
    );

    const ac2 = insertAircraft.run(
      'NR-A320',
      'Airbus A320neo',
      'Airbus SAS',
      'MSN-9104',
      2020,
      3215.2,
      2110,
      'maintenance',
      'Hangar Bravo - Service Dock',
      'Alexandre Renault',
      'B-Check Subsystem Overhaul',
      '2026-10-22',
      3400.0,
      'https://images.unsplash.com/photo-1520437358207-323b43b50729?w=600&auto=format&fit=crop&q=80'
    );

    const ac3 = insertAircraft.run(
      'NR-C525',
      'Cessna Citation CJ4',
      'Textron Aviation',
      '525C-0312',
      2022,
      940.8,
      780,
      'operational',
      'Executive Hangar - Bay 4',
      'Prudence Murau',
      '100-Hour Phase Inspection',
      '2026-12-05',
      1000.0,
      'https://images.unsplash.com/photo-1583073036531-15545f956c36?w=600&auto=format&fit=crop&q=80'
    );

    const ac4 = insertAircraft.run(
      'NR-K350',
      'Beechcraft King Air 350i',
      'Beechcraft Corp',
      'FL-1190',
      2019,
      2680.0,
      1945,
      'inspection_due',
      'Maintenance Hangar - Stand 3',
      'Prudence Murau',
      'Landing Gear Actuator Recertification',
      '2026-10-18',
      2700.0,
      'https://images.unsplash.com/photo-1519074069444-1ba4e3a47942?w=600&auto=format&fit=crop&q=80'
    );

    const insertRecord = db.prepare(`
      INSERT INTO maintenance_records (
        aircraft_id, work_order_number, title, type, category, service_date,
        hours_at_service, cycles_at_service, technician_name, technician_license,
        findings, corrective_action, parts_replaced, status, signoff_by, signoff_date,
        next_due_date, next_due_hours, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Logs for Boeing 737-800
    insertRecord.run(
      ac1.lastInsertRowid,
      'WO-2026-0412',
      'Routine A-Check & Engine Oil Replenishment',
      'scheduled',
      'A-Check',
      '2026-09-14',
      4710.0,
      3080,
      'Prudence Murau',
      'FAA-A&P-982144',
      'Engine oil filter Delta-P within limits. Slight tire tread wear on Left Main outer tire.',
      'Replenished Mobil Jet II oil. Replaced engine igniters as part of scheduled cycle. All tests nominal.',
      'Igniter Plugs (PN: CH34055), Mobil Jet Oil II (4 Qts)',
      'completed',
      'Alexandre Renault',
      '2026-09-15',
      '2026-11-20',
      5000.0,
      'Aircraft cleared for commercial revenue service.'
    );

    insertRecord.run(
      ac1.lastInsertRowid,
      'WO-2026-0389',
      'Weather Radar Transceiver Calibration',
      'avionics',
      'Avionics',
      '2026-08-02',
      4580.0,
      2990,
      'Alexandre Renault',
      'EASA-PART66-7731',
      'Pilot reported intermittent target display on Collins Multiscan Radar at FL350.',
      'Bench tested R/T unit. Cleaned coaxial connectors, recalibrated antenna tilt sensor. Flight line BITE test passed.',
      'Antenna RF Coax O-Ring Seal Kit',
      'completed',
      'Prudence Murau',
      '2026-08-02',
      '2027-08-02',
      null,
      'Squawk cleared.'
    );

    // Logs for Airbus A320neo
    insertRecord.run(
      ac2.lastInsertRowid,
      'WO-2026-0501',
      'Hydraulic Yellow System Accumulator Pressure Drop',
      'unscheduled',
      'Hydraulics',
      '2026-10-15',
      3215.2,
      2110,
      'Prudence Murau',
      'FAA-A&P-982144',
      'Yellow system brake accumulator pre-charge dropped to 1450 PSI (nominal 2050 PSI). Minor seepage noted at B-nut seal.',
      'Depressurized system. Replaced check valve and manifold seal. Nitrogen pre-charge recharged to 2060 PSI. Pressure decay test 30 mins zero leakage.',
      'Check Valve (PN: ABS-2041), O-Ring Seal Kit',
      'in_progress',
      null,
      null,
      '2026-10-22',
      3400.0,
      'Awaiting final signoff following second engine run-up check.'
    );

    // Logs for Cessna Citation CJ4
    insertRecord.run(
      ac3.lastInsertRowid,
      'WO-2026-0210',
      'Pre-Flight 100-Hour Annual Airframe & Avionics Inspection',
      'scheduled',
      'Airframe',
      '2026-07-10',
      880.0,
      720,
      'Prudence Murau',
      'FAA-A&P-982144',
      'All structural points inspected. Flap track roller guides lubricated. Emergency battery pack test OK.',
      'Performed full lubrication per AMM Chapter 12. Installed firmware update on Pro Line 21 cockpit display.',
      'Aeroshell Grease 22, Hydraulic fluid Royco 756',
      'completed',
      'Alexandre Renault',
      '2026-07-11',
      '2026-12-05',
      1000.0,
      'Clean inspection. No discrepancies noted.'
    );

    // Subsystems for all aircraft
    const insertSubsystem = db.prepare(`
      INSERT INTO aircraft_subsystems (
        aircraft_id, system_name, health_percent, hours_since_overhaul, tbo_hours, status, last_inspected_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultSystems = [
      { name: 'CFM LEAP-1B / Turbofan #1', health: 96, hours: 1420, tbo: 6000, status: 'good', notes: 'EGT margins healthy (+24C)' },
      { name: 'CFM LEAP-1B / Turbofan #2', health: 94, hours: 1420, tbo: 6000, status: 'good', notes: 'Compressor wash completed' },
      { name: 'Auxiliary Power Unit (APU)', health: 88, hours: 2100, tbo: 4500, status: 'good', notes: 'Oil level nominal' },
      { name: 'Main Landing Gear & Brakes', health: 82, hours: 3140, tbo: 5000, status: 'monitor', notes: 'Brake wear pin remaining 35%' },
      { name: 'Avionics Suite & FMS', health: 99, hours: 4820, tbo: 10000, status: 'good', notes: 'Nav database cycle 2610 active' },
      { name: 'Hydraulic System (A & B)', health: 91, hours: 1200, tbo: 5000, status: 'good', notes: 'Filter differential normal' },
      { name: 'Cabin Pressurization Outflow', health: 95, hours: 2300, tbo: 6000, status: 'good', notes: 'Controller diaphragm tested' }
    ];

    [ac1.lastInsertRowid, ac2.lastInsertRowid, ac3.lastInsertRowid, ac4.lastInsertRowid].forEach((acid) => {
      defaultSystems.forEach(sys => {
        insertSubsystem.run(
          acid,
          sys.name,
          sys.health,
          sys.hours,
          sys.tbo,
          sys.status,
          '2026-09-14',
          sys.notes
        );
      });
    });

    console.log('Seeded aircraft fleet and maintenance subsystem trackers successfully.');
  }
}

export default db;
