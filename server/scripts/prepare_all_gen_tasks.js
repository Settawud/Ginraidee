const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../data/foods.json');
const foods = require(foodsPath);

// Already done or requested manually earlier (IDs 8-12)
const excludedIds = [8, 9, 10, 11, 12];

const tasks = foods
    .filter(f => !f.image.includes('_ai_') && !excludedIds.includes(f.id))
    .map(f => {
        // Generate a prompt based on name and description
        let prompt = `Delicious ${f.nameEn} (${f.name}), ${f.description}. High quality food photography, 4k, appetizing, restaurant style, vibrant colors.`;

        // Refine filenames
        const cleanName = f.nameEn.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const filename = `${cleanName}_ai.png`;

        return {
            id: f.id,
            name: f.nameEn,
            filename: filename,
            prompt: prompt
        };
    });

const outputPath = path.join(__dirname, 'all_gen_tasks.json');
fs.writeFileSync(outputPath, JSON.stringify(tasks, null, 4));

console.log(`Generated ${tasks.length} prompts.`);
console.log(`Saved to ${outputPath}`);

// Print first 5 for verification
tasks.slice(0, 5).forEach(t => {
    console.log(`[${t.id}] ${t.name}: ${t.prompt}`);
});
