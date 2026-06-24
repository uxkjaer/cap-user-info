import cds from '@sap/cds';

const UPSERTED_FLAG = Symbol.for('cap-user-info.upserted-this-tx');

interface CsnEntity {
  name: string;
  kind?: string;
  elements?: Record<string, any>;
}

export function hasUserTrackedAspect(entity: CsnEntity): boolean {
  const els = entity?.elements;
  if (!els) return false;
  return Boolean(els._toCreatedUserInfo && els._toModifiedUserInfo);
}

async function upsertUserInfo(req: cds.Request): Promise<void> {
  const user = req.user;
  if (!user?.id || user.is('system-user') || (user as any)._is_anonymous) return;

  const ctx: any = cds.context;
  if (ctx && ctx[UPSERTED_FLAG]) return;
  if (ctx) ctx[UPSERTED_FLAG] = true;

  const { UserInfo } = cds.entities('cap.userinfo');
  const attr: any = (user as any).attr ?? {};
  await UPSERT.into(UserInfo).entries({
    ID: user.id,
    Email: attr.email,
    GivenName: attr.givenName,
    FamilyName: attr.familyName
  });
}

export function registerHandlers(srv: cds.ApplicationService): void {
  const tracked = [...srv.entities].filter(hasUserTrackedAspect);
  if (tracked.length === 0) return;

  srv.after(['CREATE', 'UPDATE'], tracked, async (_data: any, req: cds.Request) => {
    await upsertUserInfo(req);
  });
}
