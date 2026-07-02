/**
 * AuditLog.action için geçerli değerler. DB tarafında enum değil String
 * tutulur (yeni olay eklemek migration gerektirmesin); tip güvenliği bu
 * sabitlerle sağlanır. Adlandırma: `<alan>.<olay>` (nokta ayraçlı).
 */
export const AUDIT_ACTIONS = {
  // Kimlik
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGIN_FAILED: 'auth.login_failed',
  AUTH_REGISTER: 'auth.register',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_DEMO_LOGIN: 'auth.demo_login',

  // Ofis / üyelik
  OFFICE_CREATED: 'office.created',
  OFFICE_RENAMED: 'office.renamed',
  MEMBER_REMOVED: 'member.removed',
  MEMBER_ROLE_CHANGED: 'member.role_changed',
  MEMBER_LEFT: 'member.left',

  // Davet
  INVITE_CREATED: 'invite.created',
  INVITE_ACCEPTED: 'invite.accepted',
  INVITE_REVOKED: 'invite.revoked',
  INVITE_REGISTER: 'invite.register',

  // Kullanıcı yönetimi (ofis içi)
  USER_CREATED: 'user.created',
  USER_DEACTIVATED: 'user.deactivated',

  // Dışa aktarma
  EXPORT_RUN: 'export.run',

  // Paylaşılan defter
  SHARE_CREATED: 'share.created',
  SHARE_REVOKED: 'share.revoked',

  // Süper admin eylemleri
  ADMIN_USER_CREATED: 'admin.user_created',
  ADMIN_USER_UPDATED: 'admin.user_updated',
  ADMIN_USER_DEACTIVATED: 'admin.user_deactivated',
  ADMIN_OFFICE_DEACTIVATED: 'admin.office_deactivated',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
