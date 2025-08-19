import ClientOnly from "@/components/ClientOnly";
import AffiliateClient from "./AffiliateClient";

export default function Page() {
  return (
    <ClientOnly>
      <AffiliateClient />
    </ClientOnly>
  );
}
