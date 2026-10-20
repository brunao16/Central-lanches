const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const config = {};
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && v.length) config[k.trim()] = v.join('=').trim();
}
const { createClient } = require('@libsql/client');
const client = createClient({ url: config.TURSO_DATABASE_URL, authToken: config.TURSO_AUTH_TOKEN });

const items = [
  // LANCHES
  { name: "Americano", desc: "Ovo, presunto, mussarela, alface, tomate, milho", cat: "Lanches", price: 2000 },
  { name: "Calabresa", desc: "Calabresa, catupiry, presunto, mussarela, alface, tomate, milho", cat: "Lanches", price: 2200 },
  { name: "Califórnia", desc: "Hambúrguer, presunto, mussarela, alface, tomate, milho", cat: "Lanches", price: 2000 },
  { name: "Catupiry", desc: "Frango, catupiry, mussarela, alface, batata, milho", cat: "Lanches", price: 2200 },
  { name: "Crock", desc: "Hambúrguer, bacon, mussarela, milho, batata", cat: "Lanches", price: 2200 },
  { name: "Crock Rico", desc: "Lombo, catupiry, alface, milho, batata", cat: "Lanches", price: 2300 },
  { name: "Double Burguer", desc: "02 hambúrgueres, presunto, mussarela, tomate, milho", cat: "Lanches", price: 2500 },
  { name: "Triplo Burguer", desc: "03 hambúrgueres, presunto, mussarela, alface, tomate, milho", cat: "Lanches", price: 2800 },
  { name: "Moça Bonita", desc: "Bacon, hambúrguer, catupiry, ovo, presunto, mussarela, tomate, milho", cat: "Lanches", price: 2600 },
  { name: "Galinha Especial", desc: "Frango, catupiry, presunto, mussarela, tomate, milho", cat: "Lanches", price: 2300 },
  { name: "Laçador", desc: "Lombo, presunto, mussarela, alface, tomate, milho", cat: "Lanches", price: 2300 },
  { name: "Lanchão", desc: "Lombo, frango, mussarela, tomate, milho", cat: "Lanches", price: 2400 },
  { name: "Misto", desc: "Presunto, mussarela, batata ou milho", cat: "Lanches", price: 1500 },
  { name: "X-Bacon", desc: "Hambúrguer, bacon, mussarela, tomate, milho", cat: "Lanches", price: 2200 },
  { name: "X-Galinha", desc: "Frango, mussarela, tomate, milho", cat: "Lanches", price: 2000 },
  { name: "X-Lombo", desc: "Lombo, mussarela, tomate, milho", cat: "Lanches", price: 2100 },
  { name: "X-Salada", desc: "Hambúrguer, mussarela, alface, tomate, milho", cat: "Lanches", price: 1900 },
  { name: "X-Palio", desc: "Hambúrguer, bacon, catupiry, presunto, mussarela, alface, tomate, milho", cat: "Lanches", price: 2500 },
  { name: "Mestre Cuca", desc: "Calabresa, bacon, cheddar, presunto, mussarela, alface, tomate, milho", cat: "Lanches", price: 2600 },
  { name: "À Moda da Casa", desc: "Lombo, calabresa, catupiry, presunto, mussarela, alface, tomate, milho", cat: "Lanches", price: 2700 },
  { name: "Super Lanche", desc: "02 Hambúrgueres, catupiry, presunto, mussarela, ovo, alface, tomate, milho", cat: "Lanches", price: 2800 },
  { name: "X-Tudo", desc: "Frango, lombo, bacon, hambúrguer, calabresa, presunto, mussarela, catupiry, alface, tomate, milho", cat: "Lanches", price: 3200 },
  { name: "X-Montanha", desc: "Bacon, calabresa, 02 hambúrgueres, 02 ovos, cheddar, presunto, mussarela, alface, tomate, milho", cat: "Lanches", price: 3500 },

  // ADICIONAIS
  { name: "Adicional: Bacon", desc: "Porção extra de bacon crocante", cat: "Adicionais", price: 500 },
  { name: "Adicional: Frango", desc: "Porção extra de frango desfiado", cat: "Adicionais", price: 500 },
  { name: "Adicional: Lombo", desc: "Porção extra de lombo", cat: "Adicionais", price: 500 },
  { name: "Adicional: Calabresa", desc: "Porção extra de calabresa", cat: "Adicionais", price: 400 },
  { name: "Adicional: Hambúrguer", desc: "Hambúrguer adicional", cat: "Adicionais", price: 500 },
  { name: "Adicional: Presunto", desc: "Presunto adicional", cat: "Adicionais", price: 300 },
  { name: "Adicional: Mussarela", desc: "Mussarela adicional", cat: "Adicionais", price: 400 },
  { name: "Adicional: Catupiry", desc: "Catupiry original cremoso", cat: "Adicionais", price: 400 },
  { name: "Adicional: Cheddar", desc: "Cheddar cremoso", cat: "Adicionais", price: 400 },
  { name: "Adicional: Ovo", desc: "Ovo frito adicional", cat: "Adicionais", price: 250 },
  { name: "Adicional: Alface", desc: "Alface fresca", cat: "Adicionais", price: 150 },
  { name: "Adicional: Tomate", desc: "Fatias de tomate fresco", cat: "Adicionais", price: 150 },
  { name: "Adicional: Milho", desc: "Milho verde", cat: "Adicionais", price: 150 },
  { name: "Adicional: Batata Palha", desc: "Batata palha crocante", cat: "Adicionais", price: 200 },

  // PORÇÕES
  { name: "Batata Frita Simples", desc: "Porção de batata frita sequinha e crocante", cat: "Porções", price: 2500 },
  { name: "Batata Frita, Bacon e Mussarela", desc: "Batata frita coberta com mussarela derretida e cubos de bacon", cat: "Porções", price: 3800 },
  { name: "Batata Frita, Costela e Mussarela", desc: "Batata frita com costela desfiada especial e mussarela derretida", cat: "Porções", price: 4500 },
  { name: "Tulipas Empanadas", desc: "Tulipas de frango empanadas super crocantes", cat: "Porções", price: 4000 },

  // BARCAS
  { name: "Barca Central Lanches", desc: "1 Lanche Moça Bonita partido ao meio, batata frita com cheddar ou catupiry, tulipas empanadas e molhos da casa", cat: "Barcas", price: 6500 }
];

async function seed() {
  console.log("Iniciando cadastro dos produtos no banco Turso...");
  const existing = await client.execute("SELECT id, name, price FROM products");
  const existingMap = new Map();
  for (const row of existing.rows) {
    existingMap.set(row.name.toLowerCase().trim(), row);
  }

  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    if (existingMap.has(key)) {
      const match = existingMap.get(key);
      await client.execute({
        sql: "UPDATE products SET name = ?, description = ?, category = ?, active = 1 WHERE id = ?",
        args: [item.name, item.desc, item.cat, match.id]
      });
      console.log(`[Atualizado] ${item.name}`);
    } else {
      const id = crypto.randomUUID();
      await client.execute({
        sql: "INSERT INTO products (tenant_id, id, name, description, price, cost, active, photo, category, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: ["principal", id, item.name, item.desc, item.price, 0, 1, null, item.cat, -1]
      });
      console.log(`[Inserido] ${item.name} (${item.cat})`);
    }
  }

  console.log("Finalizado com sucesso!");
  const total = await client.execute("SELECT count(*) as count FROM products");
  console.log(`Total de produtos no cardápio agora: ${total.rows[0].count}`);
}

seed().catch(console.error);
