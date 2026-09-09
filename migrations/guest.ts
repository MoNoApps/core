import config from "../config.json";
import { getCollection } from "../helpers/db";
import * as utils from "../helpers/utils";
import type { User } from "../src/types/index";

export async function createGuestUser(): Promise<User | null> {
  const guestCfg = { ...config.guest };
  if (!guestCfg || !guestCfg.email) {
    console.warn(
      "[Guest Migration] Guest user configuration not found in config.json",
    );
    return null;
  }

  const rawPassword = guestCfg.text || "guest1234";
  const usersCol = await getCollection<User>("users");

  const existingGuest = await usersCol.findOne({ email: guestCfg.email });
  if (existingGuest) {
    const userId = (existingGuest._id as any).toString();
    const { pwd } = utils.createPwd({ key: userId, text: rawPassword });
    await usersCol.updateOne(
      { _id: existingGuest._id } as any,
      { $set: { password: pwd, updatedAt: Date.now() } } as any,
    );
    console.log(
      `[Guest Migration] Updated existing guest user ${guestCfg.email}`,
    );
    return existingGuest;
  }

  const newGuestDoc: Partial<User> = {
    email: guestCfg.email,
    admin: Boolean(guestCfg.admin),
    status: guestCfg.status ?? 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const inserted = await usersCol.insertOne(newGuestDoc as any);
  const userId = inserted.insertedId.toString();
  const { pwd } = utils.createPwd({ key: userId, text: rawPassword });

  await usersCol.updateOne(
    { _id: inserted.insertedId } as any,
    { $set: { password: pwd } } as any,
  );

  console.log(`[Guest Migration] Created guest user ${guestCfg.email}`);
  return { ...newGuestDoc, _id: inserted.insertedId, password: pwd } as User;
}

if (process.env.NODE_ENV !== "test" && require.main === module) {
  createGuestUser()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Guest Migration] Failed:", err);
      process.exit(1);
    });
}

export default createGuestUser;
