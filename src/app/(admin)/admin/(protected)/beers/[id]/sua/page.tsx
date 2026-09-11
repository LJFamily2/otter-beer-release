import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { MODULE_KEYS } from "@/config/permissions";
import { beerService } from "@/services/BeerService";
import {
  BeerForm,
  type BeerFormInitialData,
  type VariantFormState,
} from "../../BeerForm";

export const metadata: Metadata = {
  title: "Chỉnh sửa sản phẩm",
  robots: { index: false, follow: false },
};

interface EditBeerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBeerPage({ params }: EditBeerPageProps) {
  const session = await auth();
  if (!session?.user?.permissions?.[MODULE_KEYS.BEERS]?.edit) {
    redirect("/admin/beers");
  }

  const { id } = await params;
  const beer = await beerService.getById(id);
  if (!beer) {
    notFound();
  }

  const initialData: BeerFormInitialData = {
    imageKey: beer.imageKey,
    abv: beer.abv,
    ibu: beer.ibu,
    shopUrl: beer.shopUrl,
    findLocallyUrl: beer.findLocallyUrl,
    themeColor: beer.themeColor,
    themeColorContainer: beer.themeColorContainer,
    isFeatured: beer.isFeatured,
    status: beer.status,
    translations: Object.fromEntries(
      beer.translations.map((t) => [
        t.locale,
        { style: t.style, headline: t.headline, description: t.description },
      ])
    ) as BeerFormInitialData["translations"],
    // `?? []` rather than trusting the schema default: a Beer document saved
    // before `variants` existed has no such path, and in dev the compiled
    // model is cached across HMR reloads, so a server that booted before the
    // field was added hands back documents without it either way.
    imageNames: Object.fromEntries(
      (beer.imageNames ?? []).map((name) => [name.locale, name.shortName])
    ) as BeerFormInitialData["imageNames"],
    variants: (beer.variants ?? []).map<VariantFormState>((variant) => ({
      imageKey: variant.imageKey,
      names: Object.fromEntries(
        (variant.names ?? []).map((name) => [name.locale, name.shortName])
      ) as VariantFormState["names"],
    })),
  };

  return <BeerForm mode="edit" beerId={id} initialData={initialData} />;
}
