import { db } from './db.js';
import { clinicalUsers, adminUsers, cohorts, assessmentTypes } from '../shared/schema.js';
import { PasswordService } from './security.js';

/**
 * Secure database seeding script for HIPAA-compliant deployment
 * This script creates initial users with properly hashed passwords
 */

async function seedDatabase() {
  console.log('🌱 Starting secure database seeding...');

  try {
    // Create cohorts for different injury types
    console.log('Creating cohorts...');
    const cohortsData = [
      {
        name: 'Carpal Tunnel Syndrome',
        description: 'Patients with carpal tunnel syndrome requiring median nerve decompression',
        normalRomRanges: {
          wristFlexion: { min: 80, max: 90, mean: 85 },
          wristExtension: { min: 70, max: 80, mean: 75 },
          thumbOpposition: { min: 8, max: 10, mean: 9 }
        }
      },
      {
        name: 'Distal Radius Fracture',
        description: 'Patients with distal radius fractures requiring surgical fixation',
        normalRomRanges: {
          wristFlexion: { min: 75, max: 85, mean: 80 },
          wristExtension: { min: 65, max: 75, mean: 70 },
          fingerExtension: { min: 0, max: 5, mean: 2 }
        }
      },
      {
        name: 'Trigger Finger',
        description: 'Patients with stenosing tenosynovitis requiring release',
        normalRomRanges: {
          fingerFlexion: { min: 85, max: 95, mean: 90 },
          thumbFlexion: { min: 50, max: 60, mean: 55 },
          gripStrength: { min: 80, max: 100, mean: 90 }
        }
      },
      {
        name: 'CMC Arthroplasty',
        description: 'Patients undergoing carpometacarpal joint arthroplasty',
        normalRomRanges: {
          thumbAbduction: { min: 60, max: 70, mean: 65 },
          thumbOpposition: { min: 8, max: 10, mean: 9 },
          pinchStrength: { min: 5, max: 8, mean: 6.5 }
        }
      }
    ];

    const createdCohorts = await db.insert(cohorts).values(cohortsData).returning();
    console.log(`✅ Created ${createdCohorts.length} cohorts`);

    // Create assessment types
    console.log('Creating assessment types...');
    const assessmentTypesData = [
      {
        name: 'TAM Assessment',
        description: 'Total Active Motion assessment measuring finger flexibility and range of motion',
        instructions: 'Make a tight fist, then fully extend fingers. Repeat 3 times for accurate measurement.',
        duration: 60,
        repetitions: 3,
        orderIndex: 1,
        isActive: true
      },
      {
        name: 'Kapandji Assessment',
        description: 'Thumb opposition test measuring functional movement and dexterity',
        instructions: 'Touch thumb tip to each fingertip and various points on the hand as demonstrated.',
        duration: 45,
        repetitions: 2,
        orderIndex: 2,
        isActive: true
      },
      {
        name: 'Wrist Flexion/Extension',
        description: 'Measures wrist bending range of motion in sagittal plane',
        instructions: 'Bend wrist up and down as far as comfortable. Keep fingers relaxed.',
        duration: 30,
        repetitions: 3,
        orderIndex: 3,
        isActive: true
      },
      {
        name: 'Wrist Deviation',
        description: 'Measures side-to-side wrist movement in coronal plane',
        instructions: 'Move wrist left and right as far as comfortable. Keep arm stable.',
        duration: 30,
        repetitions: 3,
        orderIndex: 4,
        isActive: true
      },
      {
        name: 'QuickDASH Survey',
        description: 'Disabilities of Arm, Shoulder and Hand outcome measure questionnaire',
        instructions: 'Complete the 11-item questionnaire about daily activities and symptoms.',
        duration: 300, // 5 minutes
        repetitions: 1,
        orderIndex: 5,
        isActive: true
      }
    ];

    const createdAssessmentTypes = await db.insert(assessmentTypes).values(assessmentTypesData).returning();
    console.log(`✅ Created ${createdAssessmentTypes.length} assessment types`);

    // Create clinical users with secure passwords
    console.log('Creating clinical users with secure passwords...');
    
    // Generate secure passwords (in production, these should be provided securely)
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'SecureAdmin2024!@#';
    const clinicianPassword = process.env.CLINICIAN_DEFAULT_PASSWORD || 'SecureClinician2024!@#';
    const researcherPassword = process.env.RESEARCHER_DEFAULT_PASSWORD || 'SecureResearcher2024!@#';

    const clinicalUsersData = [
      {
        username: 'admin',
        password: adminPassword,
        email: 'admin@wakeexer.com',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        isActive: true
      },
      {
        username: 'clinician',
        password: clinicianPassword,
        email: 'clinician@wakeexer.com',
        firstName: 'Clinical',
        lastName: 'User',
        role: 'clinician',
        isActive: true
      },
      {
        username: 'researcher',
        password: researcherPassword,
        email: 'researcher@wakeexer.com',
        firstName: 'Research',
        lastName: 'User',
        role: 'researcher',
        isActive: true
      }
    ];

    // Hash passwords and create users
    for (const userData of clinicalUsersData) {
      const passwordHash = await PasswordService.hash(userData.password);
      const { password, ...userDataWithoutPassword } = userData;
      
      const userToInsert = {
        ...userDataWithoutPassword,
        passwordHash,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0
      };

      await db.insert(clinicalUsers).values(userToInsert);
      console.log(`✅ Created clinical user: ${userData.username}`);
    }

    // Create admin users with secure passwords
    console.log('Creating admin users with secure passwords...');
    
    const adminUserPassword = process.env.PORTAL_ADMIN_PASSWORD || 'SecurePortalAdmin2024!@#';
    
    const adminUsersData = [
      {
        username: 'portaladmin',
        password: adminUserPassword,
        email: 'portaladmin@wakeexer.com',
        firstName: 'Portal',
        lastName: 'Administrator',
        isActive: true
      }
    ];

    for (const userData of adminUsersData) {
      const passwordHash = await PasswordService.hash(userData.password);
      const { password, ...userDataWithoutPassword } = userData;
      
      const userToInsert = {
        ...userDataWithoutPassword,
        passwordHash,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0
      };

      await db.insert(adminUsers).values(userToInsert);
      console.log(`✅ Created admin user: ${userData.username}`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Created Accounts Summary:');
    console.log('Clinical Users:');
    console.log('  - admin / [check ADMIN_DEFAULT_PASSWORD env var]');
    console.log('  - clinician / [check CLINICIAN_DEFAULT_PASSWORD env var]');
    console.log('  - researcher / [check RESEARCHER_DEFAULT_PASSWORD env var]');
    console.log('\nAdmin Users:');
    console.log('  - portaladmin / [check PORTAL_ADMIN_PASSWORD env var]');
    console.log('\n⚠️  IMPORTANT: Change default passwords immediately after first login!');
    console.log('📊 Database is ready for HIPAA-compliant production use.');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
