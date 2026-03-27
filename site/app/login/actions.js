"use server";

import { signIn } from "../lib/auth";

export async function loginWithEmail(formData) {
  const email = formData.get("email");
  await signIn("nodemailer", { email, redirectTo: "/dashboard" });
}
