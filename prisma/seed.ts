import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do banco Central Lanches...");

  // 1. Configuração Padrão
  await prisma.setting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      restaurantName: "Central Lanches",
      phone: "(85) 98888-7777",
      address: "Av. Principal, 500 - Centro",
      pixKey: "85988887777",
      openingHours: "Terça a Domingo das 18h às 23h30",
      deliveryFee: 500, // R$ 5,00
      rewardThreshold: 100, // 100 pontos
      rewardDiscount: 1500, // R$ 15,00 de desconto
    },
  });

  // 2. Mesas
  for (let i = 1; i <= 10; i++) {
    await prisma.table.upsert({
      where: { number: i },
      update: {},
      create: {
        number: i,
        capacity: i % 2 === 0 ? 4 : 2,
        occupied: false,
      },
    });
  }

  // 3. Taxas de entrega por bairro
  const zones = [
    { neighborhood: "Centro", fee: 400 },
    { neighborhood: "Bairro Novo", fee: 500 },
    { neighborhood: "Vila Mariana", fee: 600 },
    { neighborhood: "Jardim América", fee: 700 },
    { neighborhood: "Planalto", fee: 800 },
  ];
  for (const zone of zones) {
    await prisma.deliveryZone.upsert({
      where: { neighborhood: zone.neighborhood },
      update: { fee: zone.fee },
      create: {
        neighborhood: zone.neighborhood,
        fee: zone.fee,
        active: true,
      },
    });
  }

  // 4. Categorias do Cardápio
  const catBurgers = await prisma.category.upsert({
    where: { name: "Hambúrgueres Artesanais" },
    update: {},
    create: { name: "Hambúrgueres Artesanais", order: 1 },
  });

  const catCombos = await prisma.category.upsert({
    where: { name: "Combos & Ofertas" },
    update: {},
    create: { name: "Combos & Ofertas", order: 2 },
  });

  const catPorcoes = await prisma.category.upsert({
    where: { name: "Porções & Aperitivos" },
    update: {},
    create: { name: "Porções & Aperitivos", order: 3 },
  });

  const catBebidas = await prisma.category.upsert({
    where: { name: "Bebidas & Sucos" },
    update: {},
    create: { name: "Bebidas & Sucos", order: 4 },
  });

  const catSobremesas = await prisma.category.upsert({
    where: { name: "Sobremesas" },
    update: {},
    create: { name: "Sobremesas", order: 5 },
  });

  // 5. 15 Produtos cadastrados com fotos e descrições
  const products = [
    // Burgers
    {
      categoryId: catBurgers.id,
      name: "X-Burger Clássico",
      description: "Pão brioche selado, blend 160g bovino, cheddar fatiado e maionese da casa.",
      price: 2490,
      costPrice: 950,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
    },
    {
      categoryId: catBurgers.id,
      name: "X-Bacon Supremo",
      description: "Pão brioche, blend 160g, muito bacon crocante, cheddar duplo e barbecue artesanal.",
      price: 2990,
      costPrice: 1200,
      imageUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&auto=format&fit=crop&q=80",
    },
    {
      categoryId: catBurgers.id,
      name: "X-Salada Especial",
      description: "Pão brioche, blend 160g, queijo prato, alface americana fresca, tomate e molho tártaro.",
      price: 2690,
      costPrice: 1050,
      imageUrl: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&auto=format&fit=crop&q=80",
    },
    {
      categoryId: catBurgers.id,
      name: "Monstro Duplo Cheddar",
      description: "Dois blends 160g (320g), 4 fatias de cheddar, cebola caramelizada e bacon crocante.",
      price: 3890,
      costPrice: 1680,
      imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80",
    },
    {
      categoryId: catBurgers.id,
      name: "Frango Crispy",
      description: "Sobrecoxa desossada empanada ultra crocante, salada coleslaw e maionese de páprica.",
      price: 2590,
      costPrice: 900,
      imageUrl: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80",
    },

    // Combos
    {
      categoryId: catCombos.id,
      name: "Combo Individual Clássico",
      description: "1 X-Burger Clássico + 1 Batata Frita Individual + 1 Refrigerante Lata 350ml.",
      price: 3690,
      costPrice: 1500,
      imageUrl: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&auto=format&fit=crop&q=80",
    },
    {
      categoryId: catCombos.id,
      name: "Combo Casal Especial",
      description: "2 X-Bacon Supremo + 1 Batata Suprema Média + 2 Refrigerantes Lata.",
      price: 7490,
      costPrice: 3100,
      imageUrl: "https://images.unsplash.com/photo-1549611016-3a70d82b5040?w=600&auto=format&fit=crop&q=80",
    },

    // Porções
    {
      categoryId: catPorcoes.id,
      name: "Batata Frita Rústica (Individual)",
      description: "Batatas crocantes com alecrim, sal e alho assado. Acompanha maionese verde.",
      price: 1490,
      costPrice: 420,
      imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
    },
    {
      categoryId: catPorcoes.id,
      name: "Batata Suprema com Cheddar e Bacon",
      description: "400g de batata frita coberta com molho cheddar cremoso e farofa de bacon.",
      price: 2890,
      costPrice: 980,
      imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80",
    },
    {
      categoryId: catPorcoes.id,
      name: "Onion Rings Empanadas",
      description: "12 anéis de cebola dourados e super crocantes. Acompanha molho barbecue.",
      price: 2190,
      costPrice: 720,
      imageUrl: "https://images.unsplash.com/photo-1639024471287-032f66ab7503?w=600&auto=format&fit=crop&q=80",
    },

    // Bebidas
    {
      categoryId: catBebidas.id,
      name: "Coca-Cola Original Lata 350ml",
      description: "Lata gelada 350ml.",
      price: 600,
      costPrice: 280,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
    },
    {
      categoryId: catBebidas.id,
      name: "Guaraná Antarctica Lata 350ml",
      description: "Lata gelada 350ml.",
      price: 600,
      costPrice: 270,
      imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&auto=format&fit=crop&q=80",
    },
    {
      categoryId: catBebidas.id,
      name: "Suco Natural de Laranja 500ml",
      description: "100% fruta fresca, sem conservantes, preparado na hora.",
      price: 990,
      costPrice: 350,
      imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80",
    },

    // Sobremesas
    {
      categoryId: catSobremesas.id,
      name: "Milkshake de Nutella 400ml",
      description: "Sorvete artesanal batido com Nutella pura e chantilly fresco.",
      price: 1890,
      costPrice: 650,
      imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80",
    },
    {
      categoryId: catSobremesas.id,
      name: "Brownie com Sorvete e Calda Quente",
      description: "Brownie de chocolate belga quentinho com bola de sorvete de baunilha e calda de fudge.",
      price: 1790,
      costPrice: 600,
      imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80",
    },
  ];

  for (const prod of products) {
    const existing = await prisma.product.findFirst({ where: { name: prod.name } });
    if (!existing) {
      await prisma.product.create({ data: prod });
    }
  }

  // 6. Cliente Exemplo
  await prisma.customer.upsert({
    where: { phone: "85999998888" },
    update: {},
    create: {
      name: "João da Silva",
      phone: "85999998888",
      address: "Rua das Flores, 123 - Bairro Novo",
      points: 25,
    },
  });

  // 7. Insumos de Estoque
  const inventoryItems = [
    { name: "Pão Brioche (un)", unit: "un", quantity: 60, minQuantity: 20, cost: 180 },
    { name: "Blend Bovino 160g (kg)", unit: "kg", quantity: 12.5, minQuantity: 5, cost: 3400 },
    { name: "Queijo Cheddar Fatiado (kg)", unit: "kg", quantity: 4.2, minQuantity: 2, cost: 4200 },
    { name: "Bacon em Fatias (kg)", unit: "kg", quantity: 3.5, minQuantity: 2, cost: 3800 },
    { name: "Batata Congelada 9mm (pct 2kg)", unit: "pct", quantity: 15, minQuantity: 6, cost: 2400 },
    { name: "Refrigerante Lata Diversos (un)", unit: "un", quantity: 48, minQuantity: 24, cost: 280 },
  ];
  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }

  // 8. Caixa Aberto Padrão
  const openRegister = await prisma.cashRegister.findFirst({ where: { status: "ABERTO" } });
  if (!openRegister) {
    await prisma.cashRegister.create({
      data: {
        initialAmount: 15000, // R$ 150,00 de fundo de troco
        status: "ABERTO",
        notes: "Caixa aberto automaticamente pelo seed.",
        movements: {
          create: {
            type: "ABERTURA",
            amount: 15000,
            description: "Fundo de troco inicial",
          },
        },
      },
    });
  }

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
