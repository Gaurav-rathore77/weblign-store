import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!authHeader.includes(serviceRoleKey)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { user_id, user_ids, title, body, type = 'general', data = {} } = await req.json();
    const targets: string[] = user_ids ?? (user_id ? [user_id] : []);
    if (!targets.length || !title) {
      return new Response(JSON.stringify({ error: 'user_id(s) and title required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch tokens and preferences
    const { data: tokens } = await admin.from('push_tokens').select('user_id, token').in('user_id', targets);
    const { data: profiles } = await admin.from('profiles').select('id, notification_orders, notification_offers, notification_push').in('id', targets);
    const prefMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    const isOrderType = ['order', 'payment', 'shipping', 'delivery'].includes(type);
    const isOfferType = ['promotion', 'offer', 'new_product', 'discount'].includes(type);

    const eligibleTokens: string[] = [];
    for (const t of tokens ?? []) {
      const pref = prefMap.get(t.user_id);
      if (pref?.notification_push === false) continue;
      if (isOrderType && pref?.notification_orders === false) continue;
      if (isOfferType && pref?.notification_offers === false) continue;
      eligibleTokens.push(t.token);
    }

    // Insert notification rows
    const rows = targets.map((uid) => ({
      user_id: uid,
      title,
      body: body ?? null,
      type,
      data,
      is_read: false,
    }));
    await admin.from('notifications').insert(rows);

    // Send Expo push
    if (eligibleTokens.length) {
      const messages = eligibleTokens.map((token) => ({
        to: token,
        title,
        body,
        data,
        sound: 'default',
      }));
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });
    }

    return new Response(JSON.stringify({ sent: eligibleTokens.length, notified: targets.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
