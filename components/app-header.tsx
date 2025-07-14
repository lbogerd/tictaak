import { Ticket } from "lucide-react";

export default function AppHeader() {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-4xl font-bold text-amber-800 mb-3 flex items-center justify-center gap-3">
        <Ticket className="w-8 h-8 rotate-90 text-amber-400" />
        TicTaak
      </h1>
    </div>
  );
}