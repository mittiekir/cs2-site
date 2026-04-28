"use client";

import { useState } from "react";

type Skin = { name: string };

type PriceItem = {
  condition: string;
  steamPrice: string;
  steamRub: string;
  skinportPrice: string;
  linkSteam: string;
  linkLis: string;
  linkDmarket: string;
  linkCsfloat: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [allSkins, setAllSkins] = useState<Skin[]>([]);
  const [filtered, setFiltered] = useState<Skin[]>([]);
  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null);
  const [results, setResults] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  const conditions = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"];

  const removeDuplicates = (skins: Skin[]) => {
    const map = new Map<string, Skin>();

    skins.forEach((skin) => {
      const key = skin.name.toLowerCase().trim();
      if (!map.has(key)) map.set(key, skin);
    });

    return Array.from(map.values());
  };

  const loadSkins = async () => {
    try {
      const res = await fetch("/api/skins");
      const data = await res.json();
      const apiSkins: Skin[] = data.skins || [];

      const merged = removeDuplicates([...fallbackSkins, ...apiSkins]);

      setAllSkins(merged);
      return merged;
    } catch {
      setAllSkins(fallbackSkins);
      return fallbackSkins;
    }
  };

  const searchSkins = async () => {
    let skins = allSkins.length ? allSkins : await loadSkins();

    const q = query.toLowerCase().trim();
    if (!q) return;

    const words = q.split(" ").filter(Boolean);

    const found = removeDuplicates(skins)
      .filter((skin) => words.every((word) => skin.name.toLowerCase().includes(word)))
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

      let steamPrice = "нет данных";
      let steamRub = "—";
      let skinportPrice = "—";

      try {
        const resSteam = await fetch(`/api/price?name=${encodeURIComponent(fullName)}`);
        const dataSteam = await resSteam.json();
        const priceRaw = dataSteam.lowest_price || dataSteam.median_price;

        if (priceRaw) {
          steamPrice = priceRaw;
          const num = parseFloat(priceRaw.replace("$", "").replace(",", "").trim());
          steamRub = `${Math.round(num * usdToRub)} ₽`;
        }
      } catch {}

      try {
        const resSkinport = await fetch(`/api/skinport?name=${encodeURIComponent(fullName)}`);
        const dataSkinport = await resSkinport.json();

        if (dataSkinport.success && dataSkinport.price) {
          skinportPrice = dataSkinport.price;
        }
      } catch {}

      items.push({
        condition: cond,
        steamPrice,
        steamRub,
        skinportPrice,
        linkSteam: `https://steamcommunity.com/market/listings/730/${encodeURIComponent(fullName)}`,
        linkLis: `https://lis-skins.com/ru/market/csgo/?q=${encodeURIComponent(fullName)}`,
        linkDmarket: `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${encodeURIComponent(fullName)}`,
        linkCsfloat: `https://csfloat.com/search?market_hash_name=${encodeURIComponent(fullName)}`
      });
    }

    setResults(items);
    setLoading(false);
  };

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(circle at top, #16351f, #050505 45%, #000)", color: "white", fontFamily: "Arial, sans-serif", padding: "36px 16px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h1 style={{ fontSize: 38, marginBottom: 8 }}>CS2 Price Monitor</h1>
        <p style={{ color: "#aaa", marginBottom: 24 }}>Steam + Skinport + ссылки на другие маркеты</p>

        <div style={{ background: "#111", border: "1px solid #222", borderRadius: 20, padding: 22 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchSkins()}
              placeholder="vulcan, lotus, redline"
              style={{ flex: 1, padding: 14, borderRadius: 12, background: "#080808", color: "white", border: "1px solid #333" }}
            />

            <button onClick={searchSkins} style={{ padding: "14px 22px", borderRadius: 12, border: "none", background: "#4ade80", fontWeight: "bold", cursor: "pointer" }}>
              Поиск
            </button>
          </div>

          <div style={{ marginTop: 22, display: "grid", gap: 10 }}>
            {filtered.map((skin, i) => (
              <button key={i} onClick={() => fetchPrices(skin)} style={{ textAlign: "left", background: "#181818", border: "1px solid #2a2a2a", borderRadius: 14, padding: 16, color: "white", cursor: "pointer", fontWeight: "bold" }}>
                {skin.name}
              </button>
            ))}
          </div>

          {selectedSkin && (
            <div style={{ marginTop: 24, padding: 16, background: "#101c15", border: "1px solid #1f5133", borderRadius: 16 }}>
              Выбран скин: <b>{selectedSkin.name}</b>
            </div>
          )}

          {loading && <p style={{ color: "#aaa" }}>Загружаю цены...</p>}

          <div style={{ marginTop: 20 }}>
            {results.map((item, i) => (
              <div key={i} style={{ background: "#181818", padding: 16, borderRadius: 16, marginBottom: 10, border: "1px solid #2a2a2a" }}>
                <b>{item.condition}</b>

                <div style={{ marginTop: 8 }}>
                  <div>Steam: {item.steamPrice} ({item.steamRub})</div>
                  <div>Skinport: {item.skinportPrice}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 12 }}>
                  <a href={item.linkSteam} target="_blank" style={linkStyle}>Steam</a>
                  <a href={item.linkLis} target="_blank" style={linkStyle}>Lis-Skins</a>
                  <a href={item.linkDmarket} target="_blank" style={linkStyle}>DMarket</a>
                  <a href={item.linkCsfloat} target="_blank" style={linkStyle}>CSFloat</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

const linkStyle = {
  textAlign: "center" as const,
  padding: "10px",
  background: "#242424",
  color: "white",
  borderRadius: 10,
  textDecoration: "none",
  fontSize: 14
};