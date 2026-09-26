import { hashPassword, comparePassword } from '@/lib/auth/password';
import { createSessionToken, verifySessionToken, ADMIN_COOKIE_NAME, CUSTOMER_COOKIE_NAME } from '@/lib/auth/jwt';
import { cmsStore } from '@/lib/cms-store';
import { AdminUser, CustomerUser, AuthSessionPayload } from '@/types/auth.types';

export class AuthService {
  /**
   * Authenticates an admin by email and password.
   */
  async adminLogin(email: string, password: string): Promise<{ success: boolean; token?: string; admin?: AdminUser; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const admin = cmsStore.getAdminByEmail(cleanEmail);

    if (!admin) {
      return { success: false, error: 'Invalid email address or password.' };
    }

    if (!admin.is_active || admin.status === 'inactive') {
      return { success: false, error: 'This admin account has been deactivated. Please contact your system administrator.' };
    }

    if (admin.status === 'suspended') {
      return { success: false, error: 'This admin account has been suspended. Please contact your system administrator.' };
    }

    const isValid = await comparePassword(password, admin.password_hash);
    if (!isValid) {
      return { success: false, error: 'Invalid email address or password.' };
    }

    // Update last login
    cmsStore.updateAdminLastLogin(admin.id);

    // Create session token with RBAC permissions
    const token = await createSessionToken({
      userId: admin.id,
      email: admin.email,
      name: admin.full_name,
      role: admin.role,
      roleId: admin.role_id,
      permissions: admin.permissions || [],
      mustChangePassword: admin.must_change_password || false,
    });

    const { password_hash, ...safeAdmin } = admin;

    return {
      success: true,
      token,
      admin: safeAdmin,
    };
  }

  /**
   * Changes an admin's password and issues a fresh session token without must_change_password flag.
   */
  async changeAdminPassword(adminId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; token?: string; admin?: AdminUser; error?: string }> {
    const admin = cmsStore.getAdminById(adminId);
    if (!admin) {
      return { success: false, error: 'Administrator not found.' };
    }

    const isCurrentValid = await comparePassword(currentPassword, admin.password_hash);
    if (!isCurrentValid) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    cmsStore.changeAdminPassword(admin.id, newPassword);
    const updatedAdmin = cmsStore.getAdminById(admin.id)!;

    // Issue updated token
    const token = await createSessionToken({
      userId: updatedAdmin.id,
      email: updatedAdmin.email,
      name: updatedAdmin.full_name,
      role: updatedAdmin.role,
      roleId: updatedAdmin.role_id,
      permissions: updatedAdmin.permissions || [],
      mustChangePassword: false,
    });

    const { password_hash, ...safeAdmin } = updatedAdmin;
    return {
      success: true,
      token,
      admin: safeAdmin,
    };
  }

  /**
   * Registers a new customer account.
   */
  async customerRegister(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ success: boolean; token?: string; customer?: CustomerUser; error?: string }> {
    const cleanEmail = data.email.toLowerCase().trim();

    // Check existing customer
    const existing = cmsStore.getCustomerByEmail(cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists. Please log in.' };
    }

    const passwordHash = await hashPassword(data.password);

    const newCustomer = cmsStore.createCustomer({
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      email: cleanEmail,
      password_hash: passwordHash,
      phone: data.phone?.trim() || '',
      is_active: true,
    });

    const token = await createSessionToken({
      userId: newCustomer.id,
      email: newCustomer.email,
      name: `${newCustomer.first_name} ${newCustomer.last_name}`,
      role: 'customer',
    });

    const { password_hash, ...safeCustomer } = newCustomer;

    return {
      success: true,
      token,
      customer: safeCustomer,
    };
  }

  /**
   * Authenticates a customer by email and password.
   */
  async customerLogin(email: string, password: string): Promise<{ success: boolean; token?: string; customer?: CustomerUser; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const customer = cmsStore.getCustomerByEmail(cleanEmail);

    if (!customer) {
      return { success: false, error: 'Invalid email address or password.' };
    }

    if (!customer.is_active) {
      return { success: false, error: 'This account has been disabled. Please contact customer support.' };
    }

    const isValid = await comparePassword(password, customer.password_hash);
    if (!isValid) {
      return { success: false, error: 'Invalid email address or password.' };
    }

    cmsStore.updateCustomerLastLogin(customer.id);

    const token = await createSessionToken({
      userId: customer.id,
      email: customer.email,
      name: `${customer.first_name} ${customer.last_name}`,
      role: 'customer',
    });

    const { password_hash, ...safeCustomer } = customer;

    return {
      success: true,
      token,
      customer: safeCustomer,
    };
  }

  /**
   * Authenticates or registers a customer via Google OAuth.
   */
  async customerGoogleAuth(data: {
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    googleId?: string;
    avatarUrl?: string;
  }): Promise<{ success: boolean; token?: string; customer?: CustomerUser; error?: string }> {
    const cleanEmail = data.email.toLowerCase().trim();

    let customer = cmsStore.getCustomerByEmail(cleanEmail);

    if (!customer) {
      // Parse name if firstName/lastName not explicitly separated
      let first = data.firstName?.trim() || '';
      let last = data.lastName?.trim() || '';

      if (!first && data.name) {
        const parts = data.name.trim().split(' ');
        first = parts[0] || 'Customer';
        last = parts.slice(1).join(' ') || '';
      }

      if (!first) {
        first = cleanEmail.split('@')[0];
      }

      customer = cmsStore.createCustomer({
        first_name: first,
        last_name: last,
        email: cleanEmail,
        password_hash: '', // Social login
        is_active: true,
      });
    }

    if (!customer.is_active) {
      return { success: false, error: 'This account has been disabled. Please contact customer support.' };
    }

    cmsStore.updateCustomerLastLogin(customer.id);

    const token = await createSessionToken({
      userId: customer.id,
      email: customer.email,
      name: `${customer.first_name} ${customer.last_name}`.trim(),
      role: 'customer',
    });

    const { password_hash, ...safeCustomer } = customer;

    return {
      success: true,
      token,
      customer: safeCustomer,
    };
  }

  /**
   * Verifies and retrieves session payload from a token.
   */
  async verifySession(token: string): Promise<AuthSessionPayload | null> {
    return verifySessionToken(token);
  }
}

export const authService = new AuthService();
