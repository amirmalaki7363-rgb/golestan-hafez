import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const products = [
  { sku: '1001033', name: 'Pink Roses Pink Belle', price: 35800000, image: '/images/p1.jpg' },
  { sku: '1001464', name: 'Golestane Round Hand Bouquet - White Lily', price: 58800000, image: '/images/p2.jpg' },
  { sku: '100816506', name: 'Heart Box Red Roses', price: 28800000, image: '/images/p3.jpg' },
  { sku: '100816507', name: 'Teddy Bouquet', price: 28800000, image: '/images/p4.jpg' },
  { sku: '100816508', name: 'Royal Garden Vase', price: 158800000, image: '/images/p5.jpg' },
  { sku: '100816509', name: 'Golestane Long Box - Black', price: 88800000, image: '/images/p6.jpg' },
  { sku: '100816510', name: 'Teddy Bouquet - Cream', price: 40800000, image: '/images/p7.jpg' },
  { sku: '100816511', name: 'Pink & Peach Flower Box', price: 38800000, image: '/images/p8.jpg' },
];

async function main() {
  for (const p of products) {
    await db.product.upsert({
      where: { sku: p.sku },
      update: { ...p },
      create: { ...p },
    });
  }
  const count = await db.product.count();
  console.log(`Seeded. Products in DB: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
