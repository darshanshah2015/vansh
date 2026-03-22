import { logger } from '../logger';
import * as claimsService from '../../components/claims/services/claims.service';
import * as mergeService from '../../components/merge/services/merge.service';
import { db } from '@db/index';
import { sessions } from '@db/schema/index';
import { lt } from 'drizzle-orm';

function runSafely(name: string, fn: () => Promise<unknown>) {
  fn()
    .then((result) => logger.info({ result }, `Scheduled job "${name}" completed`))
    .catch((err) => logger.error({ err }, `Scheduled job "${name}" failed`));
}

export function startScheduledJobs() {
  // Auto-approve claims past 7-day threshold (every hour)
  setInterval(() => {
    runSafely('processAutoApprovals', async () => {
      const count = await claimsService.processAutoApprovals();
      return { autoApproved: count };
    });
  }, 60 * 60 * 1000);

  // Expire stale merge proposals (every 6 hours)
  setInterval(() => {
    runSafely('expireStaleProposals', async () => {
      const count = await mergeService.expireStaleProposals();
      return { expired: count };
    });
  }, 6 * 60 * 60 * 1000);

  // Clean up expired sessions (every 6 hours)
  setInterval(() => {
    runSafely('cleanupSessions', async () => {
      const result = await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
      return { cleaned: true };
    });
  }, 6 * 60 * 60 * 1000);

  logger.info('Scheduled jobs started');
}
