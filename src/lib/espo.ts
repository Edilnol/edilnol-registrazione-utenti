type EspoError = {
  status: number;
  statusText: string;
  reason?: string | null;
};

function normalizeBaseUrl(input: string) {
  const base = input.replace(/\/+$/, "");
  if (base.endsWith("/api/v1")) return base;
  return `${base}/api/v1`;
}

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export function getEspoConfig() {
  const baseUrl = normalizeBaseUrl(getRequiredEnv("ESPOCRM_URL"));
  const apiKey = getRequiredEnv("ESPOCRM_API_KEY");
  return { baseUrl, apiKey };
}

export function hasEspoConfig() {
  return Boolean(process.env.ESPOCRM_URL) && Boolean(process.env.ESPOCRM_API_KEY);
}

export async function espoRequest<TResponse>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  params?: Record<string, any>,
): Promise<TResponse> {
  const { baseUrl, apiKey } = getEspoConfig();
  let url = `${baseUrl}/${path.replace(/^\/+/, "")}`;

  if (method === "GET" && params) {
    const pairs: Record<string, string> = {};
    const parents: Array<string | number> = [];

    const renderKey = () => {
      let out = "";
      let depth = 0;
      for (const x of parents) {
        const s = depth > 0 || typeof x === "number" ? `[${String(x)}]` : String(x);
        out += s;
        depth += 1;
      }
      return out;
    };

    const walk = (data: any) => {
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          parents.push(i);
          walk(data[i]);
          parents.pop();
        }
      } else if (data && typeof data === "object") {
        for (const [k, v] of Object.entries(data)) {
          parents.push(k);
          walk(v);
          parents.pop();
        }
      } else if (data !== undefined && data !== null) {
        pairs[renderKey()] = String(data);
      }
    };

    walk(params);

    const usp = new URLSearchParams(pairs);
    url += `?${usp.toString()}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const reason = res.headers.get("x-status-reason");

  const data = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const error: EspoError = {
      status: res.status,
      statusText: res.statusText,
      reason,
    };
    throw Object.assign(new Error("EspoCRM request failed"), { error, data });
  }

  return data as TResponse;
}
