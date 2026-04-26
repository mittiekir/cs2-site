export async function GET() {
  try {
    const res = await fetch(
      "https://bymykel.github.io/CSGO-API/api/en/skins.json",
      { cache: "no-store" }
    );

    const data = await res.json();

    const skins = data
      .map((item) => {
        const rawImage = item.image || item.icon_url || "";

        let image = rawImage;

        if (rawImage && !rawImage.startsWith("http")) {
          image = `https://community.cloudflare.steamstatic.com/economy/image/${rawImage}`;
        }

        return {
          name: item.market_hash_name || item.name,
          image
        };
      })
      .filter((item) => item.name && item.image);

    return Response.json({ skins });
  } catch {
    return Response.json({ skins: [] });
  }
}