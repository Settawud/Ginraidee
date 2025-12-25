const fs = require('fs');
const path = require('path');

// List of top 5 items to generate
const tasks = [
    {
        id: 8,
        name: "Samgyeopsal",
        filename: "samgyeopsal_ai.png",
        prompt: "Delicious Samgyeopsal (Grilled Pork Belly) Korean BBQ on a grill with fresh lettuce, garlic, chili, and dipping sauce (ssamjang). High quality food photography, 4k, appetizing, restaurant style, vibrant colors."
    },
    {
        id: 9,
        name: "Margherita Pizza",
        filename: "pizza_margherita_ai.png",
        prompt: "Classic Margherita Pizza with fresh basil, mozzarella cheese, and tomato sauce. High quality food photography, 4k, delicious, melted cheese, rustic background."
    },
    {
        id: 10,
        name: "Beef Steak",
        filename: "beef_steak_ai.png",
        prompt: "Premium Beef Steak cooked medium rare, served with mashed potatoes and grilled vegetables. High quality food photography, 4k, appetizing, juicy meat, restaurant plating."
    },
    {
        id: 11,
        name: "Beef Burger",
        filename: "beef_burger_ai.png",
        prompt: "Juicy Beef Burger with cheese, fresh lettuce, tomato, and special sauce, served with french fries. High quality food photography, 4k, appetizing, fast food style but premium look."
    },
    {
        id: 12,
        name: "Fried Chicken",
        filename: "fried_chicken_ai.png",
        prompt: "Crispy Fried Chicken (6 pieces) golden brown, juicy and hot. High quality food photography, 4k, appetizing, fast food style, on a wooden board."
    }
];

const outputPath = path.join(__dirname, 'manual_gen_tasks.json');
fs.writeFileSync(outputPath, JSON.stringify(tasks, null, 4));

console.log('--- Image Generation Tasks ---');
console.log(`Saved task list to: ${outputPath}`);
console.log('You can use these prompts to generate images externally.\n');

tasks.forEach(t => {
    console.log(`[ID ${t.id}] ${t.name}`);
    console.log(`Target Filename: ${t.filename}`);
    console.log(`Prompt: ${t.prompt}`);
    console.log('-----------------------------------');
});
