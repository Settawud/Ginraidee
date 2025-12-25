const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../data/foods.json');
const imagesDir = path.join(__dirname, '../../client/public/images');

const foods = require(foodsPath);
const existingImages = fs.readdirSync(imagesDir);

let missingCount = 0;
let hasImageCount = 0;
const missingItems = [];

console.log(`Analyzing ${foods.length} food items...`);

foods.forEach(food => {
    let hasLocalImage = false;
    if (food.image && food.image.startsWith('/images/')) {
        const filename = food.image.split('/').pop();
        if (existingImages.includes(filename)) {
            hasLocalImage = true;
        }
    }

    if (hasLocalImage) {
        hasImageCount++;
    } else {
        missingCount++;
        missingItems.push({
            id: food.id,
            name: food.name,
            nameEn: food.nameEn,
            description: food.description,
            currentImage: food.image
        });
    }
});

console.log(`Total items: ${foods.length}`);
console.log(`With local images: ${hasImageCount}`);
console.log(`Missing local images: ${missingCount}`);

if (missingCount > 0) {
    console.log('\nSample missing items:');
    missingItems.slice(0, 5).forEach(item => {
        console.log(`- [${item.id}] ${item.name} (${item.nameEn}): ${item.currentImage}`);
    });

    // Write missing items to a file for easier processing
    fs.writeFileSync(
        path.join(__dirname, 'missing_images.json'),
        JSON.stringify(missingItems, null, 2)
    );
    console.log(`\nFull list of missing items written to server/scripts/missing_images.json`);
}
