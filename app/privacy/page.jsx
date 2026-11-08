import LegalDocument from "@/components/LegalDocument";
import { PRIVACY_SECTIONS } from "@/lib/legal";

export const metadata = {
  title: "Privacy Policy — Upright",
  description:
    "Draft privacy policy: what Upright stores, who processes it, and how to ask for a copy or deletion.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      lede="How a shop's account, recipes, and billing are handled. This is a draft for review before launch."
      sections={PRIVACY_SECTIONS}
    />
  );
}
