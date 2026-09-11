import { headers } from "next/headers";

export type AppSection = "admin" | "marketing";

/**
 * Reads the x-app-section header proxy.ts sets for every /admin/* request.
 * Used by src/app/not-found.tsx, which is shared by both route trees and
 * needs to know which one a given 404 happened in — e.g. so "return home"
 * doesn't send an admin user out to the public marketing site.
 */
export async function getServerAppSection(): Promise<AppSection> {
  const headerList = await headers();
  return headerList.get("x-app-section") === "admin" ? "admin" : "marketing";
}
