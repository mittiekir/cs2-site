export async function GET() {
  try {
    const res = await fetch(
      "https://bymykel.github.io/CSGO-API/api/en/skins.json",
      { cache: "no-store" }
    );

    const data = await res.json();

    const skins = data.map(item => ({
      name: item.market_hash_name || item.name,
      image: item.image
    })).filter(item => item.name && item.image);

    return Response.json({ skins });
  } catch {
    return Response.json({ skins: [] });
  }
}