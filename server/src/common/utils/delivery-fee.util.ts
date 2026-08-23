import { haversineDistanceKm } from './haversine.util';

export type DeliveryFeeType = 'FREE' | 'FLAT' | 'PER_KM';
export type DeliveryHandledBy = 'SELF_DELIVERY' | 'THIRD_PARTY';

export interface DeliveryQuoteInput {
  restaurantLat: number;
  restaurantLng: number;
  customerLat: number;
  customerLng: number;
  selfDeliveryRadiusKm: number;
  maxDeliveryRadiusKm: number;
  selfDeliveryFeeType: DeliveryFeeType;
  selfDeliveryFlatFee: number;
  selfDeliveryPerKmFee: number;
  thirdPartyFeeType: DeliveryFeeType;
  thirdPartyBaseFee: number;
  thirdPartyPerKmFee: number;
}

export interface DeliveryQuoteResult {
  deliverable: boolean;
  reason?: string;
  distanceKm: number;
  handledBy?: DeliveryHandledBy;
  deliveryFee: number;
}

/**
 * calculateDeliveryQuote()
 * --------------------------
 * यो नै Restaurant को "कति km सम्म आफैं, कति km सम्म third-party, कहाँदेखि
 * delivery नै छैन" भन्ने पूरा business logic केन्द्रित ठाउँ हो। Checkout
 * (Order module) र Frontend को "Delivery Available?" preview (Discovery
 * module) — दुबैले यही एउटै function प्रयोग गर्छन्, ताकि logic कतै
 * duplicate नहोस् र दुबैतिर सधैं एउटै उत्तर आओस्।
 */
export function calculateDeliveryQuote(input: DeliveryQuoteInput): DeliveryQuoteResult {
  const distanceKm = Number(
    haversineDistanceKm(input.restaurantLat, input.restaurantLng, input.customerLat, input.customerLng).toFixed(2),
  );

  if (distanceKm > input.maxDeliveryRadiusKm) {
    return {
      deliverable: false,
      reason: `Sorry, we do not deliver beyond ${input.maxDeliveryRadiusKm}km. You are ${distanceKm}km away.`,
      distanceKm,
      deliveryFee: 0,
    };
  }

  const withinSelfRange = input.selfDeliveryRadiusKm > 0 && distanceKm <= input.selfDeliveryRadiusKm;

  if (withinSelfRange) {
    const fee =
      input.selfDeliveryFeeType === 'FREE'
        ? 0
        : input.selfDeliveryFeeType === 'FLAT'
          ? input.selfDeliveryFlatFee
          : Number((distanceKm * input.selfDeliveryPerKmFee).toFixed(2));

    return { deliverable: true, distanceKm, handledBy: 'SELF_DELIVERY', deliveryFee: fee };
  }

  // Self range भन्दा बाहिर तर max भित्र — Third-party delivery
  const fee =
    input.thirdPartyFeeType === 'FREE'
      ? 0
      : input.thirdPartyFeeType === 'FLAT'
        ? input.thirdPartyBaseFee
        : Number((input.thirdPartyBaseFee + distanceKm * input.thirdPartyPerKmFee).toFixed(2));

  return { deliverable: true, distanceKm, handledBy: 'THIRD_PARTY', deliveryFee: fee };
}
