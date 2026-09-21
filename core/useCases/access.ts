import { ClientInfo, normalizePagePath } from '../entities/access';
import { ActivityActor } from '../entities/activity';
import { AccessLog } from '../ports/accessLog';
import { parsePeriod } from './period';

type Dependencies = {
  log: AccessLog
  actor: ActivityActor
  now?: () => Date
}

// Like the activity journal, this one must never get in the way: a sign in and a navigation
// work even when their record could not be written.
const safely = async (what: string, write: () => Promise<void>) => {
  try {
    await write();
  } catch (error) {
    console.error(`Failed to record ${what}`, error);
  }
};

export const createRecordSignIn = ({ log, actor, now = () => new Date() }: Dependencies) =>
  (client: ClientInfo) =>
    safely('a sign in', () => log.record({ at: now().toISOString(), actor, kind: 'signIn', path: null, ...client }));

// a page reported again within this time is the same opening: a double click, a re-render, React strict mode
export const REPEATED_PAGE_VIEW_SECONDS = 5;

type PageViewDependencies = Dependencies & { locales: readonly string[] }

export const createRecordPageView = ({ log, actor, locales, now = () => new Date() }: PageViewDependencies) =>
  (path: unknown, client: ClientInfo) =>
    safely('a page view', async () => {
      const page = normalizePagePath(path, locales);
      if (!page) return;

      const [last] = await log.list({ limit: 1, actorId: actor.id });
      const isRepeated = last?.kind === 'pageView' && last.path === page &&
        now().getTime() - new Date(last.at).getTime() < REPEATED_PAGE_VIEW_SECONDS * 1000;

      if (isRepeated) return;

      await log.record({ at: now().toISOString(), actor, kind: 'pageView', path: page, ...client });
    });

export const DEFAULT_ACCESS_LIMIT = 30;
const MAX_ACCESS_LIMIT = 200;

export const createGetAccessLog = ({ log }: { log: AccessLog }) =>
  (query: { limit?: number, actorId?: string, from?: unknown, to?: unknown } = {}) => {
    const period = parsePeriod(query.from, query.to);
    const limit = query.limit || (period ? MAX_ACCESS_LIMIT : DEFAULT_ACCESS_LIMIT);

    return log.list({
      limit: Math.min(Math.max(Math.trunc(limit), 1), MAX_ACCESS_LIMIT),
      actorId: query.actorId || undefined,
      period,
    });
  };
