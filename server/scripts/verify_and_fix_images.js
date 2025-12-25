const fs = require('fs');
const path = require('path');

// Paths
const foodsPath = path.join(__dirname, '../data/foods.json');
const clientPublicImagesPath = path.join(__dirname, '../../client/public');

// Load Data
const foods = require(foodsPath);

// Curated list of high-quality Unsplash images
const imageMap = {
    // THAI - Rice
    'kaprao': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80',
    'minced pork basil': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80',
    'crispy pork basil': 'https://images.unsplash.com/photo-1626804475510-97cce8653bb3?w=800&q=80',
    'fried rice': 'https://images.unsplash.com/photo-1603064755736-ec8787f61c33?w=800&q=80',
    'crab fried rice': 'https://plus.unsplash.com/premium_photo-1664478291780-0c66f5c927e8?w=800&q=80',
    'shrimp fried rice': 'https://images.unsplash.com/photo-1626804475510-97cce8653bb3?w=800&q=80',
    'american fried rice': 'https://images.unsplash.com/photo-1603064755736-ec8787f61c33?w=800&q=80',
    'chicken rice': 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80',
    'hainanese chicken': 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80',
    'sticky rice': 'https://images.unsplash.com/photo-1626020120286-621350615bdd?w=800&q=80',
    'mango sticky rice': 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&q=80',
    'omelet': 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&q=80',
    'roast red pork': 'https://images.unsplash.com/photo-1625938145244-2395d82729a0?w=800&q=80', // Moo dang
    'crispy pork': 'https://images.unsplash.com/photo-1626804475510-97cce8653bb3?w=800&q=80', // Moo krob

    // THAI - Salad/Appetizers
    'pork salad': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80', // Larb
    'glass noodle salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    'papaya salad': 'https://images.unsplash.com/photo-1626804475297-411dbe6ab72a?w=800&q=80',
    'som tum': 'https://images.unsplash.com/photo-1626804475297-411dbe6ab72a?w=800&q=80',
    'larb': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
    'satay': 'https://images.unsplash.com/photo-1625938145244-2395d82729a0?w=800&q=80',
    'moo ping': 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800&q=80',
    'grilled pork': 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800&q=80',
    'shrimp cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
    'fish cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
    'spring roll': 'https://images.unsplash.com/photo-1544025162-d76690b67f61?w=800&q=80',
    'shrimp paste': 'https://images.unsplash.com/photo-1626804475510-97cce8653bb3?w=800&q=80',
    'minced pork': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',

    // THAI - Curry/Soup
    'green curry': 'https://images.unsplash.com/photo-1626804475510-97cce8653bb3?w=800&q=80',
    'massaman': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
    'panang': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
    'tom yum': 'https://images.unsplash.com/photo-1548943487-a2e4e43b485c?w=800&q=80',
    'tom kha': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80',
    'clear soup': 'https://images.unsplash.com/photo-1548811802-763462b4859f?w=800&q=80',
    'sour curry': 'https://images.unsplash.com/photo-1626804475510-97cce8653bb3?w=800&q=80', // Kaeng som
    'fish maw': 'https://images.unsplash.com/photo-1548811802-763462b4859f?w=800&q=80',

    // THAI - Noodles
    'pad thai': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80',
    'pad see ew': 'https://plus.unsplash.com/premium_photo-1664478291780-0c66f5c927e8?w=800&q=80',
    'boat noodle': 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80',
    'khao soi': 'https://images.unsplash.com/photo-1628205240209-15632d431057?w=800&q=80',
    'rad na': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
    'drunken noodle': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80', // Pad kee mao
    'glass noodle': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    'suki': 'https://images.unsplash.com/photo-1548811802-763462b4859f?w=800&q=80',
    'khanom jeen': 'https://images.unsplash.com/photo-1626804475510-97cce8653bb3?w=800&q=80',

    // THAI - Desserts
    'khanom krok': 'https://images.unsplash.com/photo-1528647039535-77987ec9e011?w=800&q=80',
    'tub tim krob': 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&q=80',
    'grass jelly': 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&q=80',
    'roti': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
    'banana': 'https://images.unsplash.com/photo-1603052875302-d376b7c0638a?w=800&q=80',
    'sticky rice': 'https://images.unsplash.com/photo-1626020120286-621350615bdd?w=800&q=80',

    // JAPANESE
    'sushi': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
    'sashimi': 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=800&q=80',
    'ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
    'udon': 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&q=80',
    'tempura': 'https://images.unsplash.com/photo-1615764648719-272cb25055b8?w=800&q=80',
    'takoyaki': 'https://images.unsplash.com/photo-1629854441460-14e475f85022?w=800&q=80',
    'curry rice': 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&q=80',
    'gyudon': 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',
    'yakisoba': 'https://images.unsplash.com/photo-1616782522037-ce94689b14c3?w=800&q=80',
    'miso soup': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
    'karaage': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80',
    'onigiri': 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&q=80',

    // KOREAN
    'bibimbap': 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80',
    'kimchi': 'https://images.unsplash.com/photo-1583224964978-2257b96070d3?w=800&q=80',
    'tteokbokki': 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80',
    'fried chicken': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80',
    'korean fried': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80',
    'gimbap': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80',
    'bbq': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
    'samgyeopsal': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
    'jajangmyeon': 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&q=80',

    // WESTERN/Generic
    'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    'steak': 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800&q=80',
    'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    'pasta': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
    'spaghetti': 'https://images.unsplash.com/photo-1626844131082-256783844137?w=800&q=80',
    'carbonara': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
    'caesar salad': 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&q=80',
    'salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    'fries': 'https://images.unsplash.com/photo-1630384060421-2c08d517cbf4?w=800&q=80',
    'nugget': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80',
    'hot dog': 'https://images.unsplash.com/photo-1612392062631-94dd858cba88?w=800&q=80',
    'lasagna': 'https://images.unsplash.com/photo-1574868302527-3f7152277025?w=800&q=80',
    'fish and chips': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',

    // DESSERT
    'ice cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80',
    'cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
    'brownie': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80',
    'bingsu': 'https://images.unsplash.com/photo-1582236528751-64d50c18c21a?w=800&q=80',
    'pancake': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
    'waffle': 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&q=80',
    'toast': 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&q=80',
    'donut': 'https://images.unsplash.com/photo-1552010099-5dc758d5438d?w=800&q=80',
    'croissant': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
    'egg tart': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&q=80',
    'crepe': 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800&q=80',
    'garlic bread': 'https://images.unsplash.com/photo-1573140247632-f84660f67126?w=800&q=80',

    // DRINKS
    'coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
    'tea': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=80',
    'smoothie': 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=800&q=80',
    'milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80'
};

let fixedCount = 0;

const updatedFoods = foods.map(food => {
    let newImage = food.image;
    let needsCheck = false;

    // Check if local image exists
    if (food.image && food.image.startsWith('/images/')) {
        const localPath = path.join(clientPublicImagesPath, food.image.replace('/images/', 'images/'));
        if (!fs.existsSync(localPath)) {
            console.log(`[Missing Local] ${food.name} -> ${food.image}`);
            needsCheck = true;
        }
    } else {
        // Correct problematic URLs
        // Force update checking for specific items identified as broken/generic
        needsCheck = true;
    }

    if (needsCheck) {
        // Find replacement
        const nameLower = food.name.toLowerCase();
        const nameEnLower = (food.nameEn || '').toLowerCase();
        let bestMatch = null;

        // Try to match nameEn first
        for (const [key, url] of Object.entries(imageMap)) {
            if (nameEnLower.includes(key)) {
                bestMatch = url;
                break;
            }
        }

        // Try name (Thai) if no English match or to force override
        if (!bestMatch) {
            // Manual Thai mapping checks
            if (nameLower.includes('กะเพรา')) bestMatch = imageMap['kaprao'];
            else if (nameLower.includes('ข้าวผัด') && nameLower.includes('ปู')) bestMatch = imageMap['crab fried rice'];
            else if (nameLower.includes('ข้าวผัด')) bestMatch = imageMap['fried rice'];
            else if (nameLower.includes('ต้มยำ')) bestMatch = imageMap['tom yum'];
            else if (nameLower.includes('ส้มตำ')) bestMatch = imageMap['som tum'];
            else if (nameLower.includes('ลาบ')) bestMatch = imageMap['larb'];
            else if (nameLower.includes('น้ำตก')) bestMatch = imageMap['moo yang'];
            else if (nameLower.includes('ยำ')) bestMatch = imageMap['glass noodle'];
            else if (nameLower.includes('ไก่ทอด')) bestMatch = imageMap['fried chicken'];
            else if (nameLower.includes('มันไก่')) bestMatch = imageMap['chicken rice'];
            else if (nameLower.includes('ขาหมู')) bestMatch = imageMap['roast red pork'];
            else if (nameLower.includes('หมูแดง') || nameLower.includes('หมูกรอบ')) bestMatch = imageMap['roast red pork'];
            else if (nameLower.includes('ก๋วยเตี๋ยว')) bestMatch = imageMap['boat noodle'];
            else if (nameLower.includes('ราดหน้า')) bestMatch = imageMap['rad na'];
            else if (nameLower.includes('แกงเขียวหวาน')) bestMatch = imageMap['green curry'];
            else if (nameLower.includes('พะแนง')) bestMatch = imageMap['panang'];
            else if (nameLower.includes('มัสมั่น')) bestMatch = imageMap['massaman'];
            else if (nameLower.includes('แกงส้ม')) bestMatch = imageMap['sour curry'];
            else if (nameLower.includes('ต้มข่า')) bestMatch = imageMap['tom kha'];
            else if (nameLower.includes('ขนมจีน')) bestMatch = imageMap['khanom jeen'];
            else if (nameLower.includes('ซูชิ')) bestMatch = imageMap['sushi'];
            else if (nameLower.includes('ราเมน')) bestMatch = imageMap['ramen'];
            else if (nameLower.includes('บิงซู')) bestMatch = imageMap['bingsu'];
            else if (nameLower.includes('บราวนี่')) bestMatch = imageMap['brownie'];
            else if (nameLower.includes('โทสต์')) bestMatch = imageMap['toast'];
            else if (nameLower.includes('ปังปิ้ง')) bestMatch = imageMap['toast'];
            else if (nameLower.includes('เค้ก')) bestMatch = imageMap['cake'];
            else if (nameLower.includes('เครป')) bestMatch = imageMap['crepe'];
            else if (nameLower.includes('ทาร์ต')) bestMatch = imageMap['egg tart'];
        }

        if (bestMatch && bestMatch !== food.image) {
            newImage = bestMatch;
            fixedCount++;
        }
    }

    return {
        ...food,
        image: newImage
    };
});

fs.writeFileSync(foodsPath, JSON.stringify(updatedFoods, null, 4));
console.log(`\nDone! Updated ${fixedCount} items.`);
