import { NextResponse } from "next/server";
import { espoRequest, hasEspoConfig } from "@/lib/espo";

type LeadCreateBody = {
  firstName?: unknown;
  lastName?: unknown;
  emailAddress?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as LeadCreateBody | null;

  if (!body) {
    return NextResponse.json({ error: "Body mancante" }, { status: 400 });
  }

  if (
    !isNonEmptyString(body.firstName) ||
    !isNonEmptyString(body.lastName) ||
    !isNonEmptyString(body.emailAddress)
  ) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  try {
    if (!hasEspoConfig()) {
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({ leadId: `dev-${Date.now().toString(36)}` });
      }
      return NextResponse.json({ error: "Configurazione CRM mancante" }, { status: 503 });
    }
    const search = await espoRequest<{ list: Array<{ id: string }>; total: number }>(
      "GET",
      "Lead",
      undefined,
      {
        select: "id",
        where: [
          {
            type: "equals",
            attribute: "emailAddress",
            value: body.emailAddress.trim(),
          },
        ],
      },
    );

    if (Array.isArray(search.list) && search.list.length > 0) {
      return NextResponse.json({ leadId: search.list[0].id, existing: true });
    }

    const res = await espoRequest<{ id: string }>("POST", "Lead", {
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      emailAddress: body.emailAddress.trim(),
    });

    return NextResponse.json({ leadId: res.id, existing: false });
  } catch (e) {
    let msg = "Errore EspoCRM";
    if (e && typeof e === "object") {
      const anyE = e as any;
      if (anyE.error && typeof anyE.error.reason === "string") {
        msg = anyE.error.reason;
      } else if (typeof anyE.data === "string") {
        msg = anyE.data;
      } else if (anyE.data && typeof anyE.data.message === "string") {
        msg = anyE.data.message;
      }
    }
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
