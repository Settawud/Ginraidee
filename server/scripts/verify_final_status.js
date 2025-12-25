const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../data/foods.json');
const publicDir = path.join(__dirname, '../../client/public');
const foods = require(foodsPath);

let aiCount = 0;
let stockCount = 0;
let remoteCount = 0;
let missingFileCount = 0;
const issues = [];
const aiItems = [];

console.log(`Scanning ${foods.length} items...`);

foods.forEach(food => {
    if (!food.image) {
        issues.push(`[${food.id}] ${food.name}: No image field`);
        return;
    }

    if (food.image.startsWith('http')) {
        remoteCount++;
        issues.push(`[${food.id}] ${food.name}: Remote URL (Not verified local) - ${food.image}`);
    } else if (food.image.startsWith('/images/')) {
        // Check local file
        const localPath = path.join(publicDir, food.image);
        if (!fs.existsSync(localPath)) {
            missingFileCount++;
            issues.push(`[${food.id}] ${food.name}: File missing on disk - ${localPath}`);
        } else {
            if (food.image.includes('_ai_')) {
                aiCount++;
                aiItems.push(food.nameEn);
            } else {
                stockCount++;
                // Heuristic check for potential mismatches (Generic names)
                const nameLen = food.nameEn.split(' ').length;
                const riskyKeywords = ['Banana', 'Egg', 'Pork', 'Chicken', 'Rice', 'Soup', 'Salad', 'Tea', 'Coffee', 'Milk', 'Toast', 'Bread', 'Cake', 'Jelly', 'Roti', 'Pancake', 'Waffle', 'Donut', 'Croissant', 'Steamed Egg', 'Corn Soup'];
                if ((nameLen === 1 && riskyKeywords.includes(food.nameEn)) || riskyKeywords.includes(food.nameEn)) {
                    issues.push(`[${food.id}] ${food.name} (${food.nameEn}): Potential Mismatch (Name too generic for stock search?)`);
                }
                // Specific Thai items that often get wrong stock photos
                if (['Fried Banana', 'Thai Tea', 'Green Tea', 'Lemon Tea', 'Milk Tea', 'Iced Coffee', 'Black Coffee', 'Hot Coffee', 'Roti', 'Pancake', 'Waffle', 'Toast'].includes(food.nameEn)) {
                    issues.push(`[${food.id}] ${food.name} (${food.nameEn}): Verify Image (Check if specific enough)`);
                }
            }
        }
    } else {
        issues.push(`[${food.id}] ${food.name}: Invalid path format - ${food.image}`);
    }
});

console.log('\n--- Summary ---');
console.log(`Total Items: ${foods.length}`);
console.log(`AI Generated: ${aiCount}`);
console.log(`Stock/Downloaded: ${stockCount}`);
console.log(`Remote/Broken Link: ${remoteCount}`);
console.log(`Missing Files: ${missingFileCount}`);

if (aiItems.length > 0) {
    console.log('\nAI Generated Items:', aiItems.join(', '));
}

if (issues.length > 0) {
    console.log('\n--- Issues Found ---');
    issues.forEach(i => console.log(i));
} else {
    console.log('\nNo missing or broken links found. All items have local files.');
}
