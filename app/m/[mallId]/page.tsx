import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMall } from "@/lib/malls";
import MallApp from "@/components/MallApp";

export async function generateMetadata(
  props: PageProps<"/m/[mallId]">,
): Promise<Metadata> {
  const { mallId } = await props.params;
  const mall = getMall(mallId);
  return { title: mall ? `${mall.mall.name} – ROAM` : "ROAM" };
}

export default async function MallPage(props: PageProps<"/m/[mallId]">) {
  const { mallId } = await props.params;
  const mall = getMall(mallId);
  if (!mall) notFound();

  // ?from= and ?to= are read client-side by MallApp.
  return <MallApp mall={mall} />;
}
