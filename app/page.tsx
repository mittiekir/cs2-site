"use client";

import { useState } from "react";

type PriceItem = {
  condition: string;
  price: string;
  priceNum: number;
  steamLink: string;
  lisLink: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PriceItem[]>([]);

  const conditions = [
    "Factory New",
    "Minimal Wear",
    "Field-Tested",
    "Well-Worn",
    "Battle-Scarred"
  ];

  const fetchPrices = async (skinName: string) => {
    const items: PriceItem[] = [];

    for (const cond of conditions) {
      const fullName = `${skinName} (${cond})`;

      try {
        const res = await fetch(`/api/price?name=${encodeURIComponent(fullName)}`);
        const data = await res.json();

        const priceRaw = data.lowest_price || data.median_price;

        items.push({
          condition: cond,
          price: priceRaw || "нет данных",
          priceNum: priceRaw ? parseFloat(priceRaw.replace("$", "")) : Infinity,
          steamLink: `https://steamcommunity.com/market/listings/730/${encodeURIComponent(fullName)}`,
          lisLink: `https://lis-skins.com/ru/market/csgo/?q=${encodeURIComponent(fullName)}`
        });
      } catch {
        items.push({
          condition: cond,
          price: "ошибка",
          priceNum: Infinity,
          steamLink: "#",
          lisLink: "#"
        });
      }
    }

    items.sort((a, b) => a.priceNum - b.priceNum);
    setResults(items);
  };

  return (
    <main style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "#0b0b0b",
      color: "white",
      fontFamily: "Arial"
    }}>
      <div style={{ width: "520px", background: "#111", padding: "20px", borderRadius: "12px" }}>
        <h1>CS2 Price Monitor</h1>

        <input
          placeholder="например: AK-47 | Vulcan"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <button onClick={() => fetchPrices(query)}>Найти</button>

        <div style={{ marginTop: 20 }}>
          {results.map((item, i) => (
            <div key={i} style={{
              padding: "10px",
              background: "#1a1a1a",
              marginBottom: "8px",
              borderRadius: "8px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{item.condition}</span>
                <span>{item.price}</span>
              </div>

              <div style={{ marginTop: 5, display: "flex", gap: 10 }}>
                <a href={item.steamLink} target="_blank">Steam</a>
                <a href={item.lisLink} target="_blank">Lis-Skins</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}