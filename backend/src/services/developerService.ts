import crypto from 'crypto';
import { DeveloperRepository } from '../repositories/developerRepository.js';

export class DeveloperService {
  /**
   * Generates a new developer API key and saves its SHA-256 hash
   */
  static async generateApiKey(tenantId: string, keyName: string, expiresInDays: number = 30) {
    const prefix = 'esa_live_';
    const secret = crypto.randomBytes(24).toString('hex');
    const fullKey = `${prefix}${secret}`;
    const hashedKey = crypto.createHash('sha256').update(fullKey).digest('hex');
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    await DeveloperRepository.createApiKey({
      tenant_id: tenantId,
      key_name: keyName,
      key_prefix: prefix,
      hashed_key: hashedKey,
      expires_at: expiresAt
    });

    return {
      apiKey: fullKey,
      expiresAt
    };
  }

  /**
   * Verifies an incoming developer API key. Returns tenant ID if authentic and active.
   */
  static async verifyApiKey(apiKey: string): Promise<string | null> {
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyRecord = await DeveloperRepository.getApiKeyByHashedKey(hashedKey);
    
    if (!keyRecord) return null;
    
    if (keyRecord.expires_at && new Date() > new Date(keyRecord.expires_at)) {
      return null; // Key expired
    }

    return keyRecord.tenant_id;
  }

  /**
   * Asynchronously publishes events to configured external webhook endpoints
   */
  static async dispatchWebhook(tenantId: string, eventType: string, payload: any) {
    try {
      const activeHooks = await DeveloperRepository.getActiveWebhooks(tenantId);
      if (activeHooks.length === 0) return;

      const bodyPayload = JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload
      });

      // Execute dispatching in background
      for (const hook of activeHooks) {
        // Calculate cryptographic verification header
        const hmac = crypto.createHmac('sha256', hook.secret);
        const signature = hmac.update(bodyPayload).digest('hex');

        fetch(hook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-EAC-Event': eventType,
            'X-EAC-Signature': signature
          },
          body: bodyPayload
        })
        .then(async (res) => {
          const resBody = await res.text();
          await DeveloperRepository.logWebhookDelivery({
            tenant_id: tenantId,
            webhook_id: hook.id,
            event_type: eventType,
            payload,
            response_status: res.status,
            response_body: resBody.slice(0, 1000)
          });
        })
        .catch(async (err) => {
          console.error(`Failed to publish webhook to ${hook.url}:`, err.message);
          await DeveloperRepository.logWebhookDelivery({
            tenant_id: tenantId,
            webhook_id: hook.id,
            event_type: eventType,
            payload,
            response_status: 500,
            response_body: err.message || 'Connection failed'
          });
        });
      }
    } catch (err: any) {
      console.error('Failed to trigger webhook dispatching:', err.message);
    }
  }

  /**
   * Processes all pending/failed webhook events from the queue for a tenant
   */
  static async flushWebhookQueue(tenantId: string) {
    try {
      const queue = await DeveloperRepository.getWebhookQueue(tenantId);
      const pendingItems = queue.filter((item: any) => item.status === 'pending' || item.status === 'failed');

      for (const item of pendingItems) {
        // Mark as processing
        await DeveloperRepository.updateQueueItemStatus(item.id, 'processing', item.attempts + 1);

        try {
          // Dispatch immediately
          await this.dispatchWebhook(tenantId, item.event_type, item.payload);
          await DeveloperRepository.updateQueueItemStatus(item.id, 'processed', item.attempts + 1);
        } catch (err: any) {
          const nextAttempt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // retry in 10 mins
          const newStatus = item.attempts + 1 >= 3 ? 'failed' : 'pending';
          await DeveloperRepository.updateQueueItemStatus(
            item.id,
            newStatus,
            item.attempts + 1,
            nextAttempt
          );
        }
      }
    } catch (err: any) {
      console.error('Failed to flush webhook queue:', err.message);
    }
  }
}

