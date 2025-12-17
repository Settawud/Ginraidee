const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../data/foods.json');
const foods = require(foodsPath);

// Curated list of high-quality Unsplash images
const imageMap = {
    // THAI - Rice & Stir Fry
    'kaprao': '/images/kaprao_rice_1765343503610.png', // Keep existing local
    'rice': 'https://images.unsplash.com/photo-1596792614917-74f762635951?w=800&q=80', // Fried rice generic
    'fried rice': 'https://images.unsplash.com/photo-1626804475297-411dbe6ab72a?w=800&q=80', // Better fried rice
    'crab fried rice': 'https://images.unsplash.com/photo-1603064755736-ec8787f61c33?w=800&q=80',
    'curry': 'https://images.unsplash.com/photo-1626804475510-97cce8653bb3?w=800&q=80',
    'green curry': 'https://images.unsplash.com/photo-1623594639908-1cc67523ba78?w=800&q=80',
    'massaman': 'https://images.unsplash.com/photo-1626804475297-411dbe6ab72a?w=800&q=80', // Curry placeholder if specific not found
    'tom yum': 'https://images.unsplash.com/photo-1548811802-763462b4859f?w=800&q=80', // Real Tom Yum
    'som tum': 'https://images.unsplash.com/photo-1601618213600-47b749d2906b?w=800&q=80', // Papaya Salad
    'pad thai': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
    'pad see ew': 'https://plus.unsplash.com/premium_photo-1664478291780-0c66f5c927e8?w=800&q=80', // Noodle
    'boat noodle': 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80',
    'khao soi': 'https://images.unsplash.com/photo-1628205240209-15632d431057?w=800&q=80',
    'satay': 'https://images.unsplash.com/photo-1625938145244-2395d82729a0?w=800&q=80',
    'moo yang': 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800&q=80', // Grilled pork
    'larb': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
    'sticky rice': 'https://images.unsplash.com/photo-1626020120286-621350615bdd?w=800&q=80', // Dessert or side
    'mango sticky rice': 'https://images.unsplash.com/photo-1626020120286-621350615bdd?w=800&q=80', // Mango sticky rice
    'chicken rice': '/images/khao_man_kai_1765343520453.png',

    // JAPANESE
    'sushi': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
    'sashimi': 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=800&q=80',
    'ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
    'udon': 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&q=80',
    'tempura': 'https://images.unsplash.com/photo-1615764648719-272cb25055b8?w=800&q=80',
    'takoyaki': 'https://images.unsplash.com/photo-1629854441460-14e475f85022?w=800&q=80',
    'curry rice': 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&q=80',
    'gyudon': 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',
    'matcha': 'https://images.unsplash.com/photo-1582716401301-b2407dc7563d?w=800&q=80',
    'yakisoba': 'https://images.unsplash.com/photo-1616782522037-ce94689b14c3?w=800&q=80',

    // KOREAN
    'bibimbap': 'https://images.unsplash.com/photo-1512485800893-b08ec1ea59b1?w=800&q=80',
    'kimchi': 'https://images.unsplash.com/photo-1583224964978-2257b96070d3?w=800&q=80',
    'tteokbokki': 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80',
    'fried chicken': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80',
    'gimbap': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
    'bbq': 'https://images.unsplash.com/photo-1584966656829-19fc22a5506a?w=800&q=80', // Grilled meat

    // WESTERN / FAST FOOD
    'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    'steak': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
    'pizza': 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=80',
    'pasta': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
    'spaghetti': 'https://images.unsplash.com/photo-1626844131082-256783844137?w=800&q=80',
    'salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    'fries': 'https://images.unsplash.com/photo-1630384060421-2c08d517cbf4?w=800&q=80',
    'nugget': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80',
    'hot dog': 'https://images.unsplash.com/photo-1612392062631-94dd858cba88?w=800&q=80',

    // DESSERT
    'ice cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80',
    'cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
    'bingsu': 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&q=80',
    'pancake': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
    'waffle': 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&q=80',
    'donut': 'https://images.unsplash.com/photo-1552010099-5dc758d5438d?w=800&q=80',
    'croissant': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',

    // DRINKS
    'coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
    'tea': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=80',
    'smoothie': 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=800&q=80',

    // GENERIC INGREDIENTS/TYPES (Lower priority)
    'pork': 'https://images.unsplash.com/photo-1625938145244-2395d82729a0?w=800&q=80', // Mooping/Satay style
    'chicken': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80', // Fried chicken style
    'shrimp': 'https://images.unsplash.com/photo-1626509539828-091a91e56b46?w=800&q=80', // Tom yum style
    'prawn': 'https://images.unsplash.com/photo-1626509539828-091a91e56b46?w=800&q=80',
    'seafood': 'https://images.unsplash.com/photo-1615764648719-272cb25055b8?w=800&q=80',
    'fish': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
    'squid': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80', // Grilled squid style
    'crab': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80',
    'noodle': 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80', // Boat noodle
    'ball': 'https://images.unsplash.com/photo-1596792614917-74f762635951?w=800&q=80', // Use rice/neutral for balls if no better option
    'soup': 'https://images.unsplash.com/photo-1548811802-763462b4859f?w=800&q=80',
    'basil': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80', // Kaprao fallback
    'omelet': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80' // Omelet with rice
};

const updatedFoods = foods.map(food => {
    // If it's one of the first 16 that have local images (mostly), keep them if valid
    if (food.id <= 16 && food.image.startsWith('/images/')) {
        return food;
    }

    const nameLower = food.name.toLowerCase();
    const nameEnLower = food.nameEn.toLowerCase();
    const descLower = food.description.toLowerCase();

    // Find best matching image key
    let bestMatch = null;

    // Check specific English names first
    for (const [key, url] of Object.entries(imageMap)) {
        if (nameEnLower.includes(key)) {
            bestMatch = url;
            break;
        }
    }

    // Check specific Thai names
    if (!bestMatch) {
        // Add manual thai mappings if needed, but english nameUsually covers it
        if (nameLower.includes('กะเพรา')) bestMatch = imageMap['kaprao'];
        else if (nameLower.includes('ข้าวผัด')) bestMatch = imageMap['fried rice'];
        else if (nameLower.includes('ต้มยำ')) bestMatch = imageMap['tom yum'];
        else if (nameLower.includes('ส้มตำ')) bestMatch = imageMap['som tum'];
        else if (nameLower.includes('แกง')) bestMatch = imageMap['curry'];
        else if (nameLower.includes('ก๋วยเตี๋ยว')) bestMatch = imageMap['boat noodle'];
    }

    // Category fallbacks
    if (!bestMatch) {
        if (food.category === 'thai') bestMatch = 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80';
        else if (food.category === 'japanese') bestMatch = 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&q=80';
        else if (food.category === 'korean') bestMatch = 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&q=80';
        else if (food.category === 'western') bestMatch = 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80';
        else if (food.category === 'fastfood') bestMatch = 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80';
        else if (food.category === 'dessert') bestMatch = 'https://images.unsplash.com/photo-1563729768-ffae2b6ca035?w=800&q=80';
    }

    return {
        ...food,
        image: bestMatch || food.image
    };
});

fs.writeFileSync(foodsPath, JSON.stringify(updatedFoods, null, 4));
console.log(`Updated ${updatedFoods.length} items with curated images.`);
