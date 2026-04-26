"use client";

import { useState } from "react";

type Skin = {
  name: string;
  image: string;
};

type PriceItem = {
  condition: string;
  steamPrice: string;
  steamRub: string;
  linkSteam: string;
  linkLis: string;
};

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
    const res = await fetch("/api/skins");
    const data = await res.json();
    const skins: Skin[] = data.skins || [];
    setAllSkins(skins);
    return skins;
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
      .filter((skin) =>
        words.every((word) => skin.name.toLowerCase().includes(word))
      )
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
        <h1 style={{ fontSize: 38 }}>CS2 Price Monitor</h1>

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
              onKeyDown={(e) => {
                if (e.key === "Enter") searchSkins();
              }}
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
            <button onClick={searchSkins} style={{
              padding: "14px 22px",
              borderRadius: 12,
              border: "none",
              background: "#4ade80",
              fontWeight: "bold"
            }}>
              Поиск
            </button>
          </div>

          <div style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
            gap: 12
          }}>
            {filtered.map((skin, i) => (
              <button
                key={i}
                onClick={() => fetchPrices(skin)}
                style={{
                  background: "#181818",
                  border: "1px solid #2a2a2a",
                  borderRadius: 16,
                  padding: 12,
                  color: "white",
                  cursor: "pointer"
                }}
              >
                {skin.image ? (
                  <img
                    src={skin.image}
                    alt={skin.name}
                    style={{
                      width: "100%",
                      height: 120,
                      objectFit: "contain"
                    }}
                  />
                ) : (
                  <div style={{ height: 120, color: "#777" }}>Нет картинки</div>
                )}
                <div style={{ fontWeight: "bold" }}>{skin.name}</div>
              </button>
            ))}
          </div>

          {selectedSkin && (
            <div style={{ marginTop: 24 }}>
              <h2>{selectedSkin.name}</h2>
              {selectedSkin.image && (
                <img src={selectedSkin.image} alt={selectedSkin.name} style={{ width: 220 }} />
              )}
            </div>
          )}

          {loading && <p>Загружаю цены...</p>}

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