import { NextRequest, NextResponse } from "next/server";

const workerURL = () =>
  (process.env.CRAWLER_WORKER_URL ?? "http://localhost:8080").replace(/\/$/, "");

const workerHeaders = (extra?: Record<string, string>) => ({
  Authorization: `Bearer ${process.env.WORKER_SECRET ?? ""}`,
  ...extra,
});

export async function GET() {
  const res = await fetch(`${workerURL()}/jobs`, {
    cache: "no-store",
    headers: workerHeaders(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${workerURL()}/jobs`, {
    method: "POST",
    headers: workerHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
