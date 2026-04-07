import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const { createTransport } = await import("nodemailer");
        const transport = createTransport(provider.server);
        await transport.sendMail({
          to: email,
          from: provider.from,
          subject: "Вход в ПроектЛист",
          text: `Для входа в ПроектЛист перейдите по ссылке: ${url}`,
          html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f8f9fa">
<div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e0e0e0">
<h2 style="color:#003336;margin:0 0 16px">Вход в ПроектЛист</h2>
<p style="color:#404849;line-height:1.6;margin:0 0 24px">Вы запросили ссылку для входа в аккаунт. Нажмите кнопку ниже, чтобы войти.</p>
<a href="${url}" style="display:inline-block;background:#003336;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Войти в ПроектЛист</a>
<p style="color:#707979;font-size:13px;margin:24px 0 0">Ссылка действительна 1 час. Если вы не запрашивали вход — проигнорируйте это письмо.</p>
</div>
<p style="color:#999;font-size:11px;text-align:center;margin:16px 0 0">© ПроектЛист — projectlist.pro</p>
</body></html>`,
        });
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return baseUrl + url;
      return baseUrl + "/dashboard";
    },
    authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const isProtected = request.nextUrl.pathname.startsWith("/dashboard") ||
                          request.nextUrl.pathname.startsWith("/profile") ||
                          request.nextUrl.pathname.startsWith("/my-requests") ||
                          request.nextUrl.pathname.startsWith("/claim-card");
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
