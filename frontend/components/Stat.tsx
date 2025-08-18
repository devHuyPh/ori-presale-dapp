export default function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl p-4 border border-white/10 bg-black/20">
      <div className="label">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
