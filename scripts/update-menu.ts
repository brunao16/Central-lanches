import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Substituindo produtos pelo novo cardápio da Central Lanches...");

  // 1. Limpar produtos anteriores
  // Se houver OrderItem vinculados, excluímos itens de teste ou apenas os produtos
  await prisma.orderItem.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  // 2. Criar novas categorias
  const catLanches = await prisma.category.create({
    data: { name: "Lanches", order: 1, active: true },
  });

  const catAdicionais = await prisma.category.create({
    data: { name: "Adicionais", order: 2, active: true },
  });

  const catPorcoes = await prisma.category.create({
    data: { name: "Porções", order: 3, active: true },
  });

  const catBarcas = await prisma.category.create({
    data: { name: "Barcas", order: 4, active: true },
  });

  const catBebidas = await prisma.category.create({
    data: { name: "Bebidas", order: 5, active: true },
  });

  // Imagens padrão de alta qualidade para cada categoria
  const burgerImg = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80";
  const friesImg = "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80";
  const barcaImg = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80";
  const addImg = "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=600&auto=format&fit=crop&q=80";

  // 3. Cadastrar LANCHES (preços do cardápio real da Central Lanches em centavos)
  const lanches = [
    {
      name: "Americano",
      description: "Ovo, presunto, mussarela, alface, tomate, milho",
      price: 2000, // R$ 20,00
      costPrice: 800,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "Calabresa",
      description: "Calabresa, catupiry, presunto, mussarela, alface, tomate, milho",
      price: 2200, // R$ 22,00
      costPrice: 900,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "California",
      description: "Hambúrguer, presunto, mussarela, alface, tomate, milho",
      price: 2000,
      costPrice: 850,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "Catupiry",
      description: "Frango, catupiry, mussarela, alface, batata, milho",
      price: 2200,
      costPrice: 900,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "Crock",
      description: "Hambúrguer, bacon, mussarela, milho, batata",
      price: 2200,
      costPrice: 950,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "Crock Rico",
      description: "Lombo, catupiry, alface, milho, batata",
      price: 2300,
      costPrice: 1000,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "Double Burguer",
      description: "02 hambúrgueres, presunto, mussarela, tomate, milho",
      price: 2500,
      costPrice: 1100,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "Triplo Burguer",
      description: "03 hambúrgueres, presunto, mussarela, alface, tomate, milho",
      price: 2800,
      costPrice: 1300,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "Moça Bonita",
      description: "Bacon, hambúrguer, catupiry, ovo, presunto, mussarela, tomate, milho",
      price: 2600,
      costPrice: 1150,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "Galinha Especial",
      description: "Frango, catupiry, presunto, mussarela, tomate, milho",
      price: 2300,
      costPrice: 950,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "Laçador",
      description: "Lombo, presunto, mussarela, alface, tomate, milho",
      price: 2300,
      costPrice: 1000,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "Lanchão",
      description: "Lombo, frango, mussarela, tomate, milho",
      price: 2400,
      costPrice: 1050,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "Misto",
      description: "Presunto, mussarela, batata ou milho",
      price: 1500,
      costPrice: 600,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "X-Bacon",
      description: "Hambúrguer, bacon, mussarela, tomate, milho",
      price: 2200,
      costPrice: 950,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "X-Galinha",
      description: "Frango, mussarela, tomate, milho",
      price: 2000,
      costPrice: 850,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "X-Lombo",
      description: "Lombo, mussarela, tomate, milho",
      price: 2100,
      costPrice: 900,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "X-Salada",
      description: "Hambúrguer, mussarela, alface, tomate, milho",
      price: 1900,
      costPrice: 800,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "X-Palio",
      description: "Hambúrguer, bacon, catupiry, presunto, mussarela, alface, tomate, milho",
      price: 2500,
      costPrice: 1100,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "Mestre Cuca",
      description: "Calabresa, bacon, cheddar, presunto, mussarela, alface, tomate, milho",
      price: 2600,
      costPrice: 1150,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "À Moda da Casa",
      description: "Lombo, calabresa, catupiry, presunto, mussarela, alface, tomate, milho",
      price: 2700,
      costPrice: 1200,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "Super Lanche",
      description: "02 Hambúrgueres, catupiry, presunto, mussarela, ovo, alface, tomate, milho",
      price: 2800,
      costPrice: 1250,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "X-Tudo",
      description: "Frango, lombo, bacon, hambúrguer, calabresa, presunto, mussarela, catupiry, alface, tomate, milho",
      price: 3200,
      costPrice: 1450,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
    {
      name: "X-Montanha",
      description: "Bacon, calabresa, 02 hambúrgueres, 02 ovos, cheddar, presunto, mussarela, alface, tomate, milho",
      price: 3500,
      costPrice: 1600,
      imageUrl: burgerImg,
      categoryId: catLanches.id,
    },
  ];

  for (const item of lanches) {
    await prisma.product.create({ data: item });
  }

  // 4. Cadastrar ADICIONAIS
  const adicionais = [
    { name: "Adicional: Bacon", description: "Bacon crocante extra", price: 500, costPrice: 200, imageUrl: addImg, categoryId: catAdicionais.id },
    { name: "Adicional: Frango", description: "Frango desfiado extra", price: 500, costPrice: 200, imageUrl: addImg, categoryId: catAdicionais.id },
    { name: "Adicional: Lombo", description: "Lombo especial extra", price: 500, costPrice: 200, imageUrl: addImg, categoryId: catAdicionais.id },
    { name: "Adicional: Calabresa", description: "Calabresa fatiada extra", price: 400, costPrice: 150, imageUrl: addImg, categoryId: catAdicionais.id },
    { name: "Adicional: Hambúrguer", description: "Hambúrguer extra", price: 500, costPrice: 200, imageUrl: addImg, categoryId: catAdicionais.id },
    { name: "Adicional: Presunto", description: "Presunto fatiado extra", price: 300, costPrice: 100, imageUrl: addImg, categoryId: catAdicionais.id },
    { name: "Adicional: Mussarela", description: "Mussarela derretida extra", price: 400, costPrice: 150, imageUrl: addImg, categoryId: catAdicionais.id },
    { name: "Adicional: Catupiry", description: "Catupiry cremoso extra", price: 400, costPrice: 150, imageUrl: addImg, categoryId: catAdicionais.id },
    { name: "Adicional: Cheddar", description: "Cheddar cremoso extra", price: 400, costPrice: 150, imageUrl: addImg, categoryId: catAdicionais.id },
    { name: "Adicional: Ovo", description: "Ovo frito extra", price: 250, costPrice: 80, imageUrl: addImg, categoryId: catAdicionais.id },
    { name: "Adicional: Alface", description: "Alface fresca extra", price: 150, costPrice: 50, imageUrl: addImg, categoryId: catAdicionais.id },
    { name: "Adicional: Tomate", description: "Tomate em rodelas extra", price: 150, costPrice: 50, imageUrl: addImg, categoryId: catAdicionais.id },
    { name: "Adicional: Milho", description: "Milho verde extra", price: 150, costPrice: 50, imageUrl: addImg, categoryId: catAdicionais.id },
    { name: "Adicional: Batata", description: "Batata palha extra", price: 200, costPrice: 70, imageUrl: addImg, categoryId: catAdicionais.id },
  ];

  for (const item of adicionais) {
    await prisma.product.create({ data: item });
  }

  // 5. Cadastrar PORÇÕES
  const porcoes = [
    {
      name: "Batata Frita Simples",
      description: "Porção de batata frita sequinha e crocante",
      price: 2500, // R$ 25,00
      costPrice: 800,
      imageUrl: friesImg,
      categoryId: catPorcoes.id,
    },
    {
      name: "Batata Frita, Bacon e Mussarela",
      description: "Batata frita coberta com mussarela derretida e cubos de bacon",
      price: 3800, // R$ 38,00
      costPrice: 1400,
      imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80",
      categoryId: catPorcoes.id,
    },
    {
      name: "Batata Frita, Costela e Mussarela",
      description: "Batata frita com costela desfiada especial e mussarela derretida",
      price: 4500, // R$ 45,00
      costPrice: 1800,
      imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80",
      categoryId: catPorcoes.id,
    },
    {
      name: "Tulipas Empanadas",
      description: "Tulipas de frango empanadas super crocantes",
      price: 4000, // R$ 40,00
      costPrice: 1500,
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80",
      categoryId: catPorcoes.id,
    },
  ];

  for (const item of porcoes) {
    await prisma.product.create({ data: item });
  }

  // 6. Cadastrar BARCAS
  const barcas = [
    {
      name: "Barca Central Lanches",
      description: "1 Lanche Moça Bonita partido ao meio, batata frita com cheddar ou catupiry, tulipas empanadas e molhos da casa",
      price: 6500, // R$ 65,00
      costPrice: 2600,
      imageUrl: barcaImg,
      categoryId: catBarcas.id,
    },
  ];

  for (const item of barcas) {
    await prisma.product.create({ data: item });
  }

  // 7. Bebidas básicas para compor
  const bebidas = [
    {
      name: "Coca-Cola Lata 350ml",
      description: "Lata gelada 350ml",
      price: 600,
      costPrice: 280,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
      categoryId: catBebidas.id,
    },
    {
      name: "Guaraná Antarctica Lata 350ml",
      description: "Lata gelada 350ml",
      price: 600,
      costPrice: 270,
      imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&auto=format&fit=crop&q=80",
      categoryId: catBebidas.id,
    },
    {
      name: "Suco Natural 500ml",
      description: "Suco de laranja preparado na hora",
      price: 900,
      costPrice: 320,
      imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80",
      categoryId: catBebidas.id,
    },
  ];

  for (const item of bebidas) {
    await prisma.product.create({ data: item });
  }

  const count = await prisma.product.count();
  console.log(`Sucesso! Total de produtos cadastrados no banco: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
