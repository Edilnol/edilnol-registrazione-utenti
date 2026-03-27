"use client";

import { useMemo, useState } from "react";

type Interest =
  | "Cucine e arredamento"
  | "Riscaldamento e clima"
  | "Ceramiche e arredobagno"
  | "Porte e serramenti";

type Preference = "Buono ferramenta" | "Appuntamento Showroom" | "Consulenza interior designer";

const INTERESTS: Interest[] = [
  "Cucine e arredamento",
  "Riscaldamento e clima",
  "Ceramiche e arredobagno",
  "Porte e serramenti",
];

const PREFERENCES: Preference[] = [
  "Buono ferramenta",
  "Appuntamento Showroom",
  "Consulenza interior designer",
];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function ensurePhoneInternational(phoneDigits: string) {
  const digits = normalizePhoneDigits(phoneDigits);
  if (!digits) return "";
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("39")) return `+${digits}`;
  return `+39${digits}`;
}

function SelectField<T extends string>({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: T | "";
  onChange: (value: T | "") => void;
  options: readonly T[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange((e.target.value as T) || "")}
      className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-xl font-semibold text-white focus:border-white/20 focus:outline-none"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt} className="text-black">
          {opt}
        </option>
      ))}
    </select>
  );
}

export type MobileLeadFormProps = {
  forcedPreference?: Preference;
  headerTitle?: string;
  headerSubtitle?: string;
  submitLabel?: string;
  hidePreferenceField?: boolean;
};

export default function MobileLeadForm({
  forcedPreference,
  headerTitle = "Compila i campi",
  headerSubtitle,
  submitLabel = "Invia",
  hidePreferenceField = Boolean(forcedPreference),
}: MobileLeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [interests, setInterests] = useState<Interest[]>([]);
  const [preference, setPreference] = useState<Preference | "">(forcedPreference ?? "");

  const effectivePreference = forcedPreference ?? preference;

  const canSubmit = useMemo(() => {
    return (
      firstName.trim().length >= 2 &&
      lastName.trim().length >= 2 &&
      isValidEmail(emailAddress) &&
      normalizePhoneDigits(phoneNumber).length >= 6 &&
      interests.length > 0 &&
      effectivePreference !== "" &&
      !loading
    );
  }, [
    emailAddress,
    effectivePreference,
    firstName,
    interests,
    lastName,
    loading,
    phoneNumber,
  ]);

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const leadRes = await fetch("/api/espo/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          emailAddress: emailAddress.trim(),
        }),
      });
      const leadJson = (await leadRes.json().catch(() => null)) as any;
      if (!leadRes.ok || !leadJson?.leadId) {
        throw new Error(typeof leadJson?.error === "string" ? leadJson.error : "Creazione lead fallita");
      }

      const completeRes = await fetch("/api/espo/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: String(leadJson.leadId),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          emailAddress: emailAddress.trim(),
          phoneNumber: ensurePhoneInternational(phoneNumber),
          interests,
          preference: effectivePreference,
        }),
      });
      const completeJson = (await completeRes.json().catch(() => null)) as any;
      if (!completeRes.ok) {
        throw new Error(typeof completeJson?.error === "string" ? completeJson.error : "Invio fallito");
      }

      setFirstName("");
      setLastName("");
      setEmailAddress("");
      setPhoneNumber("");
      setInterests([]);
      setPreference("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invio fallito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden p-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] [touch-action:pan-y]">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="mt-2 text-5xl leading-10 font-bold text-white leading-tight">{headerTitle}</h1>
        {headerSubtitle ? <div className="mt-4 text-4xl text-white/80">{headerSubtitle}</div> : null}

        <div className="mt-8 space-y-6">
          <div>
            <div className="text-2xl font-semibold">Nome</div>
            <div className="mt-3">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Nome"
                autoComplete="given-name"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-xl text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="text-2xl font-semibold">Cognome</div>
            <div className="mt-3">
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Cognome"
                autoComplete="family-name"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-xl text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="text-2xl font-semibold">Email</div>
            <div className="mt-3">
              <input
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="nome@dominio.it"
                autoComplete="email"
                inputMode="email"
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-xl text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="text-2xl font-semibold">Cellulare</div>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
              <div className="flex items-center gap-2 text-xl">
                <span aria-hidden>🇮🇹</span>
                <span className="font-semibold text-white">+39</span>
              </div>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Numero di cellulare"
                inputMode="tel"
                autoComplete="tel"
                className="ml-2 flex-1 bg-transparent text-xl text-white placeholder:text-white/40 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="text-2xl font-semibold">Interessi</div>
            <div className="mt-3">
              <div className="grid grid-cols-1 gap-3">
                {INTERESTS.map((opt) => {
                  const selected = interests.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setInterests((prev) => {
                          if (prev.includes(opt)) return prev.filter((x) => x !== opt);
                          return [...prev, opt];
                        });
                      }}
                      className={[
                        "w-full rounded-2xl border px-6 py-5 text-left text-xl font-semibold transition-colors",
                        selected
                          ? "border-white bg-white text-[#003C5C]"
                          : "border-white/10 bg-white/5 text-white hover:border-white/20",
                      ].join(" ")}
                    >
                      {selected ? "✓ " : ""}
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="text-2xl font-semibold">Preferenza</div>
            <div className="mt-3">
              {hidePreferenceField ? (
                <div className="w-full rounded-2xl border border-white/10 bg-white/10 px-6 py-5 text-xl font-semibold text-white">
                  {effectivePreference}
                </div>
              ) : (
                <SelectField
                  placeholder="Seleziona preferenza"
                  options={PREFERENCES}
                  value={preference}
                  onChange={(v) => setPreference(v as Preference | "")}
                />
              )}
            </div>
          </div>

          {error && <div className="rounded-2xl bg-red-500/20 p-4 text-base">{error}</div>}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="w-full rounded-2xl bg-white px-6 py-5 text-xl font-semibold text-[#003C5C] transition-opacity disabled:opacity-50"
          >
            {loading ? "Invio..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
