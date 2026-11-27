import LoginPage from "@/app/auth/login/page";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your verified EdWorld Co. account.",
};

export default LoginPage;
