import {createRequire} from 'node:module';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const require=createRequire(import.meta.url);
let cli;
try{cli=path.join(path.dirname(require.resolve('playwright/package.json')),'cli.js');}
catch{console.error('Playwright is missing. Run npm ci before setup:browser.');process.exit(1);}
const args=['install',...(process.env.ILAW_SKIP_BROWSER_OS_DEPS==='true'?[]:['--with-deps']),'chromium'];
const result=spawnSync(process.execPath,[cli,...args],{stdio:'inherit'});
if(result.error)console.error(`Browser setup failed: ${result.error.message}`);
process.exitCode=result.status??1;
