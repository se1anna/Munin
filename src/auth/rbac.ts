import { UserRole } from "../types/blog";

export type Permission =
  | "manage_options"
  | "manage_users"
  | "manage_hotp"
  | "export_backup"
  | "publish_posts"
  | "edit_others_posts"
  | "delete_others_posts"
  | "edit_own_posts"
  | "upload_media"
  | "moderate_comments"
  | "post_comment";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  administrator: [
    "manage_options",
    "manage_users",
    "manage_hotp",
    "export_backup",
    "publish_posts",
    "edit_others_posts",
    "delete_others_posts",
    "edit_own_posts",
    "upload_media",
    "moderate_comments",
    "post_comment"
  ],
  author: [
    "publish_posts",
    "edit_own_posts",
    "upload_media",
    "post_comment"
  ],
  subscriber: [
    "post_comment"
  ],
  tester: [
    "post_comment"
  ]
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function canManagePost(userRole: UserRole, authorId: string, currentUserId: string): boolean {
  if (userRole === "administrator") return true;
  if (userRole === "author" && authorId === currentUserId) return true;
  return false;
}
