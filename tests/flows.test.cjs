require('../scripts/register.cjs');
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@libsql/client');
const { migrate } = require('../scripts/migrate.cjs');
fs.mkdirSync(path.resolve('work'),{recursive:true});
const file=path.resolve('work',`test-${process.pid}-${Date.now()}.db`);
process.env.TURSO_DATABASE_URL='file:'+file.replaceAll('\\','/');
process.env.TURSO_AUTH_TOKEN='';
process.env.JWT_SECRET='integration-test-secret-for-local-tests-only-123456789';
const {getDb}=require('../db/index.ts');
const schema=require('../db/schema.ts');
const {eq,and}=require('drizzle-orm');
const {createToken,hashPassword,verifyPassword}=require('../lib/auth.ts');
const {checkout,cancelSale,day}=require('../lib/checkout.ts');
const records=require('../app/api/records/route.ts');
const auth=require('../app/api/auth/route.ts');
let db,token,admin,cashier,other,product,second,branch;
const request=(method,body,credential=token,url='http://localhost/api/records')=>new Request(url,{method,headers:{'content-type':'application/json',...(credential?{cookie:`cl_token=${credential}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
const post=async(body,credential)=>records.POST(request('POST',body,credential));
before(async()=>{
 const client=createClient({url:process.env.TURSO_DATABASE_URL});await migrate(client);client.close(); db=getDb();
 admin={userId:crypto.randomUUID(),tenantId:crypto.randomUUID(),name:'Admin',email:'admin@test.local',branch:crypto.randomUUID(),role:'admin',plan:'pro'};
 cashier={...admin,userId:crypto.randomUUID(),name:'Caixa',email:'caixa@test.local',role:'caixa'};
 other={...admin,userId:crypto.randomUUID(),tenantId:crypto.randomUUID(),branch:crypto.randomUUID(),name:'Outro',email:'other@test.local'};
 branch=crypto.randomUUID();
 await db.insert(schema.branches).values([{id:admin.branch,tenantId:admin.tenantId,name:'A'},{id:branch,tenantId:admin.tenantId,name:'A2'},{id:other.branch,tenantId:other.tenantId,name:'B'}]);
 for(const u of [admin,cashier,other]) await db.insert(schema.users).values({id:u.userId,tenantId:u.tenantId,branch:u.branch,username:u.email,password:await hashPassword('Testing123!'),name:u.name,role:u.role,plan:u.plan});
 token=await createToken(admin);
 product={id:crypto.randomUUID(),tenantId:admin.tenantId,name:'Burger',price:1000,stock:20};
 second={id:crypto.randomUUID(),tenantId:admin.tenantId,name:'Juice',price:500,stock:20};
 await db.insert(schema.products).values([product,second,{...product,id:crypto.randomUUID(),tenantId:other.tenantId,name:'Private'}]);
});
function sale(overrides={}){return {action:'sale',id:crypto.randomUUID(),items:[{id:product.id,qty:1}],payment:'Pix',expectedTotal:1000,discount:0,...overrides};}
async function stock(){return (await db.select().from(schema.products).where(eq(schema.products.id,product.id)).get()).stock;}
test('Unauthenticated and cashier administrative requests are rejected',async()=>{
 assert.equal((await post({action:'create-user'},null)).status,401);
 const c=await createToken(cashier);assert.equal((await post({action:'create-user'},c)).status,403);
 assert.equal((await records.GET(request('GET',null,c,'http://localhost/api/records?action=users'))).status,403);
});
test('Tenant data and password fields are isolated',async()=>{
 const data=await (await records.GET(request('GET'))).json();assert.equal(data.products.length,2);assert.ok(data.products.every(p=>p.tenantId===admin.tenantId));
 const data2=await (await records.GET(request('GET',null,token,'http://localhost/api/records?action=users'))).json();assert.ok(data2.users.every(u=>!('password' in u)));
 const res=await records.GET(request('GET',null,token,`http://localhost/api/records?branch=${other.branch}`));assert.equal(res.status,403);
});
test('Declined payments and changed prices do not alter stock',async()=>{
 const before=await stock();assert.equal((await post(sale({payment:'Dinheiro',received:100}))).status,400);assert.equal(await stock(),before);
 assert.equal((await post(sale({expectedTotal:1}))).status,409);assert.equal(await stock(),before);
});
test('Multi-item invalid order rolls back every stock change',async()=>{
 const before=await stock();const res=await post(sale({items:[{id:product.id,qty:1},{id:second.id,qty:999}],expectedTotal:500500}));assert.equal(res.status,409);assert.equal(await stock(),before);
});
test('Checkout retry is idempotent and cancellation/restoration preserve history',async()=>{
 const before=await stock(),b=sale();assert.equal((await post(b)).status,200);assert.equal((await post(b)).status,200);assert.equal(await stock(),before-1);
 await cancelSale(admin,b.id);await cancelSale(admin,b.id);assert.equal(await stock(),before);
 assert.ok((await db.select().from(schema.sales).where(eq(schema.sales.id,b.id)).get()).cancelledAt);
 await cancelSale(admin,b.id,true);await cancelSale(admin,b.id,true);assert.equal(await stock(),before-1);
 await cancelSale(admin,b.id);
});
test('Coupon preview is read-only; sale stores validated discount and tip',async()=>{
 await db.insert(schema.coupons).values({id:crypto.randomUUID(),tenantId:admin.tenantId,code:'SAVE',type:'percent',value:10,uses_left:2,valid_until:'2099-12-31'});
 const preview=await post({action:'apply-coupon',code:'SAVE',items:[{id:product.id,qty:1}]});assert.equal(preview.status,200);assert.equal((await preview.json()).discount,100);
 const count=async()=> (await db.select().from(schema.coupons).where(eq(schema.coupons.code,'SAVE')).get()).uses_left;
 assert.equal(await count(),2);const b=sale({coupon:'SAVE',discount:100,tip:200});const result=await post(b);assert.equal(result.status,200);assert.equal((await result.json()).total,1100);assert.equal(await count(),1);
 const saved=await db.select().from(schema.sales).where(eq(schema.sales.id,b.id)).get();assert.equal(saved.discount,100);assert.equal(saved.tip,200);await cancelSale(admin,b.id);assert.equal(await count(),2);
});
test('Client cannot invent discounts or manipulate product prices',async()=>{
 assert.equal((await post(sale({discount:900}))).status,409);
 const foreign=await db.select().from(schema.products).where(eq(schema.products.tenantId,other.tenantId)).get();assert.equal((await post(sale({items:[{id:foreign.id,qty:1}]}))).status,400);
});
test('Branch totals include only branch expenses and product ranking includes all items',async()=>{
 await db.insert(schema.expenses).values([{id:crypto.randomUUID(),tenantId:admin.tenantId,branch:admin.branch,day:day(),merchant:'A',amount:100,created:new Date().toISOString()},{id:crypto.randomUUID(),tenantId:admin.tenantId,branch,day:day(),merchant:'A2',amount:900,created:new Date().toISOString()}]);
 const b=sale({items:[{id:product.id,qty:1},{id:second.id,qty:2}],expectedTotal:2000});await post(b);
 const d=await (await records.GET(request('GET',null,token,`http://localhost/api/records?action=dashboard&branch=${admin.branch}`))).json();assert.equal(d.totals.costs,100);assert.equal(d.topProducts.find(p=>p.name==='Juice').total,1000);await cancelSale(admin,b.id);
});
test('Employee passwords are hashed and logout expires the HttpOnly cookie',async()=>{
 const response=await post({action:'create-user',username:'new@test.local',name:'New',password:'Employee123!',role:'caixa'});assert.equal(response.status,200);
 const u=await db.select().from(schema.users).where(eq(schema.users.username,'new@test.local')).get();assert.notEqual(u.password,'Employee123!');assert.ok(await verifyPassword('Employee123!',u.password));
 const logout=await auth.POST(request('POST',{action:'logout'},token,'http://localhost/api/auth'));assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);assert.match(logout.headers.get('set-cookie'),/HttpOnly/i);
});
test('Public menu exposes no sales or costs and orders use server prices',async()=>{
 const menu=require('../app/api/menu/route.ts');const order=require('../app/api/public-orders/route.ts');
 const d=await (await menu.GET(request('GET',null,null,`http://localhost/api/menu?branch=${admin.branch}`))).json();assert.ok(!d.sales);assert.ok(d.products.every(p=>!('cost'in p)&&!('tenantId'in p)));assert.equal(d.products.length,2);
 const b={id:crypto.randomUUID(),branch:admin.branch,items:[{id:product.id,qty:1,price:1}],expectedTotal:1,orderType:'table',table_num:'1'};
 assert.equal((await order.POST(request('POST',b,null,'http://localhost/api/public-orders'))).status,409);
 b.expectedTotal=1000;assert.equal((await order.POST(request('POST',b,null,'http://localhost/api/public-orders'))).status,200);assert.equal((await order.POST(request('POST',b,null,'http://localhost/api/public-orders'))).status,200);
 assert.equal((await db.select().from(schema.tickets).where(eq(schema.tickets.id,b.id))).length,1);
});
test('Deactivated sessions and cross-origin mutations are rejected',async()=>{
 const req=request('POST',sale());req.headers.set('origin','https://foreign.example');assert.equal((await records.POST(req)).status,403);
 await db.update(schema.users).set({active:0}).where(eq(schema.users.id,cashier.userId));assert.equal((await post(sale(),await createToken(cashier))).status,401);
});
test('Parallel sales cannot consume the last unit twice',async()=>{
 await db.update(schema.products).set({stock:1}).where(eq(schema.products.id,product.id));
 const result=await Promise.allSettled([checkout(admin,sale()),checkout(admin,sale())]);assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.equal(await stock(),0);
});
test('Backup export is complete and imports reject a foreign tenant',async()=>{
 const {exportBackup,importBackup}=require('../lib/backup.ts');
 const backup=await exportBackup(admin);assert.equal(backup.tenantId,admin.tenantId);assert.ok(!backup.users);assert.ok(backup.sales.some(s=>s.cancelledAt));
 assert.equal((await importBackup(admin,backup)).imported,0);
 await assert.rejects(()=>importBackup(other,backup),/outro estabelecimento/);
 const invalid={...backup,products:[{...backup.products[0],id:crypto.randomUUID(),name:'Rollback product'}],sales:[{...backup.sales[0],id:crypto.randomUUID(),total:123}],expenses:[]};
 await assert.rejects(()=>importBackup(admin,invalid));
 assert.equal((await db.select().from(schema.products).where(eq(schema.products.name,'Rollback product'))).length,0);
});
test('Reports escape HTML and spreadsheets neutralize formulas',()=>{
 const {escapeHtml,csvCell}=require('../lib/format.ts');
 assert.equal(escapeHtml('<img src=x onerror="alert(1)">'),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
 assert.equal(csvCell('=1+1'),'"\'=1+1"');assert.equal(csvCell('A "B"'),'"A ""B"""');
});
test('Services enforce administrator rights and server prices',async()=>{
 const services=require('../app/api/services/route.ts');
 await db.update(schema.users).set({active:1}).where(eq(schema.users.id,cashier.userId));
 const c=await createToken(cashier);
 assert.equal((await services.POST(request('POST',{action:'create-table',number:1},c))).status,403);
 assert.equal((await services.POST(request('POST',{action:'update-ticket',id:crypto.randomUUID(),status:'arbitrary'}))).status,400);
 const result=await services.POST(request('POST',{action:'create-ticket',items:[{id:second.id,qty:1,price:1}],total:1}));assert.equal(result.status,200);
 const {id}=await result.json();assert.equal((await db.select().from(schema.tickets).where(eq(schema.tickets.id,id)).get()).total,500);
});
test('Origin checks support the browser host behind the Next.js local server',()=>{
 const {checkOrigin}=require('../lib/session.ts');
 assert.doesNotThrow(()=>checkOrigin(new Request('http://localhost:3100/api/auth',{headers:{host:'127.0.0.1:3100',origin:'http://127.0.0.1:3100'}})));
 assert.throws(()=>checkOrigin(new Request('http://localhost:3100/api/auth',{headers:{host:'127.0.0.1:3100',origin:'https://attacker.example'}})),/Origem/);
});
