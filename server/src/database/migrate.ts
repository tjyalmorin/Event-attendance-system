import pool from '../config/database.js';

const createTables = async (): Promise<void> => {
  try {
    console.log('Creating database tables...');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'data_analyst')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        venue VARCHAR(200),
        allowed_checkout_time TIME NOT NULL,
        registration_link VARCHAR(255) UNIQUE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Participants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS participants (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        agent_code VARCHAR(50) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        branch_name VARCHAR(100) NOT NULL,
        team_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        photo_url TEXT,
        qr_code VARCHAR(255) UNIQUE NOT NULL,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, agent_code)
      );
    `);

    // Attendance table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        check_in_time TIMESTAMP,
        check_out_time TIMESTAMP,
        status VARCHAR(20) CHECK (status IN ('checked_in', 'checked_out', 'early_out', 'completed')),
        duration_minutes INTEGER,
        early_checkout_reason VARCHAR(50),
        early_checkout_notes TEXT,
        approved_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(participant_id, event_id)
      );
    `);

    // Indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_event ON participants(event_id);
      CREATE INDEX IF NOT EXISTS idx_participants_qr ON participants(qr_code);
      CREATE INDEX IF NOT EXISTS idx_attendance_participant ON attendance(participant_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);
    `);

    console.log('✅ All tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
};

createTables();
