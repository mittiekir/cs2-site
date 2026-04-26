export async function GET() {
  try {
    const res = await fetch(
      "https://bymykel.github.io/CSGO-API/api/en/skins.json",
      { cache: "no-store" }
    );

    const data = await res.json();

    const skins = data
      .map(item => item.market_hash_name)
      .filter(Boolean);

    return Response.json({ skins });
  } catch (err) {
    // 🔥 fallback если API умер
    return Response.json({
      skins: [
        "AK-47 | Vulcan",
        "AK-47 | Redline",
        "AK-47 | Asiimov",
        "AWP | Asiimov",
        "M4A4 | Howl",
        "M4A1-S | Printstream"
      ]
    });
  }
}