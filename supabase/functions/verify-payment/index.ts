import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return new Response(JSON.stringify({ error: 'Missing payment fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const expected = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (expected !== razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Invalid signature', verified: false }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Verify order belongs to user and razorpay_order_id matches
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, user_id, razorpay_order_id, payment_status')
      .eq('id', order_id)
      .single();
    if (orderError || !order || order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (order.razorpay_order_id && order.razorpay_order_id !== razorpay_order_id) {
      return new Response(JSON.stringify({ error: 'Order mismatch' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (order.payment_status === 'paid') {
      return new Response(JSON.stringify({ verified: true, alreadyPaid: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error: updateError } = await admin
      .from('orders')
      .update({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payment_status: 'paid',
        status: 'processing',
      })
      .eq('id', order_id);
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Trigger push notification\n    try {\n      await fetch(${supabaseUrl}/functions/v1/send-push-notification, {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json',\n          'Authorization': Bearer ,\n        },\n        body: JSON.stringify({\n          user_id: user.id,\n          title: 'Payment successful',\n          body: Your payment for order  was successful.,\n          type: 'payment',\n          data: { orderId: order_id },\n        }),\n      });\n    } catch (e) { console.error(e); }\n\n    return new Response(JSON.stringify({ verified: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
