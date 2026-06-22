// Throwaway diagnostic: reproduce the app's insert and print the REAL error.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Parse .env.local manually (Next isn't running here).
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", url);
console.log("anon key present:", Boolean(anon), "| service key present:", Boolean(service));

const admin = createClient(url, service);
const client = createClient(url, anon);

// 1) Does the table exist / how many rows? (service key bypasses RLS)
const countRes = await admin
  .from("prayer_requests")
  .select("*", { count: "exact", head: true });
console.log("\n[1] table check (service):",
  countRes.error ? `ERROR ${countRes.error.code}: ${countRes.error.message}` : `OK, row count = ${countRes.count}`);

// 1b) Anon SELECT — if policies are missing, this returns 0 even though service sees 6.
const anonSel = await client
  .from("prayer_requests")
  .select("*", { count: "exact", head: true });
console.log("[1b] anon select count:",
  anonSel.error ? `ERROR ${anonSel.error.code}: ${anonSel.error.message}` : anonSel.count);

// 1c) Do the role-helper functions exist?
const fn = await client.rpc("is_approver");
console.log("[1c] is_approver() rpc:",
  fn.error ? `MISSING/ERROR: ${fn.error.message}` : `exists -> ${fn.data}`);

// 2) Reproduce the exact app insert with the ANON key (what the browser does).
const testRow = {
  title: "__diagnostic test row__",
  category: "our-people",
  subcategory: "community",
  description: "diagnostic",
  prayer_points: ["one", "two"],
  source: "Community Request",
  source_url: null,
  featured: false,
  prayer_count: 0,
  status: "pending",
};
// Plain insert (no .select) — mirrors the fixed app: submit to the queue.
const insRes = await client.from("prayer_requests").insert(testRow);
if (insRes.error) {
  console.log("\n[2] anon submit FAILED:");
  console.log("   code:   ", insRes.error.code);
  console.log("   message:", insRes.error.message);
} else {
  console.log("\n[2] anon submit SUCCEEDED (row queued as pending) ✅ — cleaning up test row");
  await admin.from("prayer_requests").delete().eq("title", testRow.title);
}
