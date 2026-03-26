"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

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

const INTEREST_LABELS: Record<Interest, string> = {
  "Cucine e arredamento": "Cucine e arredamento",
  "Riscaldamento e clima": "Riscaldamento e clima",
  "Ceramiche e arredobagno": "Ceramiche e arredobagno",
  "Porte e serramenti": "Porte e serramenti",
};

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

function focusInput(el: HTMLInputElement | null) {
  if (!el) return;
  try {
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  } catch {}
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="text-balance text-xl font-semibold leading-tight md:text-5xl">{children}</h1>;
}

function ChoiceList<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T | "";
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={[
            "rounded-2xl border px-6 py-5 text-left text-xl font-semibold transition-colors md:text-2xl",
            opt === value
              ? "border-white bg-white text-[#003C5C]"
              : "border-white/10 bg-white/5 text-white hover:border-white/20",
          ].join(" ")}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export type TvKioskLeadFormProps = {
  forcedPreference?: Preference;
  headerTitle?: string;
};

export default function TvKioskLeadForm({
  forcedPreference,
  headerTitle = "In omaggio una consulenza con Interior Designer dal Valore di €250,00",
}: TvKioskLeadFormProps = {}) {
  const [mode, setMode] = useState<"form" | "done">("form");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  const [interests, setInterests] = useState<Interest[]>([]);
  const [preference, setPreference] = useState<Preference>(forcedPreference ?? "Appuntamento Showroom");
  const [focusedInterestIndex, setFocusedInterestIndex] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailLocal, setEmailLocal] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const lastNameRef = useRef<HTMLInputElement | null>(null);
  const emailLocalRef = useRef<HTMLInputElement | null>(null);
  const emailDomainRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);

  const stepsTotal = 5;
  const progress = useMemo(() => Math.round(((step + 1) / stepsTotal) * 100), [step]);

  const readFirstName = () => firstNameRef.current?.value.trim() ?? firstName.trim();
  const readLastName = () => lastNameRef.current?.value.trim() ?? lastName.trim();
  const readEmailLocal = () => (emailLocalRef.current?.value ?? emailLocal).trim();
  const readEmailDomain = () => (emailDomainRef.current?.value ?? emailDomain).trim();
  const readEmail = () => {
    const local = readEmailLocal();
    const domain = readEmailDomain();
    if (!local || !domain) return "";
    return `${local}@${domain}`;
  };
  const readPhone = () => phoneRef.current?.value ?? phoneNumber;

  const goBack = useCallback(() => {
    if (loading) return;
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }, [loading]);

  const ensureLeadCreated = useCallback(async (values?: { firstName: string; lastName: string; emailAddress: string }) => {
    if (leadId) return leadId;
    const payload = {
      firstName: values?.firstName ?? firstName.trim(),
      lastName: values?.lastName ?? lastName.trim(),
      emailAddress: values?.emailAddress ?? (() => {
        const local = emailLocal.trim();
        const domain = emailDomain.trim();
        return local && domain ? `${local}@${domain}` : "";
      })(),
    };
    const res = await fetch("/api/espo/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => null)) as any;
    if (!res.ok || !json?.leadId) {
      throw new Error(typeof json?.error === "string" ? json.error : "Creazione lead fallita");
    }
    setLeadId(String(json.leadId));
    return String(json.leadId);
  }, [emailDomain, emailLocal, firstName, lastName, leadId]);

  const next = useCallback(async () => {
    if (loading) return;
    setError(null);

    if (step === 0) {
      const v = readFirstName();
      if (v.length < 2) {
        setError("Inserisci il nome");
        return;
      }
      setFirstName(v);
      setStep(1);
      return;
    }

    if (step === 1) {
      const v = readLastName();
      if (v.length < 2) {
        setError("Inserisci il cognome");
        return;
      }
      setLastName(v);
      setStep(2);
      return;
    }

    if (step === 2) {
      const local = readEmailLocal();
      const domain = readEmailDomain();
      setEmailLocal(local);
      setEmailDomain(domain);
      const email = local && domain ? `${local}@${domain}` : "";
      if (!isValidEmail(email)) {
        setError("Inserisci un'email valida");
        return;
      }
      setLoading(true);
      try {
        await ensureLeadCreated({
          firstName: readFirstName(),
          lastName: readLastName(),
          emailAddress: email,
        });
        setStep(3);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Creazione lead fallita");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 3) {
      const phoneRaw = readPhone();
      setPhoneNumber(phoneRaw);
      const phone = normalizePhoneDigits(phoneRaw);
      if (phone.length < 6) {
        setError("Inserisci un numero valido");
        return;
      }
      setStep(4);
      return;
    }

    if (step === 4) {
      if (interests.length === 0) {
        setError("Seleziona almeno un interesse");
        return;
      }
      setLoading(true);
      try {
        const ensuredLeadId = await ensureLeadCreated();
        const res = await fetch("/api/espo/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: ensuredLeadId,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            emailAddress: (() => {
              const local = emailLocal.trim();
              const domain = emailDomain.trim();
              return local && domain ? `${local}@${domain}` : "";
            })(),
            phoneNumber: ensurePhoneInternational(phoneNumber),
            interests,
            preference: forcedPreference ?? "Appuntamento Showroom",
          }),
        });
        const json = (await res.json().catch(() => null)) as any;
        if (!res.ok) {
          throw new Error(typeof json?.error === "string" ? json.error : "Invio fallito");
        }
        setMode("done");
        setStep(0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Invio fallito");
      } finally {
        setLoading(false);
      }
      return;
    }
  }, [ensureLeadCreated, interests, loading, forcedPreference, step, emailLocal, emailDomain, firstName, lastName, phoneNumber]);

  const reset = () => {
    setMode("form");
    setStep(0);
    setLoading(false);
    setError(null);
    setLeadId(null);
    setInterests([]);
    setPreference(forcedPreference ?? "Appuntamento Showroom");
      setFirstName("");
      setLastName("");
      setEmailLocal("");
      setEmailDomain("");
      setPhoneNumber("");
    if (firstNameRef.current) firstNameRef.current.value = "";
    if (lastNameRef.current) lastNameRef.current.value = "";
    if (emailLocalRef.current) emailLocalRef.current.value = "";
    if (emailDomainRef.current) emailDomainRef.current.value = "";
    if (phoneRef.current) phoneRef.current.value = "";
  };

  useLayoutEffect(() => {
    if (mode !== "form") return;
    if (step === 0) focusInput(firstNameRef.current);
    if (step === 1) focusInput(lastNameRef.current);
    if (step === 2) focusInput(emailLocalRef.current);
    if (step === 3) focusInput(phoneRef.current);
  }, [mode, step]);

  useLayoutEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (mode !== "form") return;
      if (e.key === "Escape") {
        if (step > 0) {
          e.preventDefault();
          goBack();
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        next();
      }
      if (step === 4 && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        const delta = e.key === "ArrowUp" ? -1 : 1;
        setFocusedInterestIndex((i: number) => {
          const nextIndex = (i + delta + INTERESTS.length) % INTERESTS.length;
          return nextIndex;
        });
      }

      if (step === 4 && (e.key === "Enter" || e.key === " " || e.key === "Spacebar")) {
        e.preventDefault();
        const opt = INTERESTS[focusedInterestIndex] as Interest | undefined;
        if (!opt) return;
        setInterests((prev) => {
          const has = prev.includes(opt);
          if (has) return prev.filter((x) => x !== opt);
          return [...prev, opt];
        });
      }

      if (step === 4 && e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
      
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [focusedInterestIndex, goBack, mode, next, step]);

  if (mode === "done") {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12">
          <StepTitle>Grazie</StepTitle>
          <p className="mt-4 text-lg text-white/70 md:text-2xl">
            Registrazione completata. Ti contatteremo al più presto.
          </p>
          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-2xl bg-white px-6 py-5 text-xl font-semibold text-[#003C5C] transition-opacity disabled:opacity-50 md:text-2xl"
            >
              Nuova registrazione
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <h1 className="mb-8 text-left text-6xl font-bold text-white md:text-5xl lg:text-5xl leading-tight">
          {headerTitle}
        </h1>
        <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold text-white/60 md:text-lg">
            Step {step + 1} di {stepsTotal}
          </div>
          <div className="text-sm font-semibold text-white/60 md:text-lg">{progress}%</div>
        </div>
        <div className="mt-4 h-2 w-full rounded-full bg-white/10">
          <div className="h-2 rounded-full bg-white" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-10">
          {step === 0 ? (
            <>
              <StepTitle>Qual è il tuo nome?</StepTitle>
              <div className="mt-8">
                <input
                  ref={firstNameRef}
                  defaultValue={firstName}
                  placeholder="Nome"
                  autoComplete="given-name"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-xl text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none md:text-2xl"
                />
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <StepTitle>Qual è il tuo cognome?</StepTitle>
              <div className="mt-8">
                <input
                  ref={lastNameRef}
                  defaultValue={lastName}
                  placeholder="Cognome"
                  autoComplete="family-name"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-xl text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none md:text-2xl"
                />
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <StepTitle>Qual è la tua email?</StepTitle>
              <div className="mt-8">
                <div className="flex items-center gap-3">
                  <input
                    ref={emailLocalRef}
                    defaultValue={emailLocal}
                    placeholder="nome"
                    autoComplete="off"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-xl text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none md:text-2xl"
                    onKeyDown={(e) => {
                      if (e.key === "ArrowRight") {
                        e.preventDefault();
                        focusInput(emailDomainRef.current);
                      }
                    }}
                  />
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-2xl font-semibold text-white md:text-3xl">
                    @
                  </div>
                  <input
                    ref={emailDomainRef}
                    defaultValue={emailDomain}
                    placeholder="dominio.it"
                    autoComplete="off"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-xl text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none md:text-2xl"
                    onKeyDown={(e) => {
                      if (e.key === "ArrowLeft") {
                        e.preventDefault();
                        focusInput(emailLocalRef.current);
                      }
                    }}
                  />
                </div>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <StepTitle>Qual è il tuo cellulare?</StepTitle>
              <div className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
                <div className="flex items-center gap-2 text-xl md:text-2xl">
                  <span aria-hidden>🇮🇹</span>
                  <span className="font-semibold text-white">+39</span>
                </div>
                <input
                  ref={phoneRef}
                  defaultValue={phoneNumber}
                  placeholder="Numero di cellulare"
                  autoComplete="tel"
                  inputMode="tel"
                  className="ml-2 flex-1 bg-transparent text-xl text-white placeholder:text-white/40 focus:outline-none md:text-2xl"
                />
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <StepTitle>A cosa sei interessato?</StepTitle>
              <div className="mt-8">
                <div className="grid grid-cols-1 gap-4">
                  {INTERESTS.map((opt, idx) => {
                    const selected = interests.includes(opt);
                    const focused = idx === focusedInterestIndex;
                    return (
                      <div
                        key={opt}
                        className={[
                          "rounded-2xl border px-6 py-5 text-left text-xl font-semibold transition-colors md:text-2xl",
                          selected ? "border-white bg-white text-[#003C5C]" : "border-white/10 bg-white/5 text-white",
                          focused ? "ring-2 ring-white" : "",
                        ].join(" ")}
                      >
                        {selected ? "✓ " : ""}
                        {INTEREST_LABELS[opt]}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 text-lg font-semibold text-white/80 md:text-xl">
                  ↑ ↓ scegli · INVIO seleziona · → prosegui
                </div>
              </div>
            </>
          ) : null}

          {error && <div className="mt-8 rounded-2xl bg-red-500/20 p-4 text-base">{error}</div>}

          <div className="mt-8">
            <button
              type="button"
              onClick={next}
              disabled={loading}
              className="w-full rounded-2xl bg-white px-6 py-5 text-xl font-semibold text-[#003C5C] transition-opacity disabled:opacity-50 md:text-2xl"
            >
              {loading ? "Attendi..." : step < stepsTotal - 1 ? "Avanti" : "Invia"}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
