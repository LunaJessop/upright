import LegalDocument from "@/components/LegalDocument";
import { TERMS_SECTIONS } from "@/lib/legal";

export const metadata = {
  title: "Terms of Service — Upright",
  description:
    "Draft terms for using Upright: accounts, shop data, subscriptions, and cancellation.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      lede="The rules for using Upright. This is a draft for review before launch."
      sections={TERMS_SECTIONS}
    />
  );
}
