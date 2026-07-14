"use client";

import { useState } from "react";
import {
  Award, Crown, Frame, Sparkles, Utensils, Dumbbell, Ticket, GlassWater, Shirt,
  Heart, Check, Gift, Store,
} from "lucide-react";
import { REWARDS, CAT_STYLE, type Reward, type RewardCategory } from "@/lib/rewards";

const ICONS: Record<string, typeof Award> = {
  award: Award, crown: Crown, frame: Frame, sparkles: Sparkles,
  utensils: Utensils, dumbbell: Dumbbell, ticket: Ticket, bottle: GlassWater, shirt: Shirt,
};

type Filter = "Semua" | RewardCategory;
const FILTERS: Filter[] = ["Semua", "Badge", "Frame", "Voucher", "Merch"];

function RewardCard({ r, balance, redeemed, onRedeem }: { r: Reward; balance: number; redeemed: boolean; onRedeem: (r: Reward) => void }) {
  const Icon = ICONS[r.icon] ?? Gift;
  const afford = balance >= r.hp;
  return (
    <div className="card card-pad card-hover flex flex-col">
      <div className="flex items-start justify-between">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl ${CAT_STYLE[r.category]}`}>
          <Icon className="h-6 w-6" />
        </span>
        <span className={`pill ${CAT_STYLE[r.category]}`}>{r.category}</span>
      </div>
      <h3 className="mt-4 font-display text-base font-bold">{r.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
      {r.partner && <p className="mt-2 text-xs text-muted-foreground">Mitra: <span className="font-medium text-foreground">{r.partner}</span></p>}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <span className="inline-flex items-center gap-1.5 font-display text-lg font-extrabold text-brand">
          <Heart className="h-4 w-4" /> {r.hp.toLocaleString("id-ID")}
        </span>
        {redeemed ? (
          <span className="pill bg-brand-soft text-brand"><Check className="h-3.5 w-3.5" /> Ditukar</span>
        ) : (
          <button
            onClick={() => onRedeem(r)}
            disabled={!afford}
            className="btn btn-primary btn-sm disabled:opacity-50"
          >
            {afford ? "Tukar" : "HP kurang"}
          </button>
        )}
      </div>
    </div>
  );
}

export function RewardStore() {
  const [balance, setBalance] = useState(3280);
  const [filter, setFilter] = useState<Filter>("Semua");
  const [redeemed, setRedeemed] = useState<Set<string>>(new Set());

  const list = filter === "Semua" ? REWARDS : REWARDS.filter((r) => r.category === filter);

  function redeem(r: Reward) {
    if (balance < r.hp || redeemed.has(r.id)) return;
    setBalance((b) => b - r.hp);
    setRedeemed((prev) => new Set(prev).add(r.id));
  }

  return (
    <div className="space-y-6">
      {/* balance */}
      <div className="card card-pad bg-gradient-to-br from-brand to-lime text-white">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20"><Store className="h-6 w-6" /></span>
          <div className="flex-1">
            <p className="text-sm text-white/85">Health Points kamu</p>
            <p className="stat-num text-3xl">{balance.toLocaleString("id-ID")} <span className="text-lg text-white/85">HP</span></p>
          </div>
          <Heart className="h-8 w-8 text-white/60" />
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r) => (
          <RewardCard key={r.id} r={r} balance={balance} redeemed={redeemed.has(r.id)} onRedeem={redeem} />
        ))}
      </div>
    </div>
  );
}
