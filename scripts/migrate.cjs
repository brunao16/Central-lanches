require('./register.cjs');
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@libsql/client');
const { getTableConfig } = require('drizzle-orm/sqlite-core');
const schema = require('../db/schema.ts');

const quote = s => '"' + s.replaceAll('"','""') + '"';
const literal = v => typeof v === 'number' ? String(v) : "'" + String(v).replaceAll("'","''") + "'";

function createSql(config, name) {
  const columns = config.columns.map(c => `${quote(c.name)} ${c.getSQLType()}${c.primary ? ' PRIMARY KEY' : ''}${c.notNull ? ' NOT NULL' : ''}${c.isUnique ? ' UNIQUE' : ''}${c.default !== undefined ? ' DEFAULT ' + literal(c.default) : ''}`);
  for (const key of config.primaryKeys) columns.push(`PRIMARY KEY (${key.columns.map(c=>quote(c.name)).join(',')})`);
  return `CREATE TABLE ${quote(name)} (${columns.join(',')})`;
}
async function migrateLocked(client, { owner, backupDir, checkOnly = false } = {}) {
  const configs = Object.values(schema).map(getTableConfig);
  const existingNames = (await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")).rows.map(r=>r.name);
  const snapshot = {};
  for (const c of configs) if (existingNames.includes(c.name)) snapshot[c.name] = (await client.execute(`SELECT * FROM ${quote(c.name)}`)).rows.map(r=>Object.fromEntries(Object.entries(r)));
  if (checkOnly) return Object.fromEntries(configs.map(c=>[c.name,{ rows:snapshot[c.name]?.length||0, missing:!existingNames.includes(c.name), missingColumns:c.columns.filter(col=>snapshot[c.name]?.length && !(col.name in snapshot[c.name][0])).map(col=>col.name) }]));
  const admins = [...new Set((snapshot.users||[]).filter(u=>u.role==='admin' && u.active===1).map(u=>u.tenant_id || u.branch))];
  const legacyRows = Object.values(snapshot).flat().some(r=>!r.tenant_id);
  const legacyOwner = owner || (admins.length === 1 ? admins[0] : undefined);
  if (legacyRows && !legacyOwner) throw new Error('Legacy ownership is ambiguous. Provide an explicit reviewed LEGACY_TENANT_ID before migrating.');
  const unknownColumns = [];
  for (const c of configs) if(existingNames.includes(c.name)) {
    const columns = (await client.execute(`PRAGMA table_info(${quote(c.name)})`)).rows;
    for(const col of columns) if(!c.columns.some(x=>x.name===col.name)) unknownColumns.push(`${c.name}.${col.name}`);
  }
  if(unknownColumns.length) throw new Error('Unmapped existing columns; migration stopped to preserve data: ' + unknownColumns.join(', '));
  if(Object.keys(snapshot).length) {
    if(!backupDir) throw new Error('A backup directory is required for an existing database.');
    fs.mkdirSync(backupDir,{recursive:true});
    fs.writeFileSync(path.join(backupDir,`before-migration-${Date.now()}.json`),JSON.stringify(snapshot,(_,v)=>typeof v==='bigint'?String(v):v,2),{flag:'wx'});
  }
  const bcrypt = require('bcryptjs');
  // Hash legacy employee passwords before writing them to the migrated table.
  for(const u of snapshot.users||[]) if(!/^\$2[aby]\$/.test(u.password)) u.password=await bcrypt.hash(u.password,12);
  const tx = client;
    for(const c of configs) {
      const temp = `migration_${c.name}`;
      await tx.execute(createSql(c,temp));
      for(const row of snapshot[c.name]||[]) {
        row.tenant_id ||= legacyOwner;
        const cols=c.columns.filter(col=>row[col.name]!==undefined);
        await tx.execute({sql:`INSERT INTO ${quote(temp)} (${cols.map(col=>quote(col.name)).join(',')}) VALUES (${cols.map(()=>'?').join(',')})`,args:cols.map(col=>row[col.name])});
      }
      if(existingNames.includes(c.name)) await tx.execute(`DROP TABLE ${quote(c.name)}`);
      await tx.execute(`ALTER TABLE ${quote(temp)} RENAME TO ${quote(c.name)}`);
      await tx.execute(`CREATE INDEX ${quote(c.name+'_tenant_idx')} ON ${quote(c.name)} (tenant_id)`);
      for(const index of c.indexes) await tx.execute(`CREATE ${index.config.unique?'UNIQUE ':''}INDEX ${quote(index.config.name)} ON ${quote(c.name)} (${index.config.columns.map(col=>quote(col.name)).join(',')})`);
    }
  return { migrated:configs.length };
}
async function migrate(client, options = {}) {
  if (options.checkOnly) return migrateLocked(client, options);
  // Lock writes before taking the backup, so no sale can be lost between
  // reading the old tables and replacing them with the migrated tables.
  const tx = await client.transaction('write');
  try {
    const result = await migrateLocked(tx, options);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally { tx.close(); }
}
module.exports = { migrate };
if(require.main===module) {
  require('@next/env').loadEnvConfig(process.cwd());
  if(!process.env.TURSO_DATABASE_URL) throw new Error('TURSO_DATABASE_URL is required');
  const client=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
  migrate(client,{owner:process.env.LEGACY_TENANT_ID,backupDir:path.resolve('work/database-backups'),checkOnly:!process.argv.includes('--apply')})
    .then(result=>console.log(JSON.stringify(result,null,2)))
    .catch(error=>{console.error(error.code || error.message.replace(/https?:\/\/\S+/g,'[database]'));process.exitCode=1;})
    .finally(()=>client.close());
}

