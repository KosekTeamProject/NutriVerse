"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { HelpFAQ } from "@/features/help/data";

export function HelpAccordion({ faqs }: { readonly faqs: HelpFAQ[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div key={faq.id} className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition hover:border-brand/50">
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-left font-bold text-foreground focus:outline-none"
              onClick={() => toggle(faq.id)}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${faq.id}`}
            >
              <span>{faq.question}</span>
              <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-brand" : ""}`} />
            </button>
            <div
              id={`faq-answer-${faq.id}`}
              className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
