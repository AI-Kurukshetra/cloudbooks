import { redirect } from "next/navigation";

import { LoginForm } from "@/app/(auth)/login/login-form";
import { getActiveMembershipContext, getSessionUser } from "@/services/auth";

export default async function LoginPage() {
  const user = await getSessionUser();

  if (user) {
    const membership = await getActiveMembershipContext();
    if (membership) {
      redirect("/dashboard");
    }
  }

  return <LoginForm />;
}
