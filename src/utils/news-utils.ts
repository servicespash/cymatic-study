export const injectAds = (items: any[], ads: any[]) => {
  if (ads.length === 0) return items;

  const result = [...items];
  let adIndex = 0;

  // Inject an ad every 4 items
  for (let i = 4; i <= result.length; i += 5) {
    if (adIndex < ads.length) {
      result.splice(i, 0, { ...ads[adIndex], is_ad: true });
      adIndex++;
    }
  }

  return result;
};
