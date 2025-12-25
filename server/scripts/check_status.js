const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../data/foods.json');
const foods = require(foodsPath);

let localCount = 0;
let remoteCount = 0;
const missing = [];

foods.forEach(food => {
    if (food.image && food.image.startsWith('/images/')) {
        localCount++;
    } else {
        remoteCount++;
        missing.push(`${food.id}: ${food.name} (${food.nameEn})`);
    }
});

console.log(`Total Items: ${foods.length}`);
console.log(`Local Images (Complete): ${localCount}`);
console.log(`Remote Images (Incomplete): ${remoteCount}`);

if (missing.length > 0) {
    console.log('\nItems needing attention:');
    missing.forEach(m => console.log(m));
}
