import { NextResponse } from "next/server";
import { espoRequest, hasEspoConfig } from "@/lib/espo";

type CompleteBody = {
  leadId?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  emailAddress?: unknown;
  phoneNumber?: unknown;
  interest?: unknown;
  interests?: unknown;
  preference?: unknown;
  timeSlot?: unknown;
  message?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toInterests(body: CompleteBody) {
  if (Array.isArray(body.interests)) {
    const list = body.interests
      .filter((x) => isNonEmptyString(x))
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
    if (list.length > 0) return list;
  }
  if (isNonEmptyString(body.interest)) return [body.interest.trim()];
  return [];
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as CompleteBody | null;

  if (!body) {
    return NextResponse.json({ error: "Body mancante" }, { status: 400 });
  }

  if (
    !isNonEmptyString(body.leadId) ||
    !isNonEmptyString(body.firstName) ||
    !isNonEmptyString(body.lastName) ||
    !isNonEmptyString(body.emailAddress) ||
    !isNonEmptyString(body.phoneNumber) ||
    !isNonEmptyString(body.preference)
  ) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const interests = toInterests(body);
  if (interests.length === 0) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const leadId = body.leadId.trim();

  try {
    if (!hasEspoConfig()) {
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({ opportunityId: `dev-${Date.now().toString(36)}` });
      }
      return NextResponse.json({ error: "Configurazione CRM mancante" }, { status: 503 });
    }
    const needsTimeSlot =
      ["Appuntamento Showroom", "Consulenza interior designer"].includes(body.preference.trim());
    const slot = isNonEmptyString(body.timeSlot) ? body.timeSlot.trim() : "";
    const message = isNonEmptyString(body.message) ? body.message.trim() : "";

    const description = [
      "Registrazione showroom",
      `Interesse: ${interests.join(", ")}`,
      `Preferenza: ${body.preference.trim()}`,
      needsTimeSlot && slot ? `Disponibilità: ${slot}` : "",
      message ? `Messaggio: ${message}` : "",
    ].join("\n");

    const phone = body.phoneNumber.trim();
    const phoneInternational = phone.startsWith("+") ? phone : `+39${phone.replace(/\D/g, "")}`;

    await espoRequest("PUT", `Lead/${leadId}`, {
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      emailAddress: body.emailAddress.trim(),
      phoneNumber: phoneInternational,
      description,
    });

    const opportunityName = `${body.firstName.trim()} ${body.lastName.trim()} - ${interests.join(", ")}`;

    const teamIdByInterest: Record<string, string> = {
      "Cucine e arredamento": "66d72805bb5947922",
      "Riscaldamento e clima": "66ea70fc80d7d56e2",
      "Ceramiche e arredobagno": "6703e4de070813e20",
      "Porte e serramenti": "664f5d21a24f43a0e",
    };

    const teamsIds = Array.from(
      new Set(interests.map((i) => teamIdByInterest[i]).filter((id) => typeof id === "string")),
    );

    const today = new Date().toISOString().slice(0, 10);
    const opportunity = await espoRequest<{ id: string }>("POST", "Opportunity", {
      name: opportunityName,
      stage: "Prospecting",
      amount: 0,
      closeDate: today,
      cParentId: leadId,
      cParentType: "Lead",
      teamsIds,
      description,
    });

    return NextResponse.json({ opportunityId: opportunity.id });
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
