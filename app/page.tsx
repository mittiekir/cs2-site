"use client";

import { useState } from "react";

type Skin = {
  name: string;
};

type PriceItem = {
  condition: string;
  steamPrice: string;
  steamRub: string;
  linkSteam: string;
  linkLis: string;
};

const fallbackSkins: Skin[] = [
  { name: "AK-47 | Vulcan" },
  { name: "AK-47 | Wild Lotus" },
  { name: "AK-47 | Redline" },
  { name: "AK-47 | Asiimov" },
  { name: "M4A4 | Howl" },
  { name: "AWP | Dragon Lore" },
  { name: "AWP | Asiimov" },
  { name: "M4A1-S | Printstream" },
  { name: "Desert Eagle | Blaze" }
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [allSkins, setAllSkins] = useState<Skin[]>([]);
  const [filtered, setFiltered] = useState<Skin[]>([]);
  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null);
  const [results, setResults] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(false);

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

      const apiSkins: Skin[] = Array.isArray(data.skins)
        ? data.skins.map((item: any) => ({
            name: typeof item === "string" ? item : item.name
          })).filter((item: Skin) => item.name)
        : [];

      const merged = [...fallbackSkins, ...apiSkins];

      setAllSkins(merged);
      return merged;
    } catch {
      setAllSkins(fallbackSkins);
      return fallbackSkins;
    }
  };

  const searchSkins = async () => {
    let skins = allSkins;

    if (skins.length === 0) {
      skins = await loadSkins();
    }

    const q = query.toLowerCase().trim();
    if (!q) return;

    const words = q.split(" ").filter(Boolean);

    const found = skins
      .filter((skin) => {
        const name = skin.name.toLowerCase();
        return words.every((word) => name.includes(word));
      })
      .slice(0, 30);

    setFiltered(found);
    setResults([]);
    setSelectedSkin(null);
  };

  const fetchPrices = async (skin: Skin) => {
    setSelectedSkin(skin);
    setFiltered([]);
    setLoading(true);

    let usdToRub = 75;

    try {
      const rateRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const rateData = await rateRes.json();
      usdToRub = rateData.rates.RUB || 75;
    } catch {}

    const items: PriceItem[] = [];

    for (const cond of conditions) {
      const fullName = `${skin.name} (${cond})`;

      try {
        const res = await fetch(`/api/price?name=${encodeURIComponent(fullName)}`);
        const data = await res.json();

        const priceRaw = data.lowest_price || data.median_price;

        let steamRub = "—";

        if (priceRaw) {
          const num = parseFloat(priceRaw.replace("$", "").replace(",", "").trim());
          steamRub = `${Math.round(num * usdToRub)} ₽`;
        }

        items.push({
          condition: cond,
          steamPrice: priceRaw || "нет данных",
          steamRub,
          linkSteam: `https://steamcommunity.com/market/listings/730/${encodeURIComponent(fullName)}`,
          linkLis: `https://lis-skins.com/ru/market/csgo/?q=${encodeURIComponent(fullName)}`
        });
      } catch {
        items.push({
          condition: cond,
          steamPrice: "ошибка",
          steamRub: "—",
          linkSteam: "#",
          linkLis: "#"
        });
      }
    }

    setResults(items);
    setLoading(false);
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top, #16351f, #050505 45%, #000)",
      color: "white",
      fontFamily: "Arial, sans-serif",
      padding: "36px 16px"
    }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h1 style={{ fontSize: 38, marginBottom: 8 }}>CS2 Price Monitor</h1>
        <p style={{ color: "#aaa", marginBottom: 24 }}>Поиск цен на скины CS2</p>

        <div style={{
          background: "#111",
          border: "1px solid #222",
          borderRadius: 20,
          padding: 22
        }}>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchSkins()}
              placeholder="vulcan, lotus, redline"
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 12,
                background: "#080808",
                color: "white",
                border: "1px solid #333"
              }}
            />

            <button
              onClick={searchSkins}
              style={{
                padding: "14px 22px",
                borderRadius: 12,
                border: "none",
                background: "#4ade80",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Поиск
            </button>
          </div>

          <div style={{ marginTop: 22, display: "grid", gap: 10 }}>
            {filtered.map((skin, i) => (
              <button
                key={i}
                onClick={() => fetchPrices(skin)}
                style={{
                  textAlign: "left",
                  background: "#181818",
                  border: "1px solid #2a2a2a",
                  borderRadius: 14,
                  padding: 16,
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                {skin.name}
              </button>
            ))}
          </div>

          {selectedSkin && (
            <div style={{
              marginTop: 24,
              padding: 16,
              background: "#101c15",
              border: "1px solid #1f5133",
              borderRadius: 16
            }}>
              Выбран скин: <b>{selectedSkin.name}</b>
            </div>
          )}

          {loading && <p style={{ color: "#aaa" }}>Загружаю цены...</p>}

          <div style={{ marginTop: 20 }}>
            {results.map((item, i) => (
              <div key={i} style={{
                background: "#181818",
                padding: 16,
                borderRadius: 16,
                marginBottom: 10
              }}>
                <b>{item.condition}</b>
                <div>Steam: {item.steamPrice} ({item.steamRub})</div>

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <a href={item.linkSteam} target="_blank">Steam</a>
                  <a href={item.linkLis} target="_blank">Lis-Skins</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}