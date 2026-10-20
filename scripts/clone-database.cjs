require('./register.cjs');
require('@next/env').loadEnvConfig(process.cwd());
const { createClient } = require('@libsql/client');
const { migrate } = require('./migrate.cjs');
const path = require('node:path'), fs = require('node:fs');
const quote = s => '"'+s.replaceAll('"','""')+'"';
(async()=>{
  const root=path.resolve('work');fs.mkdirSync(root,{recursive:true});
  const source=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
  const targetPath=path.join(root,`migration-preview-${Date.now()}.db`);
  const target=createClient({url:'file:'+targetPath.replaceAll('\\','/')});
  try {
    const read=await source.transaction('read');
    try {
      const tables=(await read.execute("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")).rows;
      for(const table of tables){
        await target.execute(table.sql);
        const rows=(await read.execute(`SELECT * FROM ${quote(table.name)}`)).rows;
        for(const row of rows){const cols=Object.keys(row);await target.execute({sql:`INSERT INTO ${quote(table.name)} (${cols.map(quote).join(',')}) VALUES (${cols.map(()=>'?').join(',')})`,args:cols.map(k=>row[k])});}
      }
    } finally {await read.rollback();read.close();}
    await migrate(target,{owner:'principal',backupDir:path.join(root,'database-backups')});
    const counts={};for(const name of ['products','sales','expenses','users','branches']) counts[name]=(await target.execute(`SELECT count(*) AS count FROM ${quote(name)} WHERE tenant_id='principal'`)).rows[0].count;
    fs.writeFileSync(path.join(root,'preview-db.json'),JSON.stringify({path:targetPath,counts},null,2));
    console.log('Local migrated copy:',JSON.stringify(counts));
  } finally {source.close();target.close();}
})().catch(e=>{console.error(e.code||e.message);process.exitCode=1;});
