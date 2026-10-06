import { db } from '../config/database';
import { AuditService } from './audit.service';

export class OwnershipService {
  /**
   * Submits an access request to edit a controlled file.
   */
  public static async createAccessRequest(
    projectId: string,
    fileId: string,
    requesterId: string,
    reason: string
  ): Promise<any> {
    const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await db.query(
      `INSERT INTO access_requests (id, project_id, file_id, requester_id, reason, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [id, projectId, fileId, requesterId, reason]
    );

    // Get file owner to send notification
    const ownerRes = await db.query(
      'SELECT owner_id, name FROM files WHERE id = ?',
      [fileId]
    );

    const ownerId = ownerRes.rows[0]?.owner_id;
    const fileName = ownerRes.rows[0]?.name || 'file';

    if (ownerId && ownerId !== requesterId) {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.query(
        `INSERT INTO notifications (id, project_id, user_id, title, message, type, metadata)
         VALUES (?, ?, ?, ?, ?, 'access_request', ?)`,
        [
          notifId,
          projectId,
          ownerId,
          'File Access Request',
          `A developer requested edit permission for controlled file ${fileName}: "${reason}"`,
          JSON.stringify({ fileId, requestId: id, requesterId })
        ]
      );
    }

    await AuditService.logAudit(projectId, requesterId, 'ACCESS_REQUEST_SUBMITTED', { fileId, reason });

    return { id, status: 'pending' };
  }

  /**
   * Approves or rejects an access request.
   */
  public static async decideAccessRequest(
    requestId: string,
    approverId: string,
    approverRole: string,
    decision: 'approved' | 'rejected'
  ): Promise<any> {
    const reqRes = await db.query(
      `SELECT ar.*, f.name as file_name, fo.owner_id as file_owner_id
       FROM access_requests ar
       JOIN files f ON ar.file_id = f.id
       LEFT JOIN file_ownership fo ON f.id = fo.file_id AND fo.status = 'active'
       WHERE ar.id = ?`,
      [requestId]
    );

    if (reqRes.rows.length === 0) {
      throw new Error('Access request not found');
    }

    const request = reqRes.rows[0];

    // Check authorization: must be Admin or the file owner
    if (approverRole !== 'Admin' && request.file_owner_id !== approverId) {
      throw new Error('Only the artifact owner or an Admin can decide access requests');
    }

    await db.query(
      `UPDATE access_requests
       SET status = ?, approver_id = ?, decided_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [decision, approverId, requestId]
    );

    // Notify requester
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.query(
      `INSERT INTO notifications (id, project_id, user_id, title, message, type, metadata)
       VALUES (?, ?, ?, ?, ?, 'access_request', ?)`,
      [
        notifId,
        request.project_id,
        request.requester_id,
        `Access Request ${decision.toUpperCase()}`,
        `Your request to edit ${request.file_name} was ${decision} by ${approverId}.`,
        JSON.stringify({ requestId, fileId: request.file_id, status: decision })
      ]
    );

    await AuditService.logAudit(
      request.project_id,
      approverId,
      `ACCESS_REQUEST_${decision.toUpperCase()}`,
      { requestId, fileId: request.file_id, requesterId: request.requester_id }
    );

    return { id: requestId, status: decision };
  }

  /**
   * Gets pending access requests for a project or approver.
   */
  public static async getAccessRequests(projectId: string): Promise<any[]> {
    const res = await db.query(
      `SELECT ar.*, f.name as file_name, f.path as file_path,
              p.full_name as requester_name, p.role as requester_role,
              fo.owner_id, op.full_name as owner_name
       FROM access_requests ar
       JOIN files f ON ar.file_id = f.id
       JOIN profiles p ON ar.requester_id = p.id
       LEFT JOIN file_ownership fo ON f.id = fo.file_id AND fo.status = 'active'
       LEFT JOIN profiles op ON fo.owner_id = op.id
       WHERE ar.project_id = ?
       ORDER BY ar.created_at DESC`,
      [projectId]
    );
    return res.rows;
  }
}
