"use client";

import { useState } from "react";

type PriceItem = {
  condition: string;
  price: string;
  priceNum: number;
  link: string;
};

const extraSkins = [
  "AK-47 | Wild Lotus",
  "AK-47 | Vulcan",
  "AK-47 | Fire Serpent",
  "AK-47 | Gold Arabesque",
  "AK-47 | Case Hardened",
  "M4A4 | Howl",
  "M4A1-S | Welcome to the Jungle",
  "AWP | Dragon Lore",
  "AWP | Gungnir",
  "AWP | Medusa",
  "Desert Eagle | Blaze"
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [allSkins, setAllSkins] = useState<string[]>([]);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [results, setResults] = useState<PriceItem[]>([]);

  const conditions = [
    "Factory New",
    "Minimal Wear",
    "Field-Tested",
    "Well-Worn",
    "Battle-Scarred"
  ];

  const loadSkins = async () => {
    try {
      const res = await fetch("/api/skins");
      const data = await res.json();

      const apiSkins: string[] = data.skins || [];
      const merged = Array.from(new Set([...extraSkins, ...apiSkins]));

      setAllSkins(merged);
      return merged;
    } catch {
      setAllSkins(extraSkins);
      return extraSkins;
    }
  };

  const searchSkins = async () => {
    let skins = allSkins;

    if (skins.length === 0) {
      skins = await loadSkins();
    }

    const q = query.toLowerCase().trim();

    const res = skins
      .filter((skin) => skin.toLowerCase().includes(q))
      .slice(0, 30);

    setFiltered(res);
  };

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
          link: `https://steamcommunity.com/market/listings/730/${encodeURIComponent(fullName)}`
        });
      } catch {
        items.push({
          condition: cond,
          price: "ошибка",
          priceNum: Infinity,
          link: "#"
        });
      }
    }

    items.sort((a, b) => a.priceNum - b.priceNum);
    setResults(items);
  };

  const cheapest = results.find((r) => r.priceNum !== Infinity);

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
      <div style={{ width: "500px", background: "#111", padding: "20px", borderRadius: "12px" }}>
        <h1>CS2 Price Monitor</h1>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            placeholder="например: lotus"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, padding: "10px" }}
          />
          <button onClick={searchSkins}>Поиск</button>
        </div>

        <div style={{ marginTop: 15 }}>
          {filtered.map((skin, i) => (
            <div
              key={i}
              onClick={() => fetchPrices(skin)}
              style={{
                padding: "8px",
                background: "#1a1a1a",
                marginBottom: "5px",
                cursor: "pointer",
                borderRadius: "6px"
              }}
            >
              {skin}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          {results.map((item, i) => (
            <div key={i} style={{
              padding: "10px",
              background: item === cheapest ? "#133d2b" : "#1a1a1a",
              marginBottom: "8px",
              borderRadius: "8px",
              opacity: item.price === "нет данных" ? 0.6 : 1
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  {item.condition}
                  {item === cheapest && " 🔥 ЛУЧШАЯ"}
                </span>
                <span style={{ color: item === cheapest ? "#4ade80" : "white" }}>
                  {item.price}
                </span>
              </div>

              <a
                href={item.link}
                target="_blank"
                style={{ fontSize: "12px", color: "#aaa", textDecoration: "none" }}
              >
                открыть в Steam
              </a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}