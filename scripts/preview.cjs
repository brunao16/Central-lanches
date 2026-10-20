const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const config = JSON.parse(fs.readFileSync(path.resolve('work/preview-db.json'),'utf8'));
const env = { ...process.env, TURSO_DATABASE_URL:'file:'+config.path.replaceAll('\\','/'), TURSO_AUTH_TOKEN:'', JWT_SECRET:'local-preview-only-secret-not-for-production-123456789', NEXT_DIST_DIR:process.env.NEXT_DIST_DIR || '.next', NEXT_TELEMETRY_DISABLED:'1' };
const mode=process.argv[2]||'dev';
const args=mode==='build'?['build']: [mode,'--hostname','127.0.0.1','--port','3100'];
const child=spawn(process.execPath,[require.resolve('next/dist/bin/next'),...args],{env,stdio:'inherit',windowsHide:true});
child.on('exit',code=>process.exit(code||0));
