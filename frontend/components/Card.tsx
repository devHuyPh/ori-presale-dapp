import { ReactNode } from "react";
export default function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="card">
      {title && <div className="mb-3 font-semibold text-lg">{title}</div>}
      {children}
    </div>
  );
}
