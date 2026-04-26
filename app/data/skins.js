export async function GET() {
  const extraNames = [
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

  try {
    const res = await fetch(
      "https://bymykel.github.io/CSGO-API/api/en/skins.json",
      { cache: "no-store" }
    );

    const data = await res.json();

    const apiSkins = data
      .map((item) => ({
        name: item.name,
        image: item.image || ""
      }))
      .filter((item) => item.name);

    const names = new Set(apiSkins.map((s) => s.name.toLowerCase()));

    const extraSkins = extraNames
      .filter((name) => !names.has(name.toLowerCase()))
      .map((name) => ({
        name,
        image: ""
      }));

    return Response.json({
      skins: [...extraSkins, ...apiSkins]
    });
  } catch {
    return Response.json({
      skins: extraNames.map((name) => ({
        name,
        image: ""
      }))
    });
  }
}