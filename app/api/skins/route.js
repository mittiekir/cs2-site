export async function GET() {
  const fallbackSkins = [
    { name: "AK-47 | Vulcan" },
    { name: "AK-47 | Wild Lotus" },
    { name: "AK-47 | Redline" },
    { name: "AK-47 | Asiimov" },
    { name: "AK-47 | Fire Serpent" },
    { name: "AK-47 | Gold Arabesque" },
    { name: "M4A4 | Howl" },
    { name: "M4A1-S | Printstream" },
    { name: "M4A1-S | Welcome to the Jungle" },
    { name: "AWP | Dragon Lore" },
    { name: "AWP | Asiimov" },
    { name: "AWP | Gungnir" },
    { name: "AWP | Medusa" },
    { name: "Desert Eagle | Blaze" },
    { name: "Desert Eagle | Printstream" }
  ];

  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json",
      { cache: "no-store" }
    );

    const data = await res.json();

    const apiSkins = data
      .map((item) => ({
        name: item.name,
        image: item.image || ""
      }))
      .filter((item) => item.name);

    const allSkins = [...fallbackSkins, ...apiSkins];

    return Response.json({ skins: allSkins });
  } catch (error) {
    return Response.json({ skins: fallbackSkins });
  }
}