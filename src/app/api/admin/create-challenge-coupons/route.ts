import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyIdToken } from '@/lib/firebase/admin';
import Stripe from 'stripe';

const SESSION_COOKIE = 'ops-learn-session';

const ADMIN_UIDS = (process.env.ADMIN_FIREBASE_UIDS || '').split(',').map((s) => s.trim());

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

interface TierInput {
  min_score: number;
  max_score: number;
  discount_percent: number;
  message: string;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const decoded = await verifyIdToken(token);
  if (!decoded || !ADMIN_UIDS.includes(decoded.uid)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { courseSlug, tiers } = await request.json() as {
    courseSlug: string;
    tiers: TierInput[];
  };

  if (!courseSlug || !tiers?.length) {
    return NextResponse.json({ error: 'courseSlug and tiers are required' }, { status: 400 });
  }

  const stripe = getStripe();
  const results = [];

  for (const tier of tiers) {
    const coupon = await stripe.coupons.create({
      percent_off: tier.discount_percent,
      duration: 'once',
      name: `Challenge ${courseSlug} ${tier.discount_percent}% off (score ${tier.min_score}-${tier.max_score})`,
    });

    const promoCode = await stripe.promotionCodes.create({
      promotion: { type: 'coupon', coupon: coupon.id },
      code: `CHAL-${courseSlug.toUpperCase().slice(0, 10)}-${tier.discount_percent}OFF`.replace(/[^A-Z0-9-]/g, ''),
    });

    results.push({
      min_score: tier.min_score,
      max_score: tier.max_score,
      discount_percent: tier.discount_percent,
      stripe_coupon_id: coupon.id,
      stripe_promo_code_id: promoCode.id,
      stripe_promo_code: promoCode.code,
      message: tier.message,
    });
  }

  return NextResponse.json({ tiers: results });
}
