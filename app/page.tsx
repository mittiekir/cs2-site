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
    setSelectedSkin("");
  };

  const fetchPrices = async (skinName: string) => {
    setLoading(true);
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
            steamRaw.replace("$", "").replace(",", "").trim()
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
    setLoading(false);
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top, #1b2b22 0%, #080808 45%, #000 100%)",
      color: "white",
      fontFamily: "Arial, sans-serif",
      padding: "40px 16px"
    }}>
      <div style={{
        maxWidth: "900px",
        margin: "0 auto"
      }}>
        <header style={{
          marginBottom: "28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px"
        }}>
          <div>
            <h1 style={{
              fontSize: "36px",
              margin: 0,
              letterSpacing: "-1px"
            }}>
              CS2 Price Monitor
            </h1>
            <p style={{
              color: "#aaa",
              marginTop: "8px"
            }}>
              Поиск цен на скины CS2 в Steam, Lis-Skins и других маркетах
            </p>
          </div>

          <div style={{
            padding: "10px 14px",
            background: "#13251b",
            color: "#4ade80",
            borderRadius: "999px",
            fontSize: "14px",
            border: "1px solid #1f5133"
          }}>
            BETA
          </div>
        </header>

        <section style={{
          background: "rgba(17,17,17,0.9)",
          border: "1px solid #242424",
          borderRadius: "20px",
          padding: "22px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)"
        }}>
          <div style={{
            display: "flex",
            gap: "12px",
            marginBottom: "16px"
          }}>
            <input
              placeholder="Например: vulcan, lotus, redline"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchSkins();
              }}
              style={{
                flex: 1,
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #333",
                background: "#0b0b0b",
                color: "white",
                outline: "none",
                fontSize: "15px"
              }}
            />

            <button
              onClick={searchSkins}
              style={{
                padding: "14px 20px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #4ade80, #22c55e)",
                color: "#06130b",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Поиск
            </button>
          </div>

          {selectedSkin && (
            <div style={{
              marginBottom: "18px",
              padding: "12px 14px",
              background: "#101c15",
              border: "1px solid #1f5133",
              borderRadius: "12px",
              color: "#b7f7cc"
            }}>
              Выбран скин: <b>{selectedSkin}</b>
            </div>
          )}

          {filtered.length > 0 && (
            <div style={{
              display: "grid",
              gap: "8px",
              marginBottom: "20px"
            }}>
              {filtered.map((skin, i) => (
                <button
                  key={i}
                  onClick={() => fetchPrices(skin)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    background: "#181818",
                    color: "white",
                    border: "1px solid #292929",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "15px"
                  }}
                >
                  {skin}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div style={{
              padding: "18px",
              background: "#181818",
              borderRadius: "14px",
              color: "#aaa",
              textAlign: "center"
            }}>
              Загружаю цены...
            </div>
          )}

          <div style={{
            display: "grid",
            gap: "12px"
          }}>
            {results.map((item, i) => (
              <div key={i} style={{
                padding: "16px",
                background: "#181818",
                border: "1px solid #2a2a2a",
                borderRadius: "16px"
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px"
                }}>
                  <strong style={{ fontSize: "16px" }}>
                    {item.condition}
                  </strong>

                  <span style={{
                    fontSize: "13px",
                    color: "#aaa"
                  }}>
                    CS2
                  </span>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px"
                }}>
                  <div style={{
                    padding: "12px",
                    background: "#0d0d0d",
                    borderRadius: "12px"
                  }}>
                    <div style={{ color: "#aaa", fontSize: "13px" }}>
                      Steam
                    </div>
                    <div style={{ color: "#4ade80", fontWeight: "bold", marginTop: "4px" }}>
                      {item.steamPrice}
                    </div>
                    <div style={{ color: "#ddd", fontSize: "14px" }}>
                      {item.steamRub}
                    </div>
                  </div>

                  <div style={{
                    padding: "12px",
                    background: "#0d0d0d",
                    borderRadius: "12px"
                  }}>
                    <div style={{ color: "#aaa", fontSize: "13px" }}>
                      Skinport
                    </div>
                    <div style={{ color: "#60a5fa", fontWeight: "bold", marginTop: "4px" }}>
                      {item.skinportPrice}
                    </div>
                    <div style={{ color: "#777", fontSize: "14px" }}>
                      маркет
                    </div>
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "12px"
                }}>
                  <a
                    href={item.linkSteam}
                    target="_blank"
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "10px",
                      background: "#222",
                      color: "white",
                      borderRadius: "10px",
                      textDecoration: "none"
                    }}
                  >
                    Steam
                  </a>

                  <a
                    href={item.linkLis}
                    target="_blank"
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "10px",
                      background: "#222",
                      color: "white",
                      borderRadius: "10px",
                      textDecoration: "none"
                    }}
                  >
                    Lis-Skins
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}