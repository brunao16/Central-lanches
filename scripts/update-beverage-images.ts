import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Atualizando imagens das bebidas no banco de dados...");

  await prisma.product.updateMany({
    where: { name: { contains: "Coca-Cola 2", mode: "insensitive" } },
    data: { imageUrl: "/coca-2l.png" },
  });

  await prisma.product.updateMany({
    where: { name: { contains: "Guaraná Antarctica 2", mode: "insensitive" } },
    data: { imageUrl: "/guarana-2l.png" },
  });

  await prisma.product.updateMany({
    where: { name: { contains: "Guaraná Antarctica Lata", mode: "insensitive" } },
    data: { imageUrl: "/guarana-lata.png" },
  });

  console.log("Imagens das bebidas atualizadas com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
