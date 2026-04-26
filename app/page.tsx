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

const extraSkins: Skin[] = [
  {
    name: "AK-47 | Wild Lotus",
    image: "https://community.cloudflare.steamstatic.com/economy/image/class/730/4451248578/360fx360f"
  },
  {
    name: "AK-47 | Vulcan",
    image: "https://community.cloudflare.steamstatic.com/economy/image/class/730/310776760/360fx360f"
  }
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
    const res = await fetch("/api/skins");
    const data = await res.json();

    const apiSkins: Skin[] = data.skins || [];
    const merged = [...extraSkins, ...apiSkins];

    setAllSkins(merged);
    return merged;
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
      .slice(0, 24);

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
          const num = parseFloat(
            priceRaw.replace("$", "").replace(",", "").trim()
          );
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
        <p style={{ color: "#aaa", marginBottom: 24 }}>
          Поиск цен на скины CS2
        </p>

        <div style={{
          background: "#111",
          border: "1px solid #222",
          borderRadius: 20,
          padding: 22,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
        }}>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchSkins();
              }}
              placeholder="Например: vulcan, lotus, redline"
              style={{
                flex: 1,
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid #333",
                background: "#080808",
                color: "white",
                fontSize: 15,
                outline: "none"
              }}
            />

            <button
              onClick={searchSkins}
              style={{
                padding: "14px 22px",
                borderRadius: 12,
                border: "none",
                background: "#4ade80",
                color: "#06130b",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Поиск
            </button>
          </div>

          {filtered.length > 0 && (
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
                    cursor: "pointer",
                    color: "white",
                    textAlign: "left"
                  }}
                >
                  <img
                    src={skin.image}
                    alt={skin.name}
                    style={{
                      width: "100%",
                      height: 120,
                      objectFit: "contain",
                      marginBottom: 10
                    }}
                  />
                  <div style={{ fontWeight: "bold" }}>{skin.name}</div>
                </button>
              ))}
            </div>
          )}

          {selectedSkin && (
            <div style={{
              marginTop: 24,
              display: "flex",
              gap: 20,
              alignItems: "center",
              background: "#101c15",
              border: "1px solid #1f5133",
              borderRadius: 18,
              padding: 18
            }}>
              <img
                src={selectedSkin.image}
                alt={selectedSkin.name}
                style={{ width: 180, objectFit: "contain" }}
              />
              <div>
                <div style={{ color: "#aaa" }}>Выбран скин</div>
                <h2 style={{ margin: "6px 0" }}>{selectedSkin.name}</h2>
              </div>
            </div>
          )}

          {loading && (
            <div style={{
              marginTop: 20,
              padding: 18,
              background: "#181818",
              borderRadius: 14,
              textAlign: "center",
              color: "#aaa"
            }}>
              Загружаю цены...
            </div>
          )}

          <div style={{
            marginTop: 22,
            display: "grid",
            gap: 12
          }}>
            {results.map((item, i) => (
              <div key={i} style={{
                background: "#181818",
                border: "1px solid #2a2a2a",
                borderRadius: 16,
                padding: 16
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10
                }}>
                  <strong>{item.condition}</strong>
                  <span style={{ color: "#4ade80" }}>{item.steamPrice}</span>
                </div>

                <div style={{ color: "#ccc", marginBottom: 10 }}>
                  Steam: {item.steamPrice} ({item.steamRub})
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <a href={item.linkSteam} target="_blank" style={linkStyle}>
                    Steam
                  </a>
                  <a href={item.linkLis} target="_blank" style={linkStyle}>
                    Lis-Skins
                  </a>
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
  flex: 1,
  textAlign: "center" as const,
  padding: "10px",
  background: "#242424",
  color: "white",
  borderRadius: 10,
  textDecoration: "none"
};