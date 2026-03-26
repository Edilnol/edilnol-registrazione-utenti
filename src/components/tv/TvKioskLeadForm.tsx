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
  return <h1 className="text-balance text-3xl font-semibold leading-tight md:text-5xl">{children}</h1>;
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

export default function TvKioskLeadForm() {
  const [mode, setMode] = useState<"form" | "done">("form");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  const [interest, setInterest] = useState<Interest | "">("");
  const [preference, setPreference] = useState<Preference | "">("");
  const [timeSlot, setTimeSlot] = useState("");

  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const lastNameRef = useRef<HTMLInputElement | null>(null);
  const emailLocalRef = useRef<HTMLInputElement | null>(null);
  const emailDomainRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);

  const stepsTotal = 6;
  const progress = useMemo(() => Math.round(((step + 1) / stepsTotal) * 100), [step]);

  const getFirstName = () => firstNameRef.current?.value.trim() ?? "";
  const getLastName = () => lastNameRef.current?.value.trim() ?? "";
  const getEmail = () => {
    const local = (emailLocalRef.current?.value ?? "").trim();
    const domain = (emailDomainRef.current?.value ?? "").trim();
    if (!local || !domain) return "";
    return `${local}@${domain}`;
  };
  const getPhone = () => phoneRef.current?.value ?? "";

  const goBack = useCallback(() => {
    if (loading) return;
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }, [loading]);

  const ensureLeadCreated = useCallback(async () => {
    if (leadId) return leadId;
    const payload = {
      firstName: getFirstName(),
      lastName: getLastName(),
      emailAddress: getEmail(),
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
  }, [leadId]);

  const next = useCallback(async () => {
    if (loading) return;
    setError(null);

    if (step === 0) {
      if (getFirstName().length < 2) {
        setError("Inserisci il nome");
        return;
      }
      setStep(1);
      return;
    }

    if (step === 1) {
      if (getLastName().length < 2) {
        setError("Inserisci il cognome");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const email = getEmail();
      if (!isValidEmail(email)) {
        setError("Inserisci un'email valida");
        return;
      }
      setLoading(true);
      try {
        await ensureLeadCreated();
        setStep(3);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Creazione lead fallita");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 3) {
      const phone = normalizePhoneDigits(getPhone());
      if (phone.length < 6) {
        setError("Inserisci un numero valido");
        return;
      }
      if (!interest) setInterest(INTERESTS[0]);
      setStep(4);
      return;
    }

    if (step === 4) {
      if (!interest) {
        setError("Seleziona un interesse");
        return;
      }
      if (!preference) setPreference(PREFERENCES[0]);
      setStep(5);
      return;
    }

    if (step === 5) {
      const needsSlot = preference === "Appuntamento Showroom" || preference === "Consulenza interior designer";
      if (!preference) {
        setError("Seleziona una preferenza");
        return;
      }
      if (needsSlot && !timeSlot.trim()) {
        setError("Seleziona una disponibilità");
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
            firstName: getFirstName(),
            lastName: getLastName(),
            emailAddress: getEmail(),
            phoneNumber: ensurePhoneInternational(getPhone()),
            interest,
            preference,
            timeSlot: needsSlot ? timeSlot : "",
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
    }
  }, [ensureLeadCreated, interest, loading, preference, step, timeSlot]);

  const reset = () => {
    setMode("form");
    setStep(0);
    setLoading(false);
    setError(null);
    setLeadId(null);
    setInterest("");
    setPreference("");
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
      if ((step === 4 || step === 5) && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        const delta = e.key === "ArrowUp" ? -1 : 1;
        if (step === 4) {
          const currentIndex = Math.max(0, INTERESTS.findIndex((x) => x === interest));
          const nextIndex = (currentIndex + delta + INTERESTS.length) % INTERESTS.length;
          setInterest(INTERESTS[nextIndex]);
        } else {
          const currentIndex = Math.max(0, PREFERENCES.findIndex((x) => x === preference));
          const nextIndex = (currentIndex + delta + PREFERENCES.length) % PREFERENCES.length;
          setPreference(PREFERENCES[nextIndex]);
        }
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [goBack, interest, mode, next, preference, step]);

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
      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12">
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
                  defaultValue=""
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
                  defaultValue=""
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
                    defaultValue=""
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
                    defaultValue=""
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
                  defaultValue=""
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
                <ChoiceList options={INTERESTS} value={interest} onChange={setInterest} />
              </div>
            </>
          ) : null}

          {step === 5 ? (
            <>
              <StepTitle>Cosa preferisci?</StepTitle>
              <div className="mt-8">
                <ChoiceList options={PREFERENCES} value={preference} onChange={setPreference} />
              </div>
              {(preference === "Appuntamento Showroom" || preference === "Consulenza interior designer") ? (
                <>
                  <div className="mt-10 text-2xl font-semibold">Quando preferisce?</div>
                  <div className="mt-4 grid grid-cols-1 gap-4">
                    {["Settimana - mattina", "Settimana - pomeriggio", "Sabato mattina", "Sabato pomeriggio"].map(
                      (opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setTimeSlot(opt)}
                          className={[
                            "rounded-2xl border px-6 py-5 text-left text-xl font-semibold transition-colors md:text-2xl",
                            timeSlot === opt
                              ? "border-white bg-white text-[#003C5C]"
                              : "border-white/10 bg-white/5 text-white hover:border-white/20",
                          ].join(" ")}
                        >
                          {opt}
                        </button>
                      ),
                    )}
                  </div>
                </>
              ) : null}
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
  );
}
