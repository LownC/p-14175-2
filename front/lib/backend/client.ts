export function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  options.credentials = "include";

  if (options.body) {
    options.headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };
  }

  return fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`, options).then(
    async (res) => {
      const data = await res.json();
      if (!res.ok) throw data; // 실패 시 백엔드가 준 RsData를 그대로 throw
      return data as T;
    }
  );
}
