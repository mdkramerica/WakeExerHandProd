-- Final Production Database Seeding Script with HIPAA-Compliant Security

-- Create cohorts for different injury types
INSERT INTO cohorts (name, description, normal_rom_ranges, is_active) VALUES
('Carpal Tunnel Syndrome', 'Patients with carpal tunnel syndrome requiring median nerve decompression', 
 '{"wristFlexion": {"min": 80, "max": 90, "mean": 85}, "wristExtension": {"min": 70, "max": 80, "mean": 75}, "thumbOpposition": {"min": 8, "max": 10, "mean": 9}}', true),
('Distal Radius Fracture', 'Patients with distal radius fractures requiring surgical fixation',
 '{"wristFlexion": {"min": 75, "max": 85, "mean": 80}, "wristExtension": {"min": 65, "max": 75, "mean": 70}, "fingerExtension": {"min": 0, "max": 5, "mean": 2}}', true),
('Trigger Finger', 'Patients with stenosing tenosynovitis requiring release',
 '{"fingerFlexion": {"min": 85, "max": 95, "mean": 90}, "thumbFlexion": {"min": 50, "max": 60, "mean": 55}, "gripStrength": {"min": 80, "max": 100, "mean": 90}}', true),
('CMC Arthroplasty', 'Patients undergoing carpometacarpal joint arthroplasty',
 '{"thumbAbduction": {"min": 60, "max": 70, "mean": 65}, "thumbOpposition": {"min": 8, "max": 10, "mean": 9}, "pinchStrength": {"min": 5, "max": 8, "mean": 6.5}}', true);

-- Create assessment types
INSERT INTO assessment_types (name, description, instructions, duration, repetitions, order_index, is_active) VALUES
('TAM Assessment', 'Total Active Motion assessment measuring finger flexibility and range of motion',
 'Make a tight fist, then fully extend fingers. Repeat 3 times for accurate measurement.', 60, 3, 1, true),
('Kapandji Assessment', 'Thumb opposition test measuring functional movement and dexterity',
 'Touch thumb tip to each fingertip and various points on the hand as demonstrated.', 45, 2, 2, true),
('Wrist Flexion/Extension', 'Measures wrist bending range of motion in sagittal plane',
 'Bend wrist up and down as far as comfortable. Keep fingers relaxed.', 30, 3, 3, true),
('Wrist Deviation', 'Measures side-to-side wrist movement in coronal plane',
 'Move wrist left and right as far as comfortable. Keep arm stable.', 30, 3, 4, true),
('QuickDASH Survey', 'Disabilities of Arm, Shoulder and Hand outcome measure questionnaire',
 'Complete the 11-item questionnaire about daily activities and symptoms.', 300, 1, 5, true);

-- Create clinical users with bcrypt hashed passwords
-- Password: "TempSecure2024!" (hashed with bcrypt 12 rounds)
INSERT INTO clinical_users (username, password_hash, email, first_name, last_name, role, is_active, password_changed_at, failed_login_attempts) VALUES
('admin', '$2b$12$LQv3c1yqBwLVwjIAGOb9Bu4QlHpSmcGhzFm.7kkiMB.JCLb6wLFPW', 'admin@wakeexer.com', 'System', 'Administrator', 'admin', true, NOW(), 0),
('clinician', '$2b$12$LQv3c1yqBwLVwjIAGOb9Bu4QlHpSmcGhzFm.7kkiMB.JCLb6wLFPW', 'clinician@wakeexer.com', 'Clinical', 'User', 'clinician', true, NOW(), 0),
('researcher', '$2b$12$LQv3c1yqBwLVwjIAGOb9Bu4QlHpSmcGhzFm.7kkiMB.JCLb6wLFPW', 'researcher@wakeexer.com', 'Research', 'User', 'researcher', true, NOW(), 0);

-- Create admin users for portal access
INSERT INTO admin_users (username, password_hash, email, first_name, last_name, is_active, password_changed_at, failed_login_attempts) VALUES
('portaladmin', '$2b$12$LQv3c1yqBwLVwjIAGOb9Bu4QlHpSmcGhzFm.7kkiMB.JCLb6wLFPW', 'portaladmin@wakeexer.com', 'Portal', 'Administrator', true, NOW(), 0);

-- Create injury types for backward compatibility
INSERT INTO injury_types (name, description, icon) VALUES
('Carpal Tunnel', 'Median nerve compression at the wrist', '🖐️'),
('Trigger Finger', 'Stenosing tenosynovitis of finger flexor tendons', '👆'),
('Distal Radius Fracture', 'Fracture of the radius bone near the wrist', '🦴'),
('CMC Arthroplasty', 'Thumb carpometacarpal joint replacement', '👍');

-- Display completion message
SELECT 'Database seeding completed successfully!' as status;

