export type UserRole = 'super_admin' | 'admin' | 'editor' | 'customer' | string;

export type AdminStatus = 'active' | 'inactive' | 'suspended';

export interface PermissionDefinition {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  permissions: string[];
  is_system?: boolean;
  user_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role_id: string;
  role_name: string;
  role: string; // compatibility key (e.g. 'super_admin', 'admin', 'custom')
  permissions?: string[];
  status: AdminStatus;
  is_active: boolean;
  must_change_password: boolean;
  phone?: string;
  avatar_url?: string;
  last_login_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface CustomerUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  delivery_address?: {
    street?: string;
    city?: string;
    state?: string;
    lga?: string;
  };
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface AuthSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  roleId?: string;
  permissions?: string[];
  mustChangePassword?: boolean;
  loginTime?: number;
  lastActive?: number;
  iat?: number;
  exp?: number;
}

export interface AdminActivityItem {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}
