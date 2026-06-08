import crypto from 'crypto';
import { InviteRepository } from '../repositories/inviteRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { EmailService } from './email.js';

export class InviteService {
  static async sendInvitation(tenantId: string, email: string, role: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours validity

    const invite = await InviteRepository.createInvite({
      tenant_id: tenantId,
      email,
      role,
      token,
      expires_at: expiresAt.toISOString()
    });

    const portalUrl = process.env.CLIENT_PORTAL_URL || 'http://localhost:5173';
    const inviteLink = `${portalUrl}/accept-invite?token=${token}`;
    
    await EmailService.sendInviteEmail(email, inviteLink);
    return invite;
  }

  static async validateInvite(token: string) {
    const invite = await InviteRepository.getInviteByToken(token);
    if (!invite) {
      throw new Error('Invitation token not found');
    }

    if (invite.status !== 'pending') {
      throw new Error(`Invitation has already been ${invite.status}`);
    }

    if (new Date(invite.expires_at) < new Date()) {
      await InviteRepository.updateInviteStatus(invite.id, 'expired');
      throw new Error('Invitation has expired');
    }

    return invite;
  }

  static async acceptInvitation(token: string, userId: string, fullName: string) {
    const invite = await this.validateInvite(token);

    // Update state to accepted
    await InviteRepository.updateInviteStatus(invite.id, 'accepted');

    // Create user profile in users table
    const userProfile = await UserRepository.create({
      id: userId,
      tenant_id: invite.tenant_id,
      email: invite.email,
      full_name: fullName,
      role: invite.role
    });

    return userProfile;
  }
}
