import type { NextRequest } from "next/server"

const SERVICE_ROUTES: Record<string, string> = {
  identity: process.env.BACKEND_IDENTITY_URL ?? "http://localhost:8081",
  company: process.env.BACKEND_COMPANY_URL ?? "http://localhost:8082",
  document: process.env.BACKEND_DOCUMENT_URL ?? "http://localhost:8083",
}

const DEFAULT_BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080"

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "accept-encoding",
  "content-length",
  "expect",
])

function resolveBackend(path: string[]): { baseUrl: string; remainingPath: string[] } {
  const firstSegment = path[0]?.toLowerCase() ?? ""

  if (firstSegment && SERVICE_ROUTES[firstSegment]) {
    return {
      baseUrl: SERVICE_ROUTES[firstSegment],
      remainingPath: path.slice(1),
    }
  }

  return {
    baseUrl: DEFAULT_BACKEND,
    remainingPath: ["api", ...path],
  }
}

async function proxyRequest(request: NextRequest, path: string[]) {
  const { baseUrl, remainingPath } = resolveBackend(path)
  const target = new URL(
    `${baseUrl}/${remainingPath.map(encodeURIComponent).join("/")}`
  )
  target.search = request.nextUrl.search

  const headers = new Headers()
  for (const [key, value] of request.headers) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  }
  headers.set("host", target.host)

  let response: Response
  try {
    const body = ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.arrayBuffer()

    response = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    })
  } catch (error) {
    return Response.json(
      {
        status: "DOWN",
        error: "Backend unreachable",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    )
  }

  const responseHeaders = new Headers()
  for (const [key, value] of response.headers) {
    if (key.toLowerCase() === "set-cookie") {
      continue
    }
    responseHeaders.set(key, value)
  }
  for (const cookie of response.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function OPTIONS(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params
  return proxyRequest(request, path)
}