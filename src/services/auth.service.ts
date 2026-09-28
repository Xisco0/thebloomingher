import { hashPassword, comparePassword } from '@/lib/auth/password';
import { createSessionToken, verifySessionToken, ADMIN_COOKIE_NAME, CUSTOMER_COOKIE_NAME } from '@/lib/auth/jwt';
import { cmsStore } from '@/lib/cms-store';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { AdminUser, CustomerUser, AuthSessionPayload } from '@/types/auth.types';

export class AuthService {
  /**
   * Authenticates an admin by email and password.
   */
  async adminLogin(email: string, password: string): Promise<{ success: boolean; token?: string; admin?: AdminUser; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    let admin = cmsStore.getAdminByEmail(cleanEmail);

    // If not found in memory, fetch from Supabase
    if (!admin) {
      try {
        const { data: dbAdmin } = await supabaseAdmin.from('admin_users').select('*').eq('email', cleanEmail).maybeSingle();
        if (dbAdmin) {
          cmsStore.syncAdminsFromDb([dbAdmin]);
          admin = cmsStore.getAdminByEmail(cleanEmail);
        }
      } catch (dbErr) {
        console.warn('[Admin DB lookup notice]:', dbErr);
      }
    }

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
    try {
      await supabaseAdmin.from('admin_users').update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', admin.id);
    } catch (e) {}

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

    try {
      await supabaseAdmin.from('admin_users').update({
        password_hash: updatedAdmin.password_hash,
        must_change_password: false,
        updated_at: new Date().toISOString(),
      }).eq('id', admin.id);
    } catch (dbErr) {
      console.error('[Supabase Password Change Error]:', dbErr);
    }

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

    // Check existing customer in Supabase & memory
    try {
      const { data: dbCustomer } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (dbCustomer) {
        return { success: false, error: 'An account with this email address already exists. Please log in.' };
      }
    } catch (e) {}

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

    // Persist to Supabase customers table
    try {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('customers')
        .upsert(
          {
            id: newCustomer.id,
            first_name: newCustomer.first_name,
            last_name: newCustomer.last_name,
            email: newCustomer.email,
            password_hash: passwordHash,
            phone: newCustomer.phone || null,
            is_active: true,
            created_at: newCustomer.created_at,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        )
        .select()
        .maybeSingle();

      if (insertErr) {
        console.warn('[Supabase Customer Insert Notice]:', insertErr.message);
      } else if (inserted?.id) {
        newCustomer.id = inserted.id;
      }
    } catch (e) {
      console.warn('[Supabase Customer Insert Exception]:', e);
    }

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
    let customer = cmsStore.getCustomerByEmail(cleanEmail);

    // If not found in memory, query Supabase customers table
    if (!customer) {
      try {
        const { data: dbCustomer } = await supabaseAdmin
          .from('customers')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (dbCustomer) {
          customer = cmsStore.createCustomer({
            id: dbCustomer.id,
            first_name: dbCustomer.first_name,
            last_name: dbCustomer.last_name,
            email: dbCustomer.email,
            password_hash: dbCustomer.password_hash,
            phone: dbCustomer.phone || '',
            is_active: dbCustomer.is_active !== false,
            delivery_address: dbCustomer.delivery_address || undefined,
          });
        }
      } catch (e) {}
    }

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
    try {
      await supabaseAdmin.from('customers').update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', customer.id);
    } catch (e) {}

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
      // Check Supabase
      try {
        const { data: dbCustomer } = await supabaseAdmin
          .from('customers')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (dbCustomer) {
          customer = cmsStore.createCustomer({
            id: dbCustomer.id,
            first_name: dbCustomer.first_name,
            last_name: dbCustomer.last_name,
            email: dbCustomer.email,
            password_hash: dbCustomer.password_hash,
            phone: dbCustomer.phone || '',
            is_active: dbCustomer.is_active !== false,
            delivery_address: dbCustomer.delivery_address || undefined,
          });
        }
      } catch (e) {}
    }

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

      const isUUID = data.googleId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.googleId);

      customer = cmsStore.createCustomer({
        id: isUUID ? data.googleId : undefined,
        first_name: first,
        last_name: last,
        email: cleanEmail,
        password_hash: '', // Social login
        is_active: true,
      });

      // Persist to Supabase
      try {
        const { data: inserted, error: upsertErr } = await supabaseAdmin
          .from('customers')
          .upsert(
            {
              id: customer.id,
              first_name: customer.first_name,
              last_name: customer.last_name,
              email: customer.email,
              password_hash: '',
              is_active: true,
              created_at: customer.created_at,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'email' }
          )
          .select()
          .maybeSingle();

        if (upsertErr) {
          console.warn('[Supabase Customer Upsert Notice]:', upsertErr.message);
        } else if (inserted?.id) {
          customer.id = inserted.id;
        }
      } catch (e) {
        console.warn('[Supabase Customer Upsert Exception]:', e);
      }
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
