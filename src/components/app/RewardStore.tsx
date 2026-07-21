"use client";

import { useState } from "react";
import {
  Award, Crown, Frame, Sparkles, Utensils, Dumbbell, Ticket, GlassWater, Shirt,
  Heart, Check, Gift, Store, ShieldAlert
} from "lucide-react";
import { REWARDS, CAT_STYLE, type Reward, type RewardCategory } from "@/lib/rewards";

const ICONS: Record<string, typeof Award> = {
  award: Award, crown: Crown, frame: Frame, sparkles: Sparkles,
  utensils: Utensils, dumbbell: Dumbbell, ticket: Ticket, bottle: GlassWater, shirt: Shirt,
};

type Filter = "Semua" | RewardCategory;
const FILTERS: Filter[] = ["Semua", "Badge", "Frame", "Voucher", "Merch"];

function RewardCard({ 
  r, 
  balance, 
  redeemed, 
  onRedeem 
}: { 
  readonly r: Reward; 
  readonly balance: number; 
  readonly redeemed: boolean; 
  readonly onRedeem: (r: Reward) => void;
}) {
  const Icon = ICONS[r.icon] ?? Gift;
  const afford = balance >= r.hp;

  const isPartnerReward = r.category === "Voucher" || r.category === "Merch";

  return (
    <div className="card card-pad card-hover flex flex-col justify-between border-line bg-card">
      <div>
        <div className="flex items-start justify-between">
          <span className={`grid h-12 w-12 place-items-center rounded-2xl ${CAT_STYLE[r.category]}`}>
            <Icon className="h-6 w-6" />
          </span>
          <span className={`pill text-[9px] font-bold uppercase ${CAT_STYLE[r.category]}`}>{r.category}</span>
        </div>
        <h3 className="mt-4 font-display text-base font-bold text-foreground">{r.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground leading-normal">{r.desc}</p>
        {r.partner && (
          <p className="mt-2.5 text-[10px] text-muted-foreground">
            Mitra: <span className="font-semibold text-foreground">{r.partner}</span>
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line/45 pt-4 flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 font-display text-base font-extrabold text-brand">
          <Heart className="h-4 w-4 text-brand fill-brand" /> {r.hp.toLocaleString("id-ID")} <span className="text-[10px] text-muted-foreground font-normal">HP</span>
        </span>
        {isPartnerReward ? (
          <span className="pill bg-secondary text-muted-foreground font-semibold text-xs border border-line leading-none">
            Requires Partner Integration
          </span>
        ) : redeemed ? (
          <span className="pill bg-brand-soft text-brand font-bold text-xs flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Ditukar
          </span>
        ) : (
          <button
            onClick={() => onRedeem(r)}
            disabled={!afford}
            className="btn btn-primary btn-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {afford ? "Simulasikan Penukaran" : "HP Kurang"}
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
      <div className="card card-pad bg-gradient-to-br from-brand to-lime text-white shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20"><Store className="h-6 w-6" /></span>
          <div className="flex-1">
            <p className="text-xs text-white/80 font-bold uppercase tracking-wider">Demo HP Balance (Simulated)</p>
            <p className="stat-num text-3xl font-extrabold">{balance.toLocaleString("id-ID")} <span className="text-base text-white/80 font-normal">HP</span></p>
          </div>
          <Heart className="h-8 w-8 text-white/40 fill-white/10" />
        </div>
        <p className="text-[10px] text-white/70 italic mt-3 leading-normal border-t border-white/20 pt-2">
          * Production balance synchronization is deferred. Transactions are simulated locally.
        </p>
      </div>

      {/* Demo Rewards Disclaimer */}
      <div className="card card-pad bg-secondary/35 border-line/65 space-y-3">
        <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
          <ShieldAlert className="h-4.5 w-4.5 text-brand" /> Demo Rewards
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed leading-normal">
          Reward balances and redemptions in this competition MVP are simulated. Production rewards would require trusted completion, secure balance processing, and fulfillment validation.
        </p>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-line/20">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
              filter === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:text-foreground"
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
