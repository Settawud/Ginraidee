const fs = require('fs');
const path = require('path');
const https = require('https');

const tasksPath = path.join(__dirname, 'all_gen_tasks.json');
const foodsPath = path.join(__dirname, '../data/foods.json');
const outputDir = path.join(__dirname, '../../client/public/images/menus');
const API_KEY = '0000000000'; // Anonymous API key
const API_HOST = 'stablehorde.net';
const API_PATH_ASYNC = '/api/v2/generate/async';
const API_PATH_CHECK = '/api/v2/generate/check/';
const API_PATH_STATUS = '/api/v2/generate/status/';

// Ensure output dir exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to make HTTPS requests
function makeApiRequest(method, path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_HOST,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY,
                'Client-Agent': 'Gemini-Code-Agent/1.0'
            }
        };

        if (data) {
            options.headers['Content-Length'] = Buffer.byteLength(data);
        }

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(body));
                    } catch (error) {
                        reject(new Error(`Failed to parse JSON response: ${body}`));
                    }
                } else {
                    reject(new Error(`API request failed with status ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (data) {
            req.write(data);
        }
        req.end();
    });
}


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

async function main() {
    console.log('Starting AI image generation process...');
    const tasks = require(tasksPath);
    const foods = require(foodsPath);

    for (const task of tasks) {
        try {
            console.log(`Starting task for: ${task.name}`);

            // 1. Request image generation
            const generationRequestPayload = JSON.stringify({
                prompt: task.prompt,
                params: {
                    n: 1,
                    width: 512,
                    height: 512,
                },
            });

            const generationRequest = await makeApiRequest('POST', API_PATH_ASYNC, generationRequestPayload);
            const requestId = generationRequest.id;
            console.log(`  > Submitted generation request with ID: ${requestId}`);

            // 2. Poll for results
            let done = false;
            let finalResult;
            while (!done) {
                await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
                const checkStatus = await makeApiRequest('GET', API_PATH_CHECK + requestId);
                if (checkStatus.done) {
                    done = true;
                    console.log(`  > Generation finished.`);
                    const statusResult = await makeApiRequest('GET', API_PATH_STATUS + requestId);
                    finalResult = statusResult.generations[0];
                } else {
                    console.log(`  > Still generating... (waiting: ${checkStatus.waiting}, processing: ${checkStatus.processing})`);
                }
            }

            // 3. Download the image
            if (finalResult && finalResult.img) {
                const imageUrl = finalResult.img;
                const localPath = path.join(outputDir, task.filename);
                console.log(`  > Downloading image from ${imageUrl} to ${localPath}`);
                await downloadFile(imageUrl, localPath);

                // 4. Update foods.json
                const foodIndex = foods.findIndex(f => f.id === task.id);
                if (foodIndex !== -1) {
                    foods[foodIndex].image = `/images/menus/${task.filename}`;
                    console.log(`  > Updated foods.json for ${task.name}`);
                } else {
                    console.log(`  > Could not find ID ${task.id} in foods.json`);
                }
            } else {
                console.log(`  > No image URL found for ${task.name}`);
            }

        } catch (error) {
            console.error(`Error processing task for ${task.name}:`, error.message);
        }
    }

    // Save updated foods.json
    fs.writeFileSync(foodsPath, JSON.stringify(foods, null, 4));
    console.log('\nAI image generation process complete.');
}

main();

