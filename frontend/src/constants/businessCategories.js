export const BUSINESS_CATEGORIES = [
    { value: "cloud_kitchen", labelKey: "categoryCloudKitchen" },
    { value: "home_cooking", labelKey: "categoryHomeCooking" },
    { value: "cookies_biscuits", labelKey: "categoryCookiesBiscuits" },
    { value: "bakery_sweets", labelKey: "categoryBakerySweets" },
    { value: "pickles_snacks", labelKey: "categoryPicklesSnacks" },
    { value: "spice_powders", labelKey: "categorySpicePowders" },
    { value: "organic_oils", labelKey: "categoryOrganicOils" },
    { value: "clothing_fashion", labelKey: "categoryClothingFashion" },
    { value: "jewellery", labelKey: "categoryJewellery" },
    { value: "bangles", labelKey: "categoryBangles" },
    { value: "earrings", labelKey: "categoryEarrings" },
    { value: "cosmetics_skincare", labelKey: "categoryCosmeticsSkincare" },
    { value: "shampoos_haircare", labelKey: "categoryShampoosHaircare" },
    { value: "soaps_bath", labelKey: "categorySoapsBath" },
    { value: "herbal_ayurvedic", labelKey: "categoryHerbalAyurvedic" },
    { value: "plants_gardening", labelKey: "categoryPlantsGardening" },
    { value: "arts_crafts", labelKey: "categoryArtsCrafts" },
    { value: "toys_gifts", labelKey: "categoryToysGifts" },
    { value: "stationery", labelKey: "categoryStationery" },
    { value: "home_decor", labelKey: "categoryHomeDecor" },
    { value: "pet_products", labelKey: "categoryPetProducts" },
    { value: "other", labelKey: "categoryOther" }
];

export const getCategoryLabelKey = (value) =>
    BUSINESS_CATEGORIES.find((category) => category.value === value)?.labelKey;
