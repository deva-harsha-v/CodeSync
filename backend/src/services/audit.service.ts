import { db } from '../config/database';

export class AuditService {
  public static async logAudit(
    projectId: string,
    userId: string,
    action: string,
    details: any = {},
    status: string = 'SUCCESS',
    ipAddress: string = '127.0.0.1'
  ): Promise<void> {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const detailsJson = typeof details === 'string' ? details : JSON.stringify(details);

    await db.query(
      `INSERT INTO audit_logs (id, project_id, user_id, action, ip_address, details, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, projectId, userId, action, ipAddress, detailsJson, status]
    );
  }

  public static async logActivity(
    projectId: string,
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
    details: any = {}
  ): Promise<void> {
    const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const detailsJson = typeof details === 'string' ? details : JSON.stringify(details);

    await db.query(
      `INSERT INTO activity_logs (id, project_id, user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, projectId, userId, action, entityType, entityId || null, detailsJson]
    );
  }
}
