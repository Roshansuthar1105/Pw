export type UserType = 'STUDENT' | 'TEACHER' | 'MENTOR' | 'ADMIN';

export type ComponentLevel = 'MENU' | 'SUBMENU' | 'FUNCTIONALITY';

export interface User {
  id: number;
  username: string;
  email: string;
  userType: UserType;
  isSuperAdmin: boolean;
  active: boolean;
  groupIds: number[];
  groupNames: string[];
  createdAt: string;
  avatarUrl?: string;
}

export interface Group {
  id: number;
  name: string;
  code: string;
  description?: string;
  isSystem: boolean;
  isDefault: boolean;
  defaultForUserType?: UserType;
  roleIds: number[];
  roleNames: string[];
  userCount?: number;
}

export interface Role {
  id: number;
  name: string;
  code: string;
  description?: string;
  isSystem: boolean;
  componentIds: number[];
  componentCount?: number;
}

export interface ComponentItem {
  id: number;
  level: ComponentLevel;
  parentId?: number | null;
  parentName?: string;
  code: string;
  name: string;
  icon?: string;
  route?: string;
  helpText?: string;
  elementType?: string;
  sortOrder: number;
  active: boolean;
}

export interface FunctionalityTree {
  id: number;
  code: string;
  name: string;
  elementType: string;
  sortOrder: number;
}

export interface SubmenuTree {
  id: number;
  code: string;
  name: string;
  route: string;
  helpText?: string;
  sortOrder: number;
  functionalities: FunctionalityTree[];
}

export interface MenuTree {
  id: number;
  code: string;
  name: string;
  icon?: string;
  sortOrder: number;
  submenus: SubmenuTree[];
}

export interface ResolvedPermissions {
  flatCodes: string[];
  tree: MenuTree[];
}

export interface AuthResponse {
  token: string;
  user: User;
  permissions: ResolvedPermissions;
}

export interface AuditLog {
  id: number;
  actorId?: number;
  actorUsername?: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: string;
  createdAt: string;
}
