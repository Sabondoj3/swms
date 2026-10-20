"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input } from "@/components/ui/primitives";

const categories = ["PLASTIC", "PAPER", "FOOD_ORGANIC", "METAL", "GLASS", "E_WASTE", "MIXED", "HAZARDOUS", "OTHER"];
const labels: Record<string, string> = {
  PLASTIC: "Plastic",
  PAPER: "Paper",
  FOOD_ORGANIC: "Food / organic",
  METAL: "Metal",
  GLASS: "Glass",
  E_WASTE: "E-waste",
  MIXED: "Mixed waste",
  HAZARDOUS: "Hazardous waste",
  OTHER: "Other",
};

type Rate = { wasteCategory: string; amount: number };

export default function PaymentRatesPanel() {
  const [rates, setRates] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/payment-rates")
      .then((response) => response.json())
      .then((data) => {
        const nextRates = Object.fromEntries(
          (data.rates ?? []).map((rate: Rate) => [rate.wasteCategory, String(rate.amount)])
        );
        setRates(nextRates);
      })
      .catch(() => setMessage("Unable to load payment rates."));
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");
    const payload = categories.map((wasteCategory) => ({
      wasteCategory,
      amount: Number(rates[wasteCategory] ?? 50),
      currency: "SLE",
    }));
    if (payload.some((rate) => !Number.isInteger(rate.amount) || rate.amount < 0)) {
      setMessage("Use whole, non-negative amounts for every waste type.");
      setSaving(false);
      return;
    }
    const response = await fetch("/api/admin/payment-rates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rates: payload }),
    });
    const data = await response.json();
    setMessage(response.ok ? "Payment rates saved. New confirmations will use these amounts." : data.error ?? "Unable to save payment rates.");
    setSaving(false);
  }

  return (
    <Card className="mt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">Collector payment rates</h2>
          <p className="mt-1 text-sm text-slate-500">Set the SLE amount for each waste type. Rates are captured when Admin confirms a collection; old payment records do not change.</p>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save rates"}</Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {categories.map((category) => (
          <label key={category} className="rounded-xl border border-slate-200 p-3 text-sm">
            <span className="font-semibold text-slate-700">{labels[category]}</span>
            <span className="mt-2 flex items-center gap-2">
              <span className="text-slate-500">SLE</span>
              <Input type="number" min="0" step="1" value={rates[category] ?? "50"} onChange={(event) => setRates((current) => ({ ...current, [category]: event.target.value }))} />
            </span>
          </label>
        ))}
      </div>
      {message ? <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{message}</p> : null}
    </Card>
  );
}
