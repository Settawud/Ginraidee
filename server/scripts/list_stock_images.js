const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../data/foods.json');
const foods = require(foodsPath);

const stockItems = foods.filter(f => !f.image.includes('_ai_'));

console.log(`Found ${stockItems.length} stock/downloaded images that might need replacement.\n`);
console.log('| ID | Menu Name (TH) | Menu Name (EN) | Current Scan Image |');
console.log('|---|---|---|---|');

stockItems.forEach(food => {
    // Simplify image path for display
    const img = food.image.replace('/images/', '').replace('/menus/', '');
    console.log(`| ${food.id} | ${food.name} | ${food.nameEn} | ${img} |`);
});
