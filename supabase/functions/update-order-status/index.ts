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

    const { order_id, status, tracking_number, carrier, estimated_delivery } = await req.json();
    if (!order_id || !status) {
      return new Response(JSON.stringify({ error: 'order_id and status required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: order, error: fetchError } = await admin.from('orders').select('id, user_id').eq('id', order_id).single();
    if (fetchError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const updates: any = { status };
    if (tracking_number) updates.tracking_number = tracking_number;
    if (carrier) updates.carrier = carrier;
    if (estimated_delivery) updates.estimated_delivery = estimated_delivery;
    if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();
    if (status === 'returned') updates.returned_at = new Date().toISOString();

    const { error: updateError } = await admin.from('orders').update(updates).eq('id', order_id);
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Notify user
    const titleMap: Record<string, string> = {
      shipped: 'Order shipped',
      out_for_delivery: 'Out for delivery',
      delivered: 'Order delivered',
      cancelled: 'Order cancelled',
      returned: 'Return update',
    };
    const title = titleMap[status] ?? 'Order update';
    await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceRoleKey}` },
      body: JSON.stringify({
        user_id: order.user_id,
        title,
        body: `Your order ${order_id.slice(0,8)} is now ${status.replace(/_/g, ' ')}.`,
        type: status === 'shipped' ? 'shipping' : status === 'delivered' ? 'delivery' : 'order',
        data: { orderId: order_id },
      }),
    });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
