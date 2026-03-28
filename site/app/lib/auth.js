import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

function EmailProvider(options) {
  return {
    id: "email",
    type: "email",
    name: "Email",
    from: options.from,
    maxAge: 60 * 60,
    async sendVerificationRequest({ identifier: email, url }) {
      const apiKey = process.env.UNISENDER_API_KEY;
      const senderEmail = options.from;

      const htmlBody = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#003336;margin-bottom:16px">Вход в ПроектЛист</h2>
        <p style="color:#404849;line-height:1.6">Нажмите на кнопку ниже, чтобы войти в аккаунт. Ссылка действительна 1 час.</p>
        <a href="${url}" style="display:inline-block;background:#003336;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;margin:24px 0">Войти в ПроектЛист</a>
        <p style="color:#707979;font-size:13px;margin-top:24px">Если вы не запрашивали вход — просто проигнорируйте это письмо.</p>
      </div>`;

      const params = new URLSearchParams();
      params.append("format", "json");
      params.append("api_key", apiKey);
      params.append("email", email);
      params.append("sender_name", "ПроектЛист");
      params.append("sender_email", senderEmail);
      params.append("subject", "Вход в ПроектЛист");
      params.append("body", htmlBody);
      params.append("list_id", process.env.UNISENDER_LIST_ID || "1");

      const res = await fetch("https://api.unisender.com/ru/api/sendEmail?format=json", {
        method: "POST",
        body: params,
      });

      const data = await res.json();
      console.log("Unisender response:", JSON.stringify(data));

      if (data.error) {
        throw new Error(`Unisender: ${data.error} — ${data.code || ""}`);
      }
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM || "noreply@projektlist.ru",
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
  },
  callbacks: {
    authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const isProtected = request.nextUrl.pathname.startsWith("/dashboard") ||
                          request.nextUrl.pathname.startsWith("/profile");
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      session.user.phone = user.phone;
      session.user.profileFilled = user.profileFilled;
      session.user.companyName = user.companyName;
      session.user.city = user.city;
      return session;
    },
  },
});
