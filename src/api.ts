const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT ?? 'http://localhost:3000'

export async function api<T>(
  path: string,
  options?: RequestInit & { sessionToken?: string },
): Promise<T> {
  const { sessionToken, ...fetchOptions } = options ?? {}
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(sessionToken ? { 'x-session-token': sessionToken } : {}),
  }
  const res = await fetch(`${API_ENDPOINT}${path}`, {
    ...fetchOptions,
    headers: { ...headers, ...(fetchOptions.headers as Record<string, string>) },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed with status ${res.status}`)
  }
  return res.json()
}

export async function apiMultipart<T>(
  path: string,
  formData: FormData,
  sessionToken: string,
): Promise<T> {
  const res = await fetch(`${API_ENDPOINT}${path}`, {
    method: 'POST',
    headers: { 'x-session-token': sessionToken },
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed with status ${res.status}`)
  }
  return res.json()
}
