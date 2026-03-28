"use server";

import { signIn } from "../lib/auth";
import { redirect } from "next/navigation";

export async function loginWithEmail(formData) {
  const email = formData.get("email");

  try {
    await signIn("nodemailer", { email, redirect: false });
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    redirect("/login?error=send-failed");
  }

  redirect("/login/check-email");
}
