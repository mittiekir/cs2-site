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

  const fetchPrices = async () => {
    if (!query) return;

    let usdToRub = 90;

    // 🔥 получаем актуальный курс
    try {
      const rateRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const rateData = await rateRes.json();
      usdToRub = rateData.rates.RUB;
    } catch {
      console.log("курс не загрузился");
    }

    const items: PriceItem[] = [];

    for (const cond of conditions) {
      const fullName = `${query} (${cond})`;

      try {
        const resSteam = await fetch(`/api/price?name=${encodeURIComponent(fullName)}`);
        const dataSteam = await resSteam.json();

        const steamRaw = dataSteam.lowest_price || dataSteam.median_price;

        let steamRub = "—";

        if (steamRaw) {
          const num = parseFloat(steamRaw.replace("$", ""));
          steamRub = `${Math.round(num * usdToRub)} ₽`;
        }

        // Skinport
        let skinportPrice = "—";

        try {
          const resSkinport = await fetch(
            `https://api.skinport.com/v1/items?app_id=730&market_hash_name=${encodeURIComponent(fullName)}`
          );
          const dataSkinport = await resSkinport.json();

          if (dataSkinport && dataSkinport.length > 0) {
            const price = dataSkinport[0].min_price / 100;
            skinportPrice = `${price.toFixed(2)}$`;
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
      <div style={{ width: "540px", background: "#111", padding: "20px", borderRadius: "12px" }}>
        
        <h1>CS2 Price Monitor</h1>

        <input
          placeholder="AK-47 | Vulcan"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <button onClick={fetchPrices}>Найти</button>

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