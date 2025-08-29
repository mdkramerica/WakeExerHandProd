#!/usr/bin/env tsx

import { db } from './server/db.js';
import { assessments } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function updateVideoUrls() {
  try {
    console.log('🎬 Updating assessment video URLs...');

    // Update Forearm Pronation/Supination video URL
    await db.update(assessments)
      .set({ videoUrl: '/videos/wrist-supination-pronation.mp4' })
      .where(eq(assessments.name, 'Forearm Pronation/Supination'));
    
    console.log('✅ Updated Forearm Pronation/Supination video URL');

    // Update Wrist Radial/Ulnar Deviation video URL  
    await db.update(assessments)
      .set({ videoUrl: '/videos/wrist-radial-ulnar-deviation.mp4' })
      .where(eq(assessments.name, 'Wrist Radial/Ulnar Deviation'));
    
    console.log('✅ Updated Wrist Radial/Ulnar Deviation video URL');

    // Verify the updates
    const updatedAssessments = await db
      .select({ name: assessments.name, videoUrl: assessments.videoUrl })
      .from(assessments)
      .where(eq(assessments.name, 'Forearm Pronation/Supination'));
    
    const updatedDeviation = await db
      .select({ name: assessments.name, videoUrl: assessments.videoUrl })
      .from(assessments)
      .where(eq(assessments.name, 'Wrist Radial/Ulnar Deviation'));

    console.log('📋 Updated assessments:');
    console.log('  - Pronation/Supination:', updatedAssessments[0]?.videoUrl);
    console.log('  - Radial/Ulnar Deviation:', updatedDeviation[0]?.videoUrl);

    console.log('🎉 Video URL updates completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating video URLs:', error);
    process.exit(1);
  }
}

updateVideoUrls();
