export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  try {
    const res = await fetch(
      `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(name)}`
    );

    const data = await res.json();

    return Response.json(data);
  } catch (err) {
    return Response.json({ success: false });
  }
}