"use client";

import { useState } from "react";

type PriceItem = {
  condition: string;
  steamPrice: string;
  steamRub: string;
  skinportPrice: string;
  linkSteam: string;
  linkLis: string;
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
  const [selectedSkin, setSelectedSkin] = useState("");
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

    if (!q) {
      setFiltered([]);
      return;
    }

    const words = q.split(" ").filter(Boolean);

    const found = skins
      .filter((skin) => {
        const name = skin.toLowerCase();
        return words.every((word) => name.includes(word));
      })
      .slice(0, 30);

    setFiltered(found);
    setResults([]);
  };

  const fetchPrices = async (skinName: string) => {
    setSelectedSkin(skinName);
    setFiltered([]);

    let usdToRub = 75;

    try {
      const rateRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const rateData = await rateRes.json();
      usdToRub = rateData.rates.RUB || 75;
    } catch {}

    const items: PriceItem[] = [];

    for (const cond of conditions) {
      const fullName = `${skinName} (${cond})`;

      try {
        const resSteam = await fetch(`/api/price?name=${encodeURIComponent(fullName)}`);
        const dataSteam = await resSteam.json();

        const steamRaw = dataSteam.lowest_price || dataSteam.median_price;

        let steamRub = "—";

        if (steamRaw) {
          const num = parseFloat(
            steamRaw
              .replace("$", "")
              .replace(",", "")
              .trim()
          );

          steamRub = `${Math.round(num * usdToRub)} ₽`;
        }

        let skinportPrice = "—";

        try {
          const resSkinport = await fetch(
            `https://api.skinport.com/v1/items?app_id=730&market_hash_name=${encodeURIComponent(fullName)}`
          );

          const dataSkinport = await resSkinport.json();

          if (dataSkinport && dataSkinport.length > 0 && dataSkinport[0].min_price) {
            const price = dataSkinport[0].min_price / 100;
            skinportPrice = `$${price.toFixed(2)}`;
          }
        } catch {}

        items.push({
          condition: cond,
          steamPrice: steamRaw || "нет данных",
          steamRub,
          skinportPrice,
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
    <main style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "#0b0b0b",
      color: "white",
      fontFamily: "Arial"
    }}>
      <div style={{
        width: "560px",
        background: "#111",
        padding: "20px",
        borderRadius: "12px"
      }}>
        <h1>CS2 Price Monitor</h1>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            placeholder="например: vulcan, lotus, redline"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, padding: "10px" }}
          />
          <button onClick={searchSkins}>Поиск</button>
        </div>

        {selectedSkin && (
          <p style={{ color: "#aaa", marginTop: 10 }}>
            Выбран скин: {selectedSkin}
          </p>
        )}

        <div style={{ marginTop: 15 }}>
          {filtered.map((skin, i) => (
            <div
              key={i}
              onClick={() => fetchPrices(skin)}
              style={{
                padding: "10px",
                background: "#1a1a1a",
                marginBottom: "6px",
                cursor: "pointer",
                borderRadius: "8px"
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
              background: "#1a1a1a",
              marginBottom: "8px",
              borderRadius: "8px"
            }}>
              <div style={{ fontWeight: "bold" }}>
                {item.condition}
              </div>

              <div style={{ marginTop: 5 }}>
                <div>Steam: {item.steamPrice} ({item.steamRub})</div>
                <div>Skinport: {item.skinportPrice}</div>
              </div>

              <div style={{ marginTop: 5, display: "flex", gap: 10 }}>
                <a href={item.linkSteam} target="_blank">Steam</a>
                <a href={item.linkLis} target="_blank">Lis-Skins</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}