-- Fix video URLs in the database to use correct /attached_assets/ paths

-- Update Forearm Pronation/Supination video URL
UPDATE assessments 
SET video_url = '/attached_assets/Supination Pronation_1754504444252.mp4'
WHERE id = 4 AND name = 'Forearm Pronation/Supination';

-- Update Wrist Radial/Ulnar Deviation video URL  
UPDATE assessments 
SET video_url = '/attached_assets/ulnar radial deviation_1754503826192.mp4'
WHERE id = 5 AND name = 'Wrist Radial/Ulnar Deviation';

-- Verify the updates
SELECT id, name, video_url FROM assessments WHERE video_url IS NOT NULL ORDER BY order_index;
