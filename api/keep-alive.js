export default async function handler(req, res) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return res.status(500).json({ error: 'Missing Supabase credentials in environment' });
  }

  try {
    // Supabase DB가 정지되지 않도록 가벼운 REST API 호출을 발생시킵니다.
    const response = await fetch(`${url}/rest/v1/care_logs?select=id&limit=1`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase request failed with status: ${response.status}`);
    }

    return res.status(200).json({ message: 'Supabase successfully pinged to prevent pausing.' });
  } catch (error) {
    console.error('Keep-alive error:', error);
    return res.status(500).json({ error: 'Failed to ping Supabase' });
  }
}
