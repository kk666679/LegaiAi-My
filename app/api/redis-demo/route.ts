import { createClient, type RedisClientType } from "redis";
import { NextResponse } from "next/server";

declare global {
  var __redisClient: RedisClientType | undefined;
}

function getClient(): RedisClientType {
  if (globalThis.__redisClient) return globalThis.__redisClient;
  const url = process.env.REDIS_URL ?? process.env.LLC_REDIS_URL;
  if (!url) throw new Error("REDIS_URL (or LLC_REDIS_URL) is not set");
  const client = createClient({ url }) as RedisClientType;
  client.on("error", (err) => console.error("[redis]", err));
  void client.connect();
  globalThis.__redisClient = client;
  return client;
}

export async function GET() {
  try {
    const value = await getClient().get("myKey");
    return NextResponse.json({ value });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "redis error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { key, value } = await req.json();
    if (typeof key !== "string" || typeof value !== "string") {
      return NextResponse.json({ error: "key and value must be strings" }, { status: 400 });
    }
    await getClient().set(key, value);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "redis error" },
      { status: 500 },
    );
  }
}
