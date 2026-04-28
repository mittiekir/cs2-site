export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return Response.json({ success: false, price: null });
  }

  try {
    const res = await fetch(
      `https://api.skinport.com/v1/items?app_id=730&currency=USD&tradable=0`,
      { cache: "no-store" }
    );

    const data = await res.json();

    const item = data.find((x) => x.market_hash_name === name);

    if (!item || !item.min_price) {
      return Response.json({ success: false, price: null });
    }

    return Response.json({
      success: true,
      price: `$${item.min_price.toFixed(2)}`
    });
  } catch {
    return Response.json({ success: false, price: null });
  }
}