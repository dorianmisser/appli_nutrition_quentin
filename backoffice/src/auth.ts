import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { authConfig } from "./auth.config";
import { connectDB } from "@/lib/mongodb";
import { loginSchema } from "@/lib/validators";
import { User } from "@/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await connectDB();
        const user = await User.findOne({ email: parsed.data.email, active: true }).select(
          "+passwordHash"
        );
        if (!user) return null;

        const valid = await verify(user.passwordHash, parsed.data.password);
        if (!valid) return null;

        await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
        return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
