import { db } from './server/db.js';
import { userAssessments } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function testDrizzle() {
  try {
    console.log('Testing Drizzle ORM...');
    
    // Test a simple select
    const result = await db.select().from(userAssessments).limit(1);
    console.log('✅ Select test passed:', result.length, 'rows');
    
    // Test an update
    const updateResult = await db
      .update(userAssessments)
      .set({ 
        isCompleted: true,
        completedAt: new Date().toISOString(),
        totalActiveRom: '150.5',
        indexFingerRom: '30.0',
        kapandjiScore: '5.0'
      })
      .where(eq(userAssessments.id, 1))
      .returning();
    
    console.log('✅ Update test passed:', updateResult);
    
  } catch (error) {
    console.error('❌ Drizzle test failed:', error);
    console.error('❌ Error stack:', error.stack);
  }
}

testDrizzle();
