import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@wallet/db";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    session: {
        strategy: "jwt",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    prompt: "select_account", // Forces Google to ask which account to use
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
        GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_SECRET || "",
            allowDangerousEmailAccountLinking: true
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing email or password");
                }

                const user = await db.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    throw new Error("Invalid email or password");
                }

                // ⚠️ Handle Google OAuth users trying to sign in with password
                if (!user.password) {
                    throw new Error("This account was created with Google. Please sign in with Google.");
                }

                if (!user.emailVerified) {
                    throw new Error("Please verify your email before signing in");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Invalid email or password");
                }

                return {
                    id: user.id.toString(),
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                };
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET || "secret",
    callbacks: {
        // Sync OAuth users to database upon initial login
        async signIn({ user, account }) {
            if (account?.provider === "google" || account?.provider === "github") {
                if (!user.email) return false;

                const existingUser = await db.user.findUnique({
                    where: { email: user.email },
                });

                if (!existingUser) {
                    await db.user.create({
                        data: {
                            email: user.email,
                            name: user.name || "",
                            image: user.image || null,
                            emailVerified: new Date(),
                            Wallet: {
                                create: {
                                    balance: BigInt(0),
                                    locked: BigInt(0),
                                    currency: "INR",
                                },
                            },
                        },
                    });
                } else if (!existingUser.emailVerified) {
                    await db.user.update({
                        where: { email: user.email },
                        data: { emailVerified: new Date() },
                    });
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }

            // Fetch phone if it's not in the token yet
            if (!token.phone && token.sub) {
                const dbUser = await db.user.findUnique({
                    where: { id: token.sub },
                    select: { phone: true }, // replace with 'number' if that's your Prisma field name
                });
                token.phone = dbUser?.phone ?? null;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { id?: string }).id = token.id as string;
                (session.user as { phone?: string | null }).phone = token.phone as string | null;
            }
            return session;
        },
    },
    pages: {
        signIn: "/signin",
    },
};