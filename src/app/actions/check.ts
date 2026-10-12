"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";

/** Used by the "Check number" page and the quick check in the header. */
export async function checkNumberAction(formData: FormData) {
  const user = await getCurrentUser();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!phone) redirect("/check?invalid=1");

  const found = (await db.driver.count({ where: { phone } })) > 0;
  await db.numberCheck.create({ data: { phone, found, userId: user.id } });

  redirect(`/check?phone=${encodeURIComponent(phone)}`);
}
