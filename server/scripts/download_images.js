const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http'); // For good measure if some are http

const foodsPath = path.join(__dirname, '../data/foods.json');
const missingImagesPath = path.join(__dirname, 'missing_images.json');
const outputDir = path.join(__dirname, '../../client/public/images/menus');

// Ensure output dir exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const foods = require(foodsPath);
const missingImages = require(missingImagesPath);

// Process remaining items (Batch 3)
const batch = missingImages;

// Helper to download file
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(dest);

        protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: Status ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve());
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function processBatch() {
    console.log(`Processing batch of ${batch.length} items...`);
    let successCount = 0;

    for (const item of batch) {
        if (!item.currentImage) {
            console.log(`Skipping ${item.name} - No URL`);
            continue;
        }

        const ext = 'png'; // Unsplash usually serves jpg but we can save as png or jpg. Let's use jpg for photos usually, but user seems to use png. Let's stick to png extension for consistency but content might be jpg. 
        // Actually browsers don't care much, but let's try to map correct extension if possible, or just force png locally.
        // The project seems to use .png for everything.

        const timestamp = Date.now();
        const cleanName = item.nameEn.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const fileName = `${cleanName}_${timestamp}.${ext}`;
        const localPath = path.join(outputDir, fileName);
        const webPath = `/images/menus/${fileName}`;

        try {
            console.log(`Downloading ${item.name} (${item.nameEn})...`);
            await downloadFile(item.currentImage, localPath);

            // Update foods.json entry
            const foodIndex = foods.findIndex(f => f.id === item.id);
            if (foodIndex !== -1) {
                foods[foodIndex].image = webPath;
                successCount++;
            } else {
                console.log(`Could not find ID ${item.id} in foods.json`);
            }

        } catch (error) {
            console.error(`Error processing ${item.name}:`, error.message);
        }
    }

    // Save updated foods.json
    fs.writeFileSync(foodsPath, JSON.stringify(foods, null, 4));
    console.log(`\nBatch complete. Updated ${successCount} items.`);
}

processBatch();
