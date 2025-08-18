import Card from "@/components/Card";

export default function Home() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card title="Welcome">
        <p className="opacity-80">This is a minimal ORI Token Presale dApp with 1-tier affiliate support.</p>
        <ul className="list-disc ml-6 mt-3 opacity-80 text-sm">
          <li>Buy ORI with ETH at dynamic USD rate (Chainlink)</li>
          <li>Automatic token bonus by stage</li>
          <li>1-tier affiliate ETH commission</li>
        </ul>
      </Card>
      <Card title="Quick Links">
        <div className="flex gap-3">
          <a className="btn" href="/presale">Go to Presale</a>
          <a className="btn" href="/affiliate">Affiliate</a>
        </div>
      </Card>
    </div>
  );
}
