-- Voice Consultations Database Schema
-- This script creates tables for storing voice consultations with cloud file references

-- Table for storing voice consultation records
CREATE TABLE IF NOT EXISTS voice_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Audio file information
    audio_file_id VARCHAR(255) UNIQUE NOT NULL,
    audio_cloud_url TEXT NOT NULL,
    audio_filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500),
    file_size_bytes INTEGER,
    duration_seconds DECIMAL(10,2),
    
    -- Transcription data
    original_text TEXT,
    translated_text TEXT,
    detected_language VARCHAR(50),
    transcription_confidence DECIMAL(5,4),
    
    -- AI Response
    ai_response TEXT NOT NULL,
    ai_model_used VARCHAR(100) DEFAULT 'gpt-4',
    
    -- Patient context
    patient_age INTEGER,
    patient_gender VARCHAR(20),
    symptoms_category VARCHAR(100),
    urgency_level VARCHAR(20) DEFAULT 'normal',
    
    -- Processing metadata
    processing_status VARCHAR(50) DEFAULT 'completed',
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexing for performance
    CONSTRAINT valid_urgency CHECK (urgency_level IN ('low', 'normal', 'high', 'emergency')),
    CONSTRAINT valid_gender CHECK (patient_gender IN ('male', 'female', 'other', 'prefer_not_to_say'))
);

-- Table for storing language detection and translation logs
CREATE TABLE IF NOT EXISTS transcription_logs (
    id SERIAL PRIMARY KEY,
    consultation_id UUID REFERENCES voice_consultations(id) ON DELETE CASCADE,
    
    -- Speech-to-text details
    speech_service_used VARCHAR(50) DEFAULT 'google-speech',
    language_code VARCHAR(10),
    confidence_score DECIMAL(5,4),
    word_count INTEGER,
    
    -- Translation details
    translation_service VARCHAR(50) DEFAULT 'openai',
    source_language VARCHAR(50),
    target_language VARCHAR(50) DEFAULT 'English',
    
    -- Processing times
    transcription_time_ms INTEGER,
    translation_time_ms INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing AI model responses and performance
CREATE TABLE IF NOT EXISTS ai_response_logs (
    id SERIAL PRIMARY KEY,
    consultation_id UUID REFERENCES voice_consultations(id) ON DELETE CASCADE,
    
    -- AI model details
    model_name VARCHAR(100),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    response_time_ms INTEGER,
    
    -- Response quality metrics
    response_length_chars INTEGER,
    contains_disclaimer BOOLEAN DEFAULT true,
    mentions_professional_help BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for patient feedback on consultations
CREATE TABLE IF NOT EXISTS consultation_feedback (
    id SERIAL PRIMARY KEY,
    consultation_id UUID REFERENCES voice_consultations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Feedback ratings (1-5 scale)
    transcription_accuracy INTEGER CHECK (transcription_accuracy BETWEEN 1 AND 5),
    translation_quality INTEGER CHECK (translation_quality BETWEEN 1 AND 5),
    ai_response_helpfulness INTEGER CHECK (ai_response_helpfulness BETWEEN 1 AND 5),
    overall_satisfaction INTEGER CHECK (overall_satisfaction BETWEEN 1 AND 5),
    
    -- Text feedback
    feedback_text TEXT,
    improvement_suggestions TEXT,
    
    -- Follow-up actions
    consulted_doctor BOOLEAN DEFAULT false,
    symptoms_resolved BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_voice_consultations_user_id ON voice_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_consultations_created_at ON voice_consultations(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_consultations_language ON voice_consultations(detected_language);
CREATE INDEX IF NOT EXISTS idx_voice_consultations_urgency ON voice_consultations(urgency_level);
CREATE INDEX IF NOT EXISTS idx_transcription_logs_consultation_id ON transcription_logs(consultation_id);
CREATE INDEX IF NOT EXISTS idx_ai_response_logs_consultation_id ON ai_response_logs(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_feedback_consultation_id ON consultation_feedback(consultation_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_voice_consultations_updated_at 
    BEFORE UPDATE ON voice_consultations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO voice_consultations (
    user_id, 
    audio_file_id, 
    audio_cloud_url, 
    audio_filename,
    original_filename,
    original_text,
    translated_text,
    detected_language,
    transcription_confidence,
    ai_response,
    patient_age,
    patient_gender,
    symptoms_category
) VALUES (
    1,
    'sample-voice-001',
    'gs://e-consultancy-voice-files/voice-recordings/2025-09-29-sample-001.webm',
    'voice-recordings/2025-09-29-sample-001.webm',
    'user_recording.webm',
    'मुझे सिर में बहुत दर्द हो रहा है',
    'I am having severe headache',
    'Hindi',
    0.95,
    'I understand you are experiencing severe headache. Headaches can have various causes including stress, dehydration, or underlying medical conditions. I recommend: 1) Stay hydrated, 2) Rest in a quiet, dark room, 3) Apply cold or warm compress. If the headache persists, becomes severe, or is accompanied by fever, vision changes, or neck stiffness, please consult a healthcare professional immediately.',
    35,
    'female',
    'headache'
) ON CONFLICT (audio_file_id) DO NOTHING;

-- View for consultation analytics
CREATE VIEW consultation_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as consultation_date,
    detected_language,
    COUNT(*) as total_consultations,
    AVG(transcription_confidence) as avg_confidence,
    COUNT(CASE WHEN urgency_level = 'high' OR urgency_level = 'emergency' THEN 1 END) as urgent_cases,
    AVG(processing_time_ms) as avg_processing_time
FROM voice_consultations 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), detected_language
ORDER BY consultation_date DESC;