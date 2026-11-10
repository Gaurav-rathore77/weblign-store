import { supabase } from './supabase';

export type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id?: string;
  prefill?: { email?: string; contact?: string; name?: string };
  theme?: { color?: string };
};

export function openRazorpayCheckout(options: RazorpayOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    // react-native-razorpay is loaded lazily to avoid web bundling issues
    const RazorpayCheckout = require('react-native-razorpay').default;
    RazorpayCheckout.open(options as any)
      .then((data: any) => resolve(data))
      .catch((error: any) => reject(error));
  });
}

export async function createRazorpayOrder(amount: number, currency = 'INR', receipt: string) {
  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: { amount, currency, receipt },
  });
  if (error) throw error;
  return data as { id: string; amount: number; currency: string };
}

export async function verifyRazorpayPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id: string;
}) {
  const { data, error } = await supabase.functions.invoke('verify-payment', {
    body: payload,
  });
  if (error) throw error;
  return data as { verified: boolean; alreadyPaid?: boolean };
}
