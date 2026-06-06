export default async function handler(req, res) {
  await fetch(
    process.env.SUPABASE_URL + "/rest/v1/blog_posts?select=id&limit=1",
    { headers: {
        apikey: process.env.SUPABASE_SERVICE_KEY,
        Authorization: "Bearer " + process.env.SUPABASE_SERVICE_KEY
    }}
  );
  return res.status(200).json({ ok: true, time: new Date().toISOString() });
}
