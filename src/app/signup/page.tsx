import SignupPage from "@/app/auth/signup/page";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your verified EdWorld Co. account.",
};

export default SignupPage;
