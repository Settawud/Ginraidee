const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const foodsPath = path.join(__dirname, '../data/foods.json');
const outputDir = path.join(__dirname, '../../client/public/images/menus');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const foods = require(foodsPath);

// Update map to use LoremFlickr keywords
const keywordMap = {
    34: 'takoyaki',
    37: 'yakisoba',
    42: 'kimchi,stew',
    48: 'french,fries',
    56: 'khanom,krok,dessert',
    57: 'pork,skewers',
    62: 'mushroom,soup',
    64: 'lasagna',
    67: 'shrimp,paste,dip',
    68: 'fried,rice',
    69: 'crab,noodle',
    73: 'wonton,soup',
    82: 'donut',
    84: 'spring,rolls',
    85: 'shrimp,salad',
    95: 'corn,soup',
    96: 'garlic,bread',
    99: 'shaved,ice,dessert',
    101: 'tapioca,balls',
    102: 'banana,sticky,rice',
    105: 'red,pork,rice'
};

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const handleResponse = (response) => {
            // Handle Redirects
            if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
                if (response.headers.location) {
                    let newUrl = response.headers.location;
                    if (newUrl.startsWith('/')) {
                        // Relative redirect
                        newUrl = `https://loremflickr.com${newUrl}`;
                    }
                    // console.log(`Redirecting to ${newUrl}`);
                    const protocol = newUrl.startsWith('https') ? https : http;
                    protocol.get(newUrl, handleResponse).on('error', (err) => {
                        fs.unlink(dest, () => { });
                        reject(err);
                    });
                    return;
                }
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Status ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve());
            });
        };

        const file = fs.createWriteStream(dest);
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, handleResponse).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

(async () => {
    let successCount = 0;
    const brokenItems = foods.filter(f => f.image && f.image.startsWith('http'));
    console.log(`Fixing ${brokenItems.length} broken items using LoremFlickr...`);

    for (const item of brokenItems) {
        const keyword = keywordMap[item.id] || item.nameEn.replace(/ /g, ',');
        const url = `https://loremflickr.com/800/600/${keyword}`;

        const ext = 'png'; // LoremFlickr usually returns jpg but we save as png for consistency or keep jpg
        // Ideally we check content-type but let's stick to png extension for now as app uses it
        const timestamp = Date.now();
        const cleanName = item.nameEn.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const fileName = `${cleanName}_${timestamp}.${ext}`;
        const localPath = path.join(outputDir, fileName);
        const webPath = `/images/menus/${fileName}`;

        try {
            console.log(`Downloading [${item.id}] ${item.name} from LoremFlickr (${keyword})...`);
            await downloadFile(url, localPath);

            const idx = foods.findIndex(f => f.id === item.id);
            if (idx !== -1) {
                foods[idx].image = webPath;
                successCount++;
            }
        } catch (err) {
            console.error(`Failed ${item.name}: ${err.message}`);
        }
    }

    fs.writeFileSync(foodsPath, JSON.stringify(foods, null, 4));
    console.log(`\nFixed ${successCount} items.`);
})();
