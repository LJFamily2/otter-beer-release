import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MODULE_KEYS } from "@/config/permissions";
import { BeerForm } from "../BeerForm";

export const metadata: Metadata = {
  title: "Tạo sản phẩm",
  robots: { index: false, follow: false },
};

export default async function NewBeerPage() {
  const session = await auth();
  if (!session?.user?.permissions?.[MODULE_KEYS.BEERS]?.add) {
    redirect("/admin/beers");
  }

  return <BeerForm mode="create" />;
}
