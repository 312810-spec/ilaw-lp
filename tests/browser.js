import fs from 'node:fs/promises';import {createRequire} from 'node:module';import assert from 'node:assert/strict';
import {createApp} from '../src/server.js';import {openDatabase} from '../src/db.js';import {dispatch} from './helpers.js';
const require=createRequire(import.meta.url);const {chromium}=require('playwright');await fs.mkdir('test-results',{recursive:true});
let browser;const database=openDatabase(':memory:');const app=await createApp({database});
try{
 browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-crashpad-for-testing']});
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
 // Use actual request handlers with browser requests, rather than mocking API data.
 await context.route('http://localhost:3000/**',async route=>{const req=route.request();const u=new URL(req.url());const r=await dispatch(app,{url:u.pathname+u.search,method:req.method(),headers:await req.allHeaders(),body:req.postData()||undefined});await route.fulfill({status:r.status,headers:r.headers,body:r.bytes});});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:3000/');
 await page.getByLabel('Display name').fill('Teacher');await page.getByLabel('Email address').fill('browser@example.test');await page.getByLabel('Password',{exact:true}).fill('browser test password 123');await page.getByRole('button',{name:'Create teacher account'}).click();await page.getByRole('heading',{name:'Your lesson workspace'}).waitFor();
 await page.getByRole('button',{name:/Adding unlike fractions/}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('heading',{name:'Choose the learning'}).waitFor();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Create guided draft'}).click();
 await page.getByRole('heading',{name:'I — Intentions'}).waitFor({timeout:20000});await page.getByLabel('Success criterion').fill('Teacher criterion: accurate fractions and justified equal-whole model.');await page.waitForTimeout(1700);await page.getByText('Saved to your workspace',{exact:true}).waitFor();
 await page.getByRole('button',{name:/L Learning Experiences/}).click();await page.getByRole('button',{name:'Low-resource',exact:true}).nth(2).click();await page.getByRole('button',{name:'Revise',exact:true}).click();await page.getByRole('button',{name:/I Intentions/}).click();assert.match(await page.getByLabel('Success criterion').inputValue(),/Teacher criterion/);
 await page.screenshot({path:'test-results/desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,'Unintended horizontal overflow');
 const missingLabels=await page.evaluate(()=>[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(el=>!el.labels?.length&&!el.getAttribute('aria-label')).length);assert.equal(missingLabels,0);
 await page.getByRole('button',{name:'Export',exact:true}).click();const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Download DOCX'}).click()]);await download.saveAs('test-results/browser-export.docx');
 assert.deepEqual(errors,[]);await fs.writeFile('test-results/browser-status.json',JSON.stringify({status:'passed',desktop:'1440×1000',mobile:'390×844',journey:'account, five-step planning, real guided generation, autosave, targeted revision, DOCX download',accessibility:'labels and horizontal overflow only; not full WCAG audit'},null,2));console.log('Browser journey passed.');
}catch(e){await fs.writeFile('test-results/browser-status.json',JSON.stringify({status:'blocked-or-failed',reason:e.message.slice(0,1500)},null,2));console.error('Browser verification did not complete:',e.message.slice(0,400));process.exitCode=1;}
finally{if(browser)await browser.close();database.close();}
