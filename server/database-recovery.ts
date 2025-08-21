// Database recovery system with fallback to memory storage
import { MemoryStorage } from './memory-storage';
import { storage } from './storage';
import { db } from './db';
import { sql } from 'drizzle-orm';

export class RecoveryStorage {
  private activeStorage: any;
  private isUsingMemory = false;

  constructor() {
    // Always use database storage for consistent behavior
    this.activeStorage = storage;
    this.isUsingMemory = false;
  }

  private async initializeStorage() {
    try {
      console.log('Testing database connection...');
      await Promise.race([
        db.execute(sql`SELECT 1 as test`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
      ]);
      
      console.log('Database connection successful, initializing database storage');
      this.activeStorage = await this.createDatabaseStorage();
      this.isUsingMemory = false;
      
      // Ensure demo data exists
      await this.ensureDemoData();
      
    } catch (error) {
      console.log('Database connection failed, using storage fallback');
      this.activeStorage = storage;
      this.isUsingMemory = true;
    }
  }

  private async createDatabaseStorage() {
    // Create a simple database interface
    return {
      async getAssessments() {
        const result = await db.execute(sql`SELECT * FROM assessments WHERE is_active = true ORDER BY order_index`);
        return result.rows;
      },
      
      async getAssessment(id: number) {
        const result = await db.execute(sql`SELECT * FROM assessments WHERE id = ${id}`);
        return result.rows[0];
      },
      
      async getUserByCode(code: string) {
        const result = await db.execute(sql`SELECT * FROM users WHERE code = ${code}`);
        return result.rows[0];
      },
      
      async getUserById(id: number) {
        const result = await db.execute(sql`SELECT * FROM users WHERE id = ${id}`);
        return result.rows[0];
      },
      
      async createUser(userData: any) {
        const result = await db.execute(sql`
          INSERT INTO users (code, is_first_time, injury_type, created_at)
          VALUES (${userData.code}, ${userData.isFirstTime || true}, ${userData.injuryType || null}, NOW())
          RETURNING *
        `);
        return result.rows[0];
      },
      
      async updateUser(id: number, updates: any) {
        const setValues = Object.entries(updates).map(([key, value]) => `${key} = '${value}'`).join(', ');
        const result = await db.execute(sql.raw(`UPDATE users SET ${setValues} WHERE id = ${id} RETURNING *`));
        return result.rows[0];
      },
      
      async createUserAssessment(data: any) {
        const result = await db.execute(sql`
          INSERT INTO user_assessments (user_id, assessment_id, assessment_name, is_completed, created_at)
          VALUES (${data.userId}, ${data.assessmentId}, ${data.assessmentName || null}, ${data.isCompleted || false}, NOW())
          RETURNING *
        `);
        return result.rows[0];
      },
      
      async updateUserAssessment(id: number, updates: any) {
        const setValues = Object.entries(updates).map(([key, value]) => `${key} = '${value}'`).join(', ');
        const result = await db.execute(sql.raw(`UPDATE user_assessments SET ${setValues} WHERE id = ${id} RETURNING *`));
        return result.rows[0];
      },
      
      async getUserAssessmentById(id: number) {
        const result = await db.execute(sql`SELECT * FROM user_assessments WHERE id = ${id}`);
        return result.rows[0];
      },
      
      async getUserAssessments(userId: number) {
        const result = await db.execute(sql`SELECT * FROM user_assessments WHERE user_id = ${userId} ORDER BY created_at DESC`);
        return result.rows;
      },
      
      async getUserProgress(userId: number) {
        const totalResult = await db.execute(sql`SELECT COUNT(*) as total FROM assessments WHERE is_active = true`);
        const completedResult = await db.execute(sql`
          SELECT COUNT(*) as completed FROM user_assessments 
          WHERE user_id = ${userId} AND is_completed = true
        `);
        
        const total = totalResult.rows[0]?.total || 5;
        const completed = completedResult.rows[0]?.completed || 0;
        
        return {
          completed,
          total,
          percentage: Math.round((completed / total) * 100)
        };
      }
    };
  }

  private async ensureDemoData() {
    if (this.isUsingMemory) return; // Memory storage already has demo data

    try {
      // Check if assessments exist
      const assessments = await this.activeStorage.getAssessments();
      if (assessments.length === 0) {
        console.log('Restoring assessment data to database...');
        await this.restoreAssessmentData();
      }

      // Check if demo user exists
      const demoUser = await this.activeStorage.getUserByCode('DEMO01');
      if (!demoUser) {
        console.log('Restoring demo user...');
        await this.restoreDemoUser();
      }
    } catch (error) {
      console.log('Failed to ensure demo data, falling back to persistent memory storage');
      this.activeStorage = storage;
      this.isUsingMemory = true;
    }
  }

  private async restoreAssessmentData() {
    const assessmentData = [
      {
        name: 'TAM (Total Active Motion)',
        description: 'Comprehensive finger flexion and extension measurement',
        videoUrl: '/videos/tam_video.mp4',
        duration: 10,
        repetitions: 1,
        instructions: 'Make a complete fist, then fully extend all fingers. Repeat slowly and deliberately.',
        isActive: true,
        orderIndex: 1
      },
      {
        name: 'Kapandji Score',
        description: 'Thumb opposition assessment using standardized scoring',
        videoUrl: '/videos/kapandji-instruction.mov',
        duration: 10,
        repetitions: 1,
        instructions: 'Touch your thumb to each finger tip, then to the base of each finger, progressing down the hand.',
        isActive: true,
        orderIndex: 2
      },
      {
        name: 'Wrist Flexion/Extension',
        description: 'Measure wrist forward and backward bending range of motion',
        videoUrl: '/videos/wrist-fe-assessment.mp4',
        duration: 10,
        repetitions: 1,
        instructions: 'Bend your wrist forward as far as comfortable, then backward. Keep forearm stable.',
        isActive: true,
        orderIndex: 3
      },
      {
        name: 'Forearm Pronation/Supination',
        description: 'Assess forearm rotation capabilities',
        videoUrl: '/videos/forearm-rotation.mp4',
        duration: 10,
        repetitions: 1,
        instructions: 'Rotate your forearm to turn palm up and down while keeping elbow stable.',
        isActive: true,
        orderIndex: 4
      },
      {
        name: 'Wrist Radial/Ulnar Deviation',
        description: 'Measure side-to-side wrist movement',
        videoUrl: '/videos/wrist-deviation.mp4',
        duration: 10,
        repetitions: 1,
        instructions: 'Move your wrist side to side, first toward thumb then toward pinky.',
        isActive: true,
        orderIndex: 5
      }
    ];

    // Use raw SQL to restore data directly
    for (const assessment of assessmentData) {
      await db.execute(sql`
        INSERT INTO assessments (name, description, video_url, duration, repetitions, instructions, is_active, order_index)
        VALUES (${assessment.name}, ${assessment.description}, ${assessment.videoUrl}, ${assessment.duration}, ${assessment.repetitions}, ${assessment.instructions}, ${assessment.isActive}, ${assessment.orderIndex})
        ON CONFLICT (name) DO NOTHING
      `);
    }
  }

  private async restoreDemoUser() {
    await db.execute(sql`
      INSERT INTO users (code, is_first_time, injury_type, created_at)
      VALUES ('DEMO01', false, 'Carpal Tunnel', NOW())
      ON CONFLICT (code) DO NOTHING
    `);
  }

  // Proxy all methods to active storage
  async getAssessments() {
    return await this.activeStorage.getAssessments();
  }

  async getAssessment(id: number) {
    return await this.activeStorage.getAssessment(id);
  }

  async getUserByCode(code: string) {
    return await this.activeStorage.getUserByCode(code);
  }

  async getUserById(id: number) {
    const result = await this.activeStorage.getUserById(id);
    console.log(`RecoveryStorage getUserById(${id}) returning:`, result ? 'found' : 'not found');
    return result;
  }

  async createUser(userData: any) {
    return await this.activeStorage.createUser(userData);
  }

  async updateUser(id: number, updates: any) {
    return await this.activeStorage.updateUser(id, updates);
  }

  async createUserAssessment(data: any) {
    return await this.activeStorage.createUserAssessment(data);
  }

  async updateUserAssessment(id: number, updates: any) {
    return await this.activeStorage.updateUserAssessment(id, updates);
  }

  async getUserAssessmentById(id: number) {
    return await this.activeStorage.getUserAssessmentById(id);
  }

  async getUserAssessments(userId: number) {
    return await this.activeStorage.getUserAssessments(userId);
  }

  async getUserProgress(userId: number) {
    return await this.activeStorage.getUserProgress(userId);
  }

  // Clinical methods
  async authenticateClinicalUser(username: string, password: string) {
    console.log(`RecoveryStorage authenticateClinicalUser(${username})`);
    return await this.activeStorage.authenticateClinicalUser(username, password);
  }

  async getClinicalUser(id: number) {
    return await this.activeStorage.getClinicalUser(id);
  }

  async getClinicalUserByUsername(username: string) {
    return await this.activeStorage.getClinicalUserByUsername(username);
  }

  async createClinicalUser(userData: any) {
    return await this.activeStorage.createClinicalUser(userData);
  }

  async updateClinicalUser(id: number, updates: any) {
    return await this.activeStorage.updateClinicalUser(id, updates);
  }

  async getCohorts() {
    if (this.isUsingMemory) {
      return [
        { id: 1, name: 'Trigger Finger Study', description: 'Finger tendon disorder research', patientCount: 25, status: 'active' },
        { id: 2, name: 'Carpal Tunnel Study', description: 'Nerve compression in the wrist research', patientCount: 32, status: 'active' },
        { id: 3, name: 'Distal Radius Fracture Study', description: 'Broken wrist bone recovery research', patientCount: 28, status: 'active' },
        { id: 4, name: 'CMC Arthroplasty Study', description: 'Thumb joint replacement research', patientCount: 20, status: 'active' },
        { id: 5, name: 'Metacarpal ORIF Study', description: 'Hand bone surgical repair research', patientCount: 15, status: 'active' },
        { id: 6, name: 'Phalanx Fracture Study', description: 'Finger bone fracture research', patientCount: 18, status: 'active' }
      ];
    }
    return await this.activeStorage.getCohorts();
  }

  async getPatients() {
    return await this.activeStorage.getPatients();
  }

  async getAlerts() {
    return await this.activeStorage.getAlerts();
  }

  async createAuditLog(logData: any) {
    return await this.activeStorage.createAuditLog(logData);
  }

  async createCohort(cohortData: any) {
    return await this.activeStorage.createCohort(cohortData);
  }

  async updateCohort(id: number, updates: any) {
    return await this.activeStorage.updateCohort(id, updates);
  }

  async createPatient(patientData: any) {
    return await this.activeStorage.createPatient(patientData);
  }

  async updatePatient(id: number, updates: any) {
    return await this.activeStorage.updatePatient(id, updates);
  }

  async getDashboardMetrics() {
    return await this.activeStorage.getDashboardMetrics();
  }

  async getPatientDashboardData() {
    return await this.activeStorage.getPatientDashboardData();
  }

  async checkEligibility(patientId: number, cohortId: number) {
    if (this.activeStorage.checkEligibility) {
      return await this.activeStorage.checkEligibility(patientId, cohortId);
    }
    
    // Fallback basic eligibility check
    return { eligible: true, reasons: [] };
  }

  async enrollPatient(enrollmentData: any) {
    if (this.activeStorage.enrollPatient) {
      return await this.activeStorage.enrollPatient(enrollmentData);
    }
    
    // Fallback enrollment
    return { id: enrollmentData.patientId, ...enrollmentData, enrolledAt: new Date() };
  }

  // Additional methods for injury type support
  async getAssessmentsForInjuryType(injuryType: string) {
    if (this.activeStorage.getAssessmentsForInjuryType) {
      return await this.activeStorage.getAssessmentsForInjuryType(injuryType);
    }
    // Fallback: return all assessments
    return await this.getAssessments();
  }

  async getInjuryTypes() {
    if (this.isUsingMemory) {
      return [
        { name: 'Trigger Finger', description: 'Finger tendon disorder' },
        { name: 'Carpal Tunnel', description: 'Nerve compression in the wrist' },
        { name: 'Distal Radius Fracture', description: 'Broken wrist bone' },
        { name: 'CMC Arthroplasty', description: 'Thumb joint replacement' },
        { name: 'Metacarpal ORIF', description: 'Hand bone surgical repair' },
        { name: 'Phalanx Fracture', description: 'Finger bone fracture' }
      ];
    }
    return await this.activeStorage.getInjuryTypes?.() || [];
  }

  async getTodaysAssessments(userId: number) {
    if (this.activeStorage.getTodaysAssessments) {
      return await this.activeStorage.getTodaysAssessments(userId);
    }
    return { assessments: [] };
  }
}