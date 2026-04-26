export async function GET() {
  const extraSkins = [
    "AK-47 | Wild Lotus",
    "AK-47 | Vulcan",
    "AK-47 | Fire Serpent",
    "M4A4 | Howl",
    "M4A1-S | Welcome to the Jungle",
    "AWP | Dragon Lore",
    "AWP | Gungnir",
    "AWP | Medusa",
    "Desert Eagle | Blaze"
  ];

  try {
    const res = await fetch(
      "https://bymykel.github.io/CSGO-API/api/en/skins.json",
      { cache: "no-store" }
    );

    const data = await res.json();

    const apiSkins = data
      .map((item) => item.market_hash_name || item.name)
      .filter(Boolean);

    const allSkins = Array.from(new Set([...apiSkins, ...extraSkins]));

    return Response.json({ skins: allSkins });
  } catch (err) {
    return Response.json({ skins: extraSkins });
  }
}