#!/usr/bin/env node

// Script to update admin credentials in production database
import { db } from './server/db.js';
import { adminUsers } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function updateAdminCredentials() {
  console.log('🔧 Updating admin portal credentials...');
  
  try {
    // First, check if portaladmin exists
    const existingPortalAdmin = await db.select().from(adminUsers).where(eq(adminUsers.username, 'portaladmin'));
    
    if (existingPortalAdmin.length > 0) {
      console.log('📝 Found existing portaladmin user, updating to admin...');
      
      // Update existing portaladmin to admin
      await db.update(adminUsers)
        .set({
          username: 'admin',
          passwordHash: '$2b$12$LQv3c1yqBwLVwjIAGOb9Bu4QlHpSmcGhzFm.7kkiMB.JCLb6wLFPW', // admin123
          email: 'admin@wakeexer.com',
          firstName: 'Admin',
          lastName: 'User',
          failedLoginAttempts: 0,
          lockedUntil: null
        })
        .where(eq(adminUsers.username, 'portaladmin'));
        
      console.log('✅ Updated portaladmin to admin/admin123');
    } else {
      console.log('📝 No existing portaladmin user found, checking for admin...');
      
      // Check if admin already exists
      const existingAdmin = await db.select().from(adminUsers).where(eq(adminUsers.username, 'admin'));
      
      if (existingAdmin.length === 0) {
        console.log('📝 Creating new admin user...');
        
        // Create new admin user
        await db.insert(adminUsers).values({
          username: 'admin',
          passwordHash: '$2b$12$LQv3c1yqBwLVwjIAGOb9Bu4QlHpSmcGhzFm.7kkiMB.JCLb6wLFPW', // admin123
          email: 'admin@wakeexer.com',
          firstName: 'Admin',
          lastName: 'User',
          isActive: true,
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0
        });
        
        console.log('✅ Created new admin user: admin/admin123');
      } else {
        console.log('📝 Admin user already exists, updating password...');
        
        // Update existing admin user password
        await db.update(adminUsers)
          .set({
            passwordHash: '$2b$12$LQv3c1yqBwLVwjIAGOb9Bu4QlHpSmcGhzFm.7kkiMB.JCLb6wLFPW', // admin123
            failedLoginAttempts: 0,
            lockedUntil: null
          })
          .where(eq(adminUsers.username, 'admin'));
          
        console.log('✅ Updated existing admin user password to admin123');
      }
    }
    
    // Verify the final result
    const finalAdmin = await db.select().from(adminUsers).where(eq(adminUsers.username, 'admin'));
    
    if (finalAdmin.length > 0) {
      console.log('\n🎉 Admin credentials successfully updated!');
      console.log(`📋 Login credentials: admin / admin123`);
      console.log(`📧 Email: ${finalAdmin[0].email}`);
      console.log(`👤 Name: ${finalAdmin[0].firstName} ${finalAdmin[0].lastName}`);
      console.log(`✅ Active: ${finalAdmin[0].isActive}`);
    } else {
      console.error('❌ Failed to verify admin user creation');
    }
    
  } catch (error) {
    console.error('❌ Error updating admin credentials:', error);
    throw error;
  }
}

// Run the update
updateAdminCredentials()
  .then(() => {
    console.log('\n✨ Admin credential update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Admin credential update failed:', error);
    process.exit(1);
  });
