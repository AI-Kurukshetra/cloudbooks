import { ZodError } from "zod";
import { NextResponse } from "next/server";

import { getActiveMembershipContext } from "@/services/auth";
import { importBankTransactions } from "@/services/operations";

export async function POST(request: Request) {
  const membership = await getActiveMembershipContext();

  if (!membership) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const result = await importBankTransactions(membership, payload);

    return NextResponse.json({
      ok: true,
      message: `Imported ${result.insertedCount} bank transaction${result.insertedCount === 1 ? "" : "s"}.`,
      ...result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid bank sync payload.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to import bank transactions.",
      },
      { status: 400 },
    );
  }
}
