import cds from "@sap/cds";

const UPSERTED_FLAG = Symbol.for("cap-user-info.upserted-this-tx");
const userInfoLogger = cds.log("cap.userinfo");

interface CsnEntity {
  name: string;
  kind?: string;
  elements?: Record<string, any>;
}

export function hasUserTrackedAspect(entity: CsnEntity): boolean {
  const entieies = entity?.elements;
  if (!entieies) return false;
  return Boolean(entieies._toCreatedUserInfo && entieies._toModifiedUserInfo);
}

async function upsertUserInfo(req: cds.Request): Promise<void> {
  const user = req.user;
  if (!user?.id || user.is("system-user") || (user as any)._is_anonymous) {
    userInfoLogger.debug(
      `Skipping user info upsert for system or anonymous user: ${user?.id}`,
    );
    return;
  }

  const ctx: any = cds.context;
  if (ctx && ctx[UPSERTED_FLAG]) return;
  if (ctx) ctx[UPSERTED_FLAG] = true;

  const { UserInfo } = cds.entities("cap.userinfo");
  let attr: any = (user as any).attr ?? {};
  if (Object.keys(attr).length === 0) {
    userInfoLogger.debug(
      `User ${user.id} has no attr property, using dummy values for user info upsert`,
    );
    attr.email = "Dummy@example.com";
    attr.givenName = user.id || "FirstName";
    attr.familyName = "LastName";
  }
  userInfoLogger.debug(
    `Upserting user info for user ${user.id}: ${JSON.stringify(attr)}`,
  );
  try {
    await UPSERT.into(UserInfo).entries({
      ID: user.id,
      Email: attr.email,
      GivenName: attr.givenName,
      FamilyName: attr.familyName,
    });
  } catch (error: any) {
    userInfoLogger.error(
      `Failed to upsert user info for user ${user.id}: ${error.message}`,
    );
  }
}

export function registerHandlers(srv: cds.ApplicationService): void {
  const tracked = [...srv.entities].filter(hasUserTrackedAspect);
  if (tracked.length === 0) return;

  userInfoLogger.debug(
    `Registering user info handlers for entities: ${tracked.map((e) => e.name).join(", ")}`,
  );
  srv.after(
    ["CREATE", "UPDATE"],
    tracked,
    async (_data: any, req: cds.Request) => {
      await upsertUserInfo(req);
    },
  );
}
