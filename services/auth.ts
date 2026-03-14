import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/supabase/server";
import type { UUID } from "@/types/database";

export type MembershipContext = {
  userId: UUID;
  organizationId: UUID;
  entityId: UUID | null;
  roleId: UUID;
};

export async function getSessionUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getActiveMembershipContext(): Promise<MembershipContext | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("organization_id, entity_id, role_id, is_default")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("is_default", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const membership = memberships?.[0];
  if (!membership) {
    return null;
  }

  return {
    userId: user.id,
    organizationId: membership.organization_id,
    entityId: membership.entity_id,
    roleId: membership.role_id,
  };
}

export async function requireAuthenticatedUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireActiveMembership() {
  await requireAuthenticatedUser();
  const membership = await getActiveMembershipContext();

  if (!membership) {
    redirect("/login?reason=no-membership");
  }

  return membership;
}
