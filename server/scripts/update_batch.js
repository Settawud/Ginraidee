const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../data/foods.json');
const foods = require(foodsPath);

const updates = [
    { id: 33, image: 'curry_rice' }
];

const imagesDir = path.join(__dirname, '../../client/public/images');
const files = fs.readdirSync(imagesDir);

let updateCount = 0;

updates.forEach(update => {
    const food = foods.find(f => f.id === update.id);
    if (food) {
        // Find the actual filename including timestamp
        const filename = files.find(f => f.startsWith(update.image) && f.endsWith('.png'));
        if (filename) {
            food.image = `/images/${filename}`;
            updateCount++;
            console.log(`Updated ${food.name} -> /images/${filename}`);
        } else {
            console.log(`Error: Could not find file for ${update.image}`);
        }
    }
});

fs.writeFileSync(foodsPath, JSON.stringify(foods, null, 4));
console.log(`Updated ${updateCount} items.`);
