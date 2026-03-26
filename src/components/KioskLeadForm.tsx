"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Interest =
  | "Cucine e arredamento"
  | "Riscaldamento e clima"
  | "Ceramiche e arredobagno"
  | "Porte e serramenti";

type Preference = "Buono ferramenta" | "Appuntamento Showroom" | "Consulenza interior designer";

type FormData = {
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber: string;
  interest: Interest | "";
  preference: Preference | "";
};

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

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

const COUNTRY_PREFIX = "+39";

function ensurePhoneInternational(value: string) {
  const v = normalizePhone(value);
  if (v.startsWith("+")) return v;
  return `${COUNTRY_PREFIX}${v}`;
}

function PhoneInput({
  value,
  onChange,
  onEnter,
  autoFocus,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
      <div className="flex items-center gap-2 text-xl md:text-2xl">
        <span aria-hidden>🇮🇹</span>
        <span className="font-semibold text-white">{COUNTRY_PREFIX}</span>
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        onInput={(e) => onChange((e.target as HTMLInputElement).value.replace(/\D/g, ""))}
        onKeyUp={(e) => onChange((e.currentTarget as HTMLInputElement).value.replace(/\D/g, ""))}
        placeholder="Numero di cellulare"
        inputMode="tel"
        autoComplete="tel"
        autoFocus={autoFocus}
        className="ml-2 flex-1 bg-transparent text-xl text-white placeholder:text-white/40 focus:outline-none md:text-2xl"
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) onEnter();
        }}
      />
    </div>
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-balance text-3xl font-semibold leading-tight md:text-5xl">
      {children}
    </h1>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-white px-6 py-5 text-xl font-semibold text-[#003C5C] transition-opacity disabled:opacity-50 md:text-2xl"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-white/10 px-6 py-5 text-xl font-semibold text-white transition-opacity disabled:opacity-50 md:text-2xl"
    >
      {children}
    </button>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  inputMode,
  autoComplete,
  type = "text",
  onKeyDown,
  autoFocus,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  type?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onInput={(e) => onChange((e.target as HTMLInputElement).value)}
      onKeyUp={(e) => onChange((e.currentTarget as HTMLInputElement).value)}
      placeholder={placeholder}
      inputMode={inputMode}
      autoComplete={autoComplete}
      type={type}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-xl text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none md:text-2xl"
    />
  );
}

function focusInput(el: HTMLInputElement | null) {
  if (!el) return false;
  try {
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
    return true;
  } catch {
    return false;
  }
}

function ChoiceGrid<T extends string>({
  options,
  value,
  onChange,
  autoFocus,
  invertArrows,
  onEnter,
}: {
  options: readonly T[];
  value: T | "";
  onChange: (value: T) => void;
  autoFocus?: boolean;
  invertArrows?: boolean;
  onEnter?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoFocus && containerRef.current) {
      containerRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter?.();
          return;
        }
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          const currentIndex = Math.max(
            0,
            options.findIndex((o) => o === value),
          );
          const deltaBase = e.key === "ArrowUp" ? -1 : 1;
          const delta = invertArrows ? -deltaBase : deltaBase;
          const nextIndex = (currentIndex + delta + options.length) % options.length;
          onChange(options[nextIndex]);
        }
      }}
      className="grid grid-cols-1 gap-4 focus:outline-none"
      role="listbox"
      aria-activedescendant={String(value || "")}
    >
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
          role="option"
          aria-selected={opt === value}
          id={opt}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ChoiceButtons<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T | "";
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={[
            "w-full rounded-2xl border px-6 py-5 text-left text-xl font-semibold transition-colors",
            opt === value
              ? "border-white bg-white text-[#003C5C] shadow-lg"
              : "border-white/10 bg-white/5 text-white active:border-white/20",
          ].join(" ")}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function KioskLeadForm() {
  const params = useSearchParams();
  const isVertical = (params.get("orientation") || "").toLowerCase() === "vertical";
  const invertArrows = isVertical;
  const [mode, setMode] = useState<"form" | "done">("form");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const lastNameRef = useRef<HTMLInputElement | null>(null);
  const emailLocalRef = useRef<HTMLInputElement | null>(null);
  const emailDomainRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);

  const [data, setData] = useState<FormData>({
    firstName: "",
    lastName: "",
    emailAddress: "",
    phoneNumber: "",
    interest: "",
    preference: "",
  });

  const [emailLocal, setEmailLocal] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [needFocusNudge, setNeedFocusNudge] = useState(false);

  const stepsTotal = 6;
  const progress = useMemo(() => Math.round(((step + 1) / stepsTotal) * 100), [step]);

  const setField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const resetAll = useCallback(() => {
    clearResetTimer();
    setMode("form");
    setStep(0);
    setLoading(false);
    setError(null);
    setLeadId(null);
    setData({
      firstName: "",
      lastName: "",
      emailAddress: "",
      phoneNumber: "",
      interest: "",
      preference: "",
    });
  }, [clearResetTimer]);

  const ensureLeadCreated = useCallback(async () => {
    if (leadId) return leadId;

    const payload = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      emailAddress: data.emailAddress.trim(),
    };

    const res = await fetch("/api/espo/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await res.json().catch(() => null)) as unknown;

    if (!res.ok || !json || typeof json !== "object" || !("leadId" in json)) {
      const message =
        json && typeof json === "object" && "error" in json && typeof (json as any).error === "string"
          ? ((json as any).error as string)
          : "Creazione lead fallita";
      throw new Error(message);
    }

    const createdLeadId = (json as { leadId: string }).leadId;
    setLeadId(createdLeadId);
    return createdLeadId;
  }, [data.emailAddress, data.firstName, data.lastName, leadId]);

  const canGoNext = useMemo(() => {
    if (loading) return false;
    if (mode !== "form") return false;

    if (step === 0) return data.firstName.trim().length >= 2;
    if (step === 1) return data.lastName.trim().length >= 2;
    if (step === 2) return isValidEmail(data.emailAddress) || emailLocal.trim().length > 0;
    if (step === 3) return normalizePhone(data.phoneNumber).length >= 6;
    if (step === 4) return data.interest !== "";
    if (step === 5) return data.preference !== "";
    return false;
  }, [data, emailLocal, loading, mode, step]);

  const goBack = useCallback(() => {
    if (loading) return;
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }, [loading]);

  const goNext = useCallback(async () => {
    if (!canGoNext) return;
    setError(null);

    if (step === 2) {
      setLoading(true);
      try {
        await ensureLeadCreated();
        setStep((s) => Math.min(stepsTotal - 1, s + 1));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Non sono riuscito a salvare la tua email. Riprova.";
        setError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    setStep((s) => Math.min(stepsTotal - 1, s + 1));
  }, [canGoNext, ensureLeadCreated, step]);

  const submit = useCallback(async () => {
    if (!canGoNext) return;

    setLoading(true);
    setError(null);

    try {
      const ensuredLeadId = await ensureLeadCreated();

      const payload = {
        leadId: ensuredLeadId,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        emailAddress: data.emailAddress.trim(),
        phoneNumber: ensurePhoneInternational(data.phoneNumber),
        interest: data.interest,
        preference: data.preference,
      };

      const res = await fetch("/api/espo/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const message =
          json && typeof json === "object" && "error" in json && typeof (json as any).error === "string"
            ? ((json as any).error as string)
            : "Invio fallito";
        throw new Error(message);
      }

      setMode("done");
      setStep(0);

      clearResetTimer();
      resetTimerRef.current = window.setTimeout(() => {
        resetAll();
      }, 15000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Non sono riuscito a completare la registrazione. Riprova.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [canGoNext, clearResetTimer, data, ensureLeadCreated, resetAll]);

  const content = useMemo(() => {

    if (mode === "done") {
      return (
        <div className="flex h-full items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12">
            <StepTitle>Grazie</StepTitle>
            <p className="mt-4 text-lg text-white/70 md:text-2xl">
              Registrazione completata. Ti contatteremo al più presto.
            </p>
            <div className="mt-8 space-y-4">
              <PrimaryButton onClick={resetAll}>Nuova registrazione</PrimaryButton>
            </div>
          </div>
        </div>
      );
    }

    const canSubmitMobile =
      data.firstName.trim().length >= 2 &&
      data.lastName.trim().length >= 2 &&
      isValidEmail(data.emailAddress) &&
      normalizePhone(data.phoneNumber).length >= 6 &&
      data.interest !== "" &&
      data.preference !== "";

    return (
      <div className="h-full">
        <div className="md:hidden h-full overflow-y-auto overflow-x-hidden p-6 [-webkit-overflow-scrolling:touch] [touch-action:pan-y]">
          <div className="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="mt-2 text-sm font-semibold text-white/60">Compila i campi</div>

            <div className="mt-8 space-y-6">
              <div>
                <div className="text-2xl font-semibold">Nome</div>
                <div className="mt-3">
                  <TextInput
                    inputRef={firstNameRef}
                    value={data.firstName}
                    onChange={(v) => setField("firstName", v)}
                    placeholder="Nome"
                    autoComplete="given-name"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="text-2xl font-semibold">Cognome</div>
                <div className="mt-3">
                  <TextInput
                    inputRef={lastNameRef}
                    value={data.lastName}
                    onChange={(v) => setField("lastName", v)}
                    placeholder="Cognome"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <div className="text-2xl font-semibold">Email</div>
                <div className="mt-3">
                  <TextInput
                    inputRef={emailLocalRef}
                    value={data.emailAddress}
                    onChange={(v) => {
                      setLeadId(null);
                      setField("emailAddress", v);
                    }}
                    placeholder="nome@dominio.it"
                    autoComplete="email"
                    inputMode="email"
                    type="email"
                  />
                </div>
              </div>

              <div>
                <div className="text-2xl font-semibold">Cellulare</div>
                <div className="mt-3">
                  <PhoneInput
                    inputRef={phoneRef}
                    value={data.phoneNumber}
                    onChange={(v) => setField("phoneNumber", v)}
                    onEnter={() => {}}
                  />
                </div>
              </div>

              <div>
                <div className="text-2xl font-semibold">Interesse</div>
                <div className="mt-3">
                  <ChoiceButtons
                    options={INTERESTS}
                    value={data.interest}
                    onChange={(v) => setField("interest", v)}
                  />
                </div>
              </div>

              <div>
                <div className="text-2xl font-semibold">Preferenza</div>
                <div className="mt-3">
                  <ChoiceButtons
                    options={PREFERENCES}
                    value={data.preference}
                    onChange={(v) => setField("preference", v)}
                  />
                </div>
              </div>

              {error && <div className="rounded-2xl bg-red-500/20 p-4 text-base">{error}</div>}

              <PrimaryButton
                disabled={!canSubmitMobile || loading}
                onClick={() => {
                  if (!canSubmitMobile) return;
                  submit();
                }}
              >
                {loading ? "Invio..." : "Invia"}
              </PrimaryButton>
            </div>
          </div>
        </div>

        <div className="hidden md:flex h-full items-center justify-center p-6">
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
            {step === 0 && (
              <>
                <StepTitle>Qual è il tuo nome?</StepTitle>
                <div className="mt-6 rounded-3xl border border-white bg-white p-6 text-[#003C5C] md:p-8">
                  <div className="text-2xl font-semibold md:text-3xl">Inizia da qui</div>
                  <div className="mt-2 text-lg md:text-2xl">
                    Scrivi il tuo nome e premi <span className="font-bold">OK / INVIO</span>
                  </div>
                </div>
                <div className="mt-8">
                  <TextInput
                    inputRef={firstNameRef}
                    value={data.firstName}
                    onChange={(v) => setField("firstName", v)}
                    placeholder="Nome"
                    autoComplete="given-name"
                    onKeyDown={(e) => {
                      if (e.key === "Escape" && step > 0) {
                        e.preventDefault();
                        goBack();
                        return;
                      }
                      if (e.key === "Enter" && canGoNext) goNext();
                    }}
                    autoFocus
                  />
                </div>
                {needFocusNudge ? (
                  <div className="mt-6 flex items-center justify-center">
                    <div className="inline-flex items-center gap-3 rounded-full border border-white bg-white/10 px-6 py-3 text-lg font-semibold text-white shadow-lg animate-pulse md:text-2xl md:px-8 md:py-4">
                      <span className="rounded-md bg-white px-3 py-1 text-[#003C5C]">OK / INVIO</span>
                      <span>per attivare il campo</span>
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {step === 1 && (
              <>
                <StepTitle>Qual è il tuo cognome?</StepTitle>
                <div className="mt-8">
                  <TextInput
                    inputRef={lastNameRef}
                    value={data.lastName}
                    onChange={(v) => setField("lastName", v)}
                    placeholder="Cognome"
                    autoComplete="family-name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canGoNext) goNext();
                    }}
                    autoFocus
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <StepTitle>Qual è la tua email?</StepTitle>
                <div className="mt-8">
                  <div className="flex items-center gap-3">
                    <TextInput
                      inputRef={emailLocalRef}
                      value={emailLocal}
                      onChange={(v) => {
                        const nextLocal = v.replace(/\s+/g, "");
                        setEmailLocal(nextLocal);
                        const combined =
                          nextLocal && emailDomain ? `${nextLocal}@${emailDomain}` : nextLocal;
                        setLeadId(null);
                        setField("emailAddress", combined);
                      }}
                      placeholder="nome"
                      autoComplete="off"
                      type="text"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.preventDefault();
                          goBack();
                          return;
                        }
                        if (e.key === "Enter" || e.key === "ArrowRight") {
                          e.preventDefault();
                          emailDomainRef.current?.focus();
                        }
                      }}
                      autoFocus
                    />
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-2xl font-semibold text-white md:text-3xl">
                      @
                    </div>
                    <TextInput
                      inputRef={emailDomainRef}
                      value={emailDomain}
                      onChange={(v) => {
                        const nextDomain = v.replace(/\s+/g, "");
                        setEmailDomain(nextDomain);
                        const combined =
                          emailLocal && nextDomain ? `${emailLocal}@${nextDomain}` : emailLocal;
                        setLeadId(null);
                        setField("emailAddress", combined);
                      }}
                      placeholder="dominio.it"
                      autoComplete="off"
                      type="text"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.preventDefault();
                          goBack();
                          return;
                        }
                        if (e.key === "ArrowLeft") {
                          e.preventDefault();
                          emailLocalRef.current?.focus();
                          return;
                        }
                        if (e.key === "Enter" && canGoNext) {
                          e.preventDefault();
                          goNext();
                        }
                      }}
                    />
                  </div>
                </div>
                <p className="mt-4 text-sm text-white/60 md:text-base">
                  La salveremo subito per non perderla.
                </p>
              </>
            )}

            {step === 3 && (
              <>
                <StepTitle>Qual è il tuo cellulare?</StepTitle>
                <div className="mt-8">
                  <PhoneInput
                    inputRef={phoneRef}
                    value={data.phoneNumber}
                    onChange={(v) => setField("phoneNumber", v)}
                    onEnter={() => {
                      if (canGoNext) goNext();
                    }}
                    // ESC to go back from phone
                    // Note: PhoneInput handles only Enter; ESC handled here through onKeyDown in TextInput paths
                    autoFocus
                  />
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <StepTitle>A cosa sei interessato?</StepTitle>
                <div className="mt-8">
                  <ChoiceGrid
                    options={INTERESTS}
                    value={data.interest}
                    onChange={(v) => setField("interest", v)}
                    autoFocus
                    invertArrows={invertArrows}
                    onEnter={() => {
                      if (canGoNext) goNext();
                    }}
                  />
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <StepTitle>Cosa preferisci?</StepTitle>
                <div className="mt-8">
                  <ChoiceGrid
                    options={PREFERENCES}
                    value={data.preference}
                    onChange={(v) => setField("preference", v)}
                    autoFocus
                    invertArrows={invertArrows}
                    onEnter={() => {
                      if (canGoNext) submit();
                    }}
                  />
                </div>
              </>
            )}

            {error && <div className="mt-8 rounded-2xl bg-red-500/20 p-4 text-base">{error}</div>}
            <div className="mt-8">
              <PrimaryButton
                disabled={!canGoNext}
                onClick={() => {
                  if (step === 2 && !isValidEmail(data.emailAddress)) {
                    emailDomainRef.current?.focus();
                    return;
                  }
                  if (step < stepsTotal - 1) {
                    goNext();
                  } else {
                    submit();
                  }
                }}
              >
                {step < stepsTotal - 1 ? "Avanti (Invio)" : "Invia (Invio)"}
              </PrimaryButton>
            </div>
          </div>

          <div className="mt-10 space-y-4" />
          </div>
        </div>
      </div>
    );
  }, [
    canGoNext,
    data.emailAddress,
    data.firstName,
    data.interest,
    data.lastName,
    data.phoneNumber,
    data.preference,
    error,
    goBack,
    goNext,
    loading,
    mode,
    progress,
    resetAll,
    setField,
    step,
    submit,
    emailDomain,
    emailLocal,
    needFocusNudge,
  ]);

  useEffect(() => {
    if (mode !== "form") return;
    if (step === 4 && !data.interest) {
      setField("interest", INTERESTS[0]);
    }
    if (step === 5 && !data.preference) {
      setField("preference", PREFERENCES[0]);
    }
  }, [mode, step, data.interest, data.preference, setField]);

  // removed split email logic; input binds directly to data.emailAddress

  useEffect(() => {
    // Global key handlers removed to avoid interfering with native typing.
  }, []);

  useLayoutEffect(() => {
    if (mode !== "form" || step !== 0) return;
    let cancelled = false;
    let timeoutId: number | null = null;
    let tries = 0;

    const tryFocus = () => {
      if (cancelled) return;
      const el = firstNameRef.current;
      if (!el) {
        if (tries < 12) {
          tries += 1;
          timeoutId = window.setTimeout(tryFocus, 80);
        }
        return;
      }

      const ae = document.activeElement as HTMLElement | null;
      const tag = ae?.tagName?.toLowerCase() ?? "";
      const isTypingTarget =
        tag === "input" || tag === "textarea" || tag === "select" || (ae?.isContentEditable ?? false);

      if (isTypingTarget && ae !== el) return;

      try {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      } catch {}

      if (document.activeElement !== el && tries < 12) {
        tries += 1;
        timeoutId = window.setTimeout(tryFocus, 80);
      } else if (document.activeElement !== el) {
        setNeedFocusNudge(true);
        const onKey = (e: KeyboardEvent) => {
          const k = e.key;
          const code = (e as any).keyCode as number | undefined;
          if (k === "Enter" || code === 13 || code === 23) {
            const t = firstNameRef.current;
            if (t) {
              e.preventDefault();
              t.focus();
              try {
                const l = t.value.length;
                t.setSelectionRange(l, l);
              } catch {}
              setNeedFocusNudge(false);
              window.removeEventListener("keydown", onKey, true);
            }
          }
        };
        window.addEventListener("keydown", onKey, true);
      }
    };

    tryFocus();
    window.requestAnimationFrame(tryFocus);

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [mode, step]);

  useEffect(() => {
    if (mode !== "form" || step !== 2) return;
    const raw = data.emailAddress.trim();
    const at = raw.indexOf("@");
    if (at >= 0) {
      setEmailLocal(raw.slice(0, at));
      setEmailDomain(raw.slice(at + 1));
    } else {
      setEmailLocal(raw);
      setEmailDomain("");
    }
    const el = emailLocalRef.current;
    if (!el) return;
    try {
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    } catch {}
  }, [mode, step]);

  return content;
}
