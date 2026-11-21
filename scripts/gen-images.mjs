import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUT = '/home/z/my-project/public/images';
fs.mkdirSync(OUT, { recursive: true });

const images = [
  // HERO
  { name: 'hero.jpg', size: '2048x1152', prompt: 'Cinematic macro photograph of an orange bird of paradise flower (strelitzia) covered in rain droplets, surrounded by peach roses and pink pincushion protea flowers, dark moody teal-black background, falling rain streaks visible, dramatic studio lighting, luxury florist editorial, high quality, detailed' },
  // COLLECTIONS
  { name: 'rose-box.jpg', size: '864x1152', prompt: 'Luxury florist editorial photograph, elegant open rectangular gift box filled with one hundred deep red velvet roses, red rose petals scattered around on a marble table beside an olive green striped velvet armchair, olive green studio backdrop, moody soft lighting, high fashion, high quality' },
  { name: 'flower-box.jpg', size: '768x1344', prompt: 'Editorial fashion photograph, elegant woman in teal blue midi dress with white lace collar sitting on a large wooden rocking horse, holding a huge autumn bouquet of orange, peach and burgundy flowers in a white vase, dark brown velvet curtain backdrop, black and white checkered floor, moody dramatic lighting, high quality' },
  { name: 'occasion-bouquet-warm.jpg', size: '864x1152', prompt: 'Editorial fashion photograph, elegant woman with dark hair in an updo wearing a deep burgundy velvet dress, holding an abundant festive Mother\'s Day hand bouquet of orange lilies, peach carnations, burgundy dahlias and cream lisianthus wrapped in brown kraft paper with golden satin ribbon, dark brown velvet curtain backdrop, moody dramatic painterly lighting, oil painting aesthetic, warm earthy tones, luxury florist brand editorial, no roses, high quality' },
  { name: 'bouquets.jpg', size: '2048x1152', prompt: 'Editorial fashion photograph, young woman wearing black beret and blue ruffled collar holding an abundant bouquet of orange roses, strelitzia and autumn flowers wrapped in brown paper, light blue vertical striped curtain backdrop, oil painting aesthetic, soft lighting, luxury florist, high quality' },
  // SEASONAL / BIG SECTIONS
  { name: 'autumn.jpg', size: '864x1152', prompt: 'Moody cinematic portrait, beautiful woman with short dark hair and red lips wearing white ruffled victorian collar blouse, standing among heavily blurred red and orange autumn flowers in foreground, dark warm bokeh background, painterly atmosphere, editorial fashion, high quality' },
  { name: 'vip-bg.jpg', size: '2048x1152', prompt: 'Blurred dreamy photograph through rain-streaked glass, dark crimson red luxurious room with golden brass arch decorated with red flowers and candles, soft romantic haze, deep burgundy tones, luxury event atmosphere, cinematic, high quality' },
  { name: 'beyond-starry-v8.jpg', size: '2048x1152', prompt: 'Wide landscape commercial photograph taken from a distance, a white delivery van seen from far away positioned entirely within the left third of the image, driving on an empty highway toward the right at dusk, the van side panel wrapped with swirling Van Gogh Starry Night painting in deep blue and golden yellow with orange sunflowers along the bottom, the words "Golestane Hafez" written in white letters on the painted panel, the right two thirds of the image is only dramatic empty purple and orange sunset sky above a long empty road, no other objects, copy space, cinematic, high quality' },
  // OCCASIONS
  { name: 'occasion-wedding-warm.jpg', size: '864x1152', prompt: 'Moody romantic editorial photograph, elegant bride with braided hair wearing ivory lace dress with pearl earrings, holding an abundant bouquet of orange, peach and burgundy autumn flowers, dark brown velvet curtain backdrop, warm candlelight bokeh, oil painting aesthetic, warm earthy tones, luxury florist brand editorial, high quality' },
  { name: 'occasion-birthday-warm.jpg', size: '864x1152', prompt: 'Moody festive birthday still life photograph, elegant wrapped gift boxes with golden satin ribbons beside a lush flower arrangement of orange, peach and burgundy flowers and glowing candles on a dark wooden table, dark brown velvet backdrop, warm golden bokeh lights, dark editorial style, cinematic, high quality' },
  { name: 'occasion-celebration.jpg', size: '864x1152', prompt: 'Moody festive celebration photograph, elegant banquet table decorated with abundant lush flower arrangements of orange, peach and burgundy flowers, glowing candles and warm string bokeh lights, dark brown velvet backdrop, joyful party atmosphere, dark editorial style, cinematic, high quality' },
  { name: 'occasion-assembly.jpg', size: '864x1152', prompt: 'Elegant event hall photograph, formal conference stage decorated with tall lush flower arrangements of orange, peach and burgundy flowers and golden candelabras, rows of empty chairs, warm ambient lighting, dark moody editorial style, cinematic, high quality' },
  // PRODUCTS (best sellers)
  { name: 'p1.jpg', size: '864x1152', prompt: 'Elegant blonde woman wearing white wide brim hat and white coat holding a huge bouquet of pink roses wrapped in pink paper, luxury florist delivery photo, soft daylight, high quality' },
  { name: 'p2.jpg', size: '864x1152', prompt: 'Person in dark green coat holding a tall round hand bouquet of white lilies and white roses wrapped in white paper, luxury florist product photo, neutral background, soft light, high quality' },
  { name: 'p3.jpg', size: '864x1152', prompt: 'Elegant woman in brown coat holding a heart-shaped deep red velvet box filled with red roses, luxury gift photography, outdoor cafe setting, high quality' },
  { name: 'p4.jpg', size: '864x1152', prompt: 'Person holding a creative bouquet of red roses arranged in a cream teddy bear shaped wrap with plush texture, luxury florist product photo, classic building entrance background, high quality' },
  { name: 'p5-vase.jpg', size: '864x1152', prompt: 'Luxury product photograph, tall white ceramic vase with white lilies and lavender flowers on a marble table, green garden background, elegant event styling, soft daylight, no food, high quality' },
  { name: 'p6.jpg', size: '864x1152', prompt: 'Luxury product photo, sleek black long rectangular box filled with perfect red roses with gold details, held by hands with red nails over dark silk, moody premium lighting, high quality' },
  { name: 'p7.jpg', size: '864x1152', prompt: 'Woman in beige coat holding a fluffy cream teddy bear shaped bouquet of red roses with satin ribbon, luxury florist creative arrangement, studio soft light, high quality' },
  { name: 'p8.jpg', size: '864x1152', prompt: 'Elegant woman holding a round pink and peach roses flower box with gold trim, luxury florist product photography, neutral chic background, soft light, high quality' },
  // STORES
  { name: 'store-isfahan.jpg', size: '864x1152', prompt: 'Evening photograph of an elegant luxury flower shop storefront in Isfahan, large black sign with golden letters reading "Golestane Hafez" above the arched wooden entrance, glowing warm windows full of orange and burgundy autumn flower bouquets, flower buckets on the sidewalk, cozy upscale street, dark moody cinematic tones, high quality' },
  { name: 'store-tehran.jpg', size: '864x1152', prompt: 'Dusk photograph of a modern upscale flower atelier storefront in Tehran, elegant dark green facade with a black and gold sign reading "Golestane Hafez" above the glass entrance, large windows displaying lush bouquets of orange, peach and burgundy flowers, warm light spilling onto the pavement, moody cinematic editorial style, high quality' },
  // INSTAGRAM
  { name: 'ig1.jpg', size: '1024x1024', prompt: 'Cinematic square photograph, woman face partially hidden among deep red autumn maple leaves, moody dark red tones, editorial beauty shot, high quality' },
  { name: 'ig2.jpg', size: '1024x1024', prompt: 'Elegant square photograph of a bride holding a white rose bouquet, close-up on flowing ivory dress fabric and flowers, soft romantic light, high quality' },
  { name: 'journal-roses.jpg', size: '1024x1024', prompt: 'Moody square photograph of an elegant hand holding a bouquet of dark purple and burgundy roses wrapped in black paper, luxurious dark velvet background, dramatic tones, luxury florist editorial, high quality' },
  { name: 'journal-florist.jpg', size: '1024x1024', prompt: 'Square photograph of an abundant lush flower arrangement of red roses and white peonies in a glass vase with soft candlelight bokeh in the background, dark romantic atmosphere, luxury florist editorial, high quality' },
];

const CONCURRENCY = 2;
let idx = 0;

async function worker(id) {
  while (idx < images.length) {
    const job = images[idx++];
    const out = path.join(OUT, job.name);
    if (fs.existsSync(out) && fs.statSync(out).size > 10000) {
      console.log(`skip ${job.name}`);
      continue;
    }
    let ok = false;
    for (let attempt = 1; attempt <= 6 && !ok; attempt++) {
      try {
        const zai = await ZAI.create();
        const res = await zai.images.generations.create({ prompt: job.prompt, size: job.size });
        const b64 = res?.data?.[0]?.base64;
        if (!b64) throw new Error('empty response');
        fs.writeFileSync(out, Buffer.from(b64, 'base64'));
        console.log(`OK  ${job.name} (${Buffer.from(b64, 'base64').length} bytes)`);
        ok = true;
      } catch (e) {
        const isRate = /429/.test(e.message);
        const waitMs = isRate ? 12000 * attempt : 2500 * attempt;
        console.log(`ERR ${job.name} attempt ${attempt}: ${e.message.slice(0, 90)} — waiting ${waitMs}ms`);
        await new Promise(r => setTimeout(r, waitMs));
      }
    }
    if (!ok) console.log(`FAIL ${job.name}`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));
console.log('ALL DONE');
