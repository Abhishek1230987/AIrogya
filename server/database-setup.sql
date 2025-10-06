-- PostgreSQL Database Setup for E-Consultancy
-- Run this script as the postgres superuser

-- Create the database
CREATE DATABASE e_consultancy;

-- Create application user
CREATE USER consultancy_user WITH ENCRYPTED PASSWORD 'consultancy_2025';

-- Grant database privileges
GRANT ALL PRIVILEGES ON DATABASE e_consultancy TO consultancy_user;

-- Connect to the new database
\c e_consultancy;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO consultancy_user;

-- Create tables (these will also be created automatically by the application)

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    profile_picture TEXT,
    role VARCHAR(20) DEFAULT 'patient',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical history table
CREATE TABLE IF NOT EXISTS medical_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_type VARCHAR(10),
    height_cm INTEGER,
    weight_kg INTEGER,
    chronic_conditions JSONB DEFAULT '[]'::jsonb,
    current_medications JSONB DEFAULT '[]'::jsonb,
    allergies JSONB DEFAULT '[]'::jsonb,
    family_history JSONB DEFAULT '{}'::jsonb,
    smoking_status VARCHAR(20),
    drinking_status VARCHAR(20),
    exercise_frequency VARCHAR(50),
    emergency_contact JSONB DEFAULT '{}'::jsonb,
    additional_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical reports table
CREATE TABLE IF NOT EXISTS medical_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    extracted_info JSONB DEFAULT '{}'::jsonb,
    processing_status VARCHAR(20) DEFAULT 'pending',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consultations table
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES users(id),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    symptoms TEXT NOT NULL,
    diagnosis TEXT,
    prescription TEXT,
    doctor_notes TEXT,
    language_used VARCHAR(10) DEFAULT 'en',
    audio_recording TEXT,
    transcription TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for express-session
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
)
WITH (OIDS=FALSE);

-- Add primary key and index for sessions
ALTER TABLE sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_medical_history_user_id ON medical_history(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_user_id ON medical_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);

-- Set ownership of tables to application user
ALTER TABLE users OWNER TO consultancy_user;
ALTER TABLE medical_history OWNER TO consultancy_user;
ALTER TABLE medical_reports OWNER TO consultancy_user;
ALTER TABLE consultations OWNER TO consultancy_user;
ALTER TABLE sessions OWNER TO consultancy_user;

-- Grant sequence privileges
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO consultancy_user;

COMMENT ON DATABASE e_consultancy IS 'E-Consultancy Platform Database';
COMMENT ON TABLE users IS 'User accounts and profiles';
COMMENT ON TABLE medical_history IS 'Patient medical history and health information';
COMMENT ON TABLE medical_reports IS 'Uploaded medical reports and documents';
COMMENT ON TABLE consultations IS 'Medical consultations and appointments';
COMMENT ON TABLE sessions IS 'Express session storage';

-- Display setup completion message
SELECT 'PostgreSQL database setup completed successfully!' as message;