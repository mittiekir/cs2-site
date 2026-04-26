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
  skinportPrice: string;
  linkSteam: string;
  linkLis: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [allSkins, setAllSkins] = useState<Skin[]>([]);
  const [filtered, setFiltered] = useState<Skin[]>([]);
  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null);
  const [results, setResults] = useState<PriceItem[]>([]);

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
    setAllSkins(data.skins || []);
    return data.skins || [];
  };

  const searchSkins = async () => {
    let skins = allSkins;

    if (skins.length === 0) {
      skins = await loadSkins();
    }

    const q = query.toLowerCase().trim();
    const words = q.split(" ").filter(Boolean);

    const res = skins
      .filter((skin) => {
        const name = skin.name.toLowerCase();
        return words.every((word) => name.includes(word));
      })
      .slice(0, 20);

    setFiltered(res);
  };

  const fetchPrices = async (skin: Skin) => {
    setSelectedSkin(skin);
    setFiltered([]);

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
        const resSteam = await fetch(`/api/price?name=${encodeURIComponent(fullName)}`);
        const dataSteam = await resSteam.json();

        const steamRaw = dataSteam.lowest_price || dataSteam.median_price;

        let steamRub = "—";

        if (steamRaw) {
          const num = parseFloat(
            steamRaw.replace("$", "").replace(",", "")
          );
          steamRub = `${Math.round(num * usdToRub)} ₽`;
        }

        items.push({
          condition: cond,
          steamPrice: steamRaw || "нет данных",
          steamRub,
          skinportPrice: "—",
          linkSteam: `https://steamcommunity.com/market/listings/730/${encodeURIComponent(fullName)}`,
          linkLis: `https://lis-skins.com/ru/market/csgo/?q=${encodeURIComponent(fullName)}`
        });
      } catch {
        items.push({
          condition: cond,
          steamPrice: "ошибка",
          steamRub: "—",
          skinportPrice: "—",
          linkSteam: "#",
          linkLis: "#"
        });
      }
    }

    setResults(items);
  };

  return (
    <main style={{ padding: 20, color: "white", background: "#0b0b0b", minHeight: "100vh" }}>
      
      <h1>CS2 Price Monitor</h1>

      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="vulcan, lotus..."
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={searchSkins}>Поиск</button>
      </div>

      {/* список с картинками */}
      <div style={{ marginTop: 20 }}>
        {filtered.map((skin, i) => (
          <div
            key={i}
            onClick={() => fetchPrices(skin)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 10,
              background: "#1a1a1a",
              marginBottom: 5,
              cursor: "pointer"
            }}
          >
            <img src={skin.image} width={60} />
            {skin.name}
          </div>
        ))}
      </div>

      {/* выбранный */}
      {selectedSkin && (
        <div style={{ marginTop: 20 }}>
          <h2>{selectedSkin.name}</h2>
          <img src={selectedSkin.image} width={200} />
        </div>
      )}

      {/* цены */}
      <div style={{ marginTop: 20 }}>
        {results.map((item, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            {item.condition} — {item.steamPrice} ({item.steamRub})
          </div>
        ))}
      </div>

    </main>
  );
}