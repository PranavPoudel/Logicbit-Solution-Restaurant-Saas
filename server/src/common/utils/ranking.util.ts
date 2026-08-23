interface RankingInput {
  distanceKm: number;
  searchRadiusKm: number;
  avgRating: number;
  totalOrders: number;
  maxOrdersInArea: number;
}

const WEIGHTS = {
  distance: 0.4,
  rating: 0.3,
  popularity: 0.2,
  personalization: 0.1, // भविष्यमा customer preference मिसाउँदा प्रयोग हुने, अहिले 0
};

/**
 * calculateRankingScore()
 * -------------------------
 * "Near Me" list लाई केवल distance ले मात्र sort नगरी, distance + rating +
 * popularity मिलाएर एउटा composite score दिन्छ। यसले नजिकैको तर कमजोर
 * restaurant भन्दा अलिक टाढा भए पनि उत्कृष्ट restaurant माथि देखाउन मद्दत गर्छ।
 *
 * Weights सुरुमा static राखिएको छ; भविष्यमा A/B testing बाट tune गर्न सकिन्छ।
 */
export function calculateRankingScore(input: RankingInput): number {
  const distanceScore = Math.max(0, 1 - input.distanceKm / input.searchRadiusKm);
  const ratingScore = input.avgRating / 5;
  const popularityScore =
    input.maxOrdersInArea > 0
      ? Math.log(input.totalOrders + 1) / Math.log(input.maxOrdersInArea + 1)
      : 0;

  return (
    WEIGHTS.distance * distanceScore +
    WEIGHTS.rating * ratingScore +
    WEIGHTS.popularity * popularityScore
  );
}
