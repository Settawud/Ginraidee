const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../data/foods.json');
const imagesDir = path.join(__dirname, '../../client/public/images/menus');

const foods = require(foodsPath);
const files = fs.readdirSync(imagesDir);

console.log(`Scanning directory: ${imagesDir}`);
console.log(`Found ${files.length} files.`);

let updateCount = 0;

foods.forEach(food => {
    // Expected filename patterns based on our previous generation script
    // 1. Exact match with _ai
    // 2. Exact match with generated name (cleanName + _ai)

    const cleanName = food.nameEn.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const expectedNameStart = `${cleanName}_ai`;

    // Specific manual request filenames (e.g. samgyeopsal_ai.png)
    // And standard generated filenames (e.g. strawberry_bingsu_ai.png)

    // Check if we have a file that matches the expected AI name
    // We look for files starting with the name and having _ai
    const match = files.find(f =>
        (f.startsWith(expectedNameStart) && f.includes('_ai')) ||
        (f === `${cleanName}_ai.png`)
    );

    if (match) {
        // Only update if it's not already set to this specific file
        const newPath = `/images/menus/${match}`;
        if (food.image !== newPath) {
            console.log(`[Update] ${food.nameEn}: ${food.image} -> ${newPath}`);
            food.image = newPath;
            updateCount++;
        }
    }
});

if (updateCount > 0) {
    fs.writeFileSync(foodsPath, JSON.stringify(foods, null, 4));
    console.log(`\nSuccessfully updated ${updateCount} items in foods.json.`);
} else {
    console.log('\nNo new matching images found to update.');
}
