import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const srt = await fs.readFile(path.resolve(here, '..', '演示字幕-v1.srt'), 'utf8');
const cues = srt.trim().split(/\r?\n\s*\r?\n/).map((block) => {
  const [id, time, ...text] = block.split(/\r?\n/);
  const [from, to] = time.split(' --> ');
  const seconds = (stamp) => { const [hh, mm, rest] = stamp.split(':'); const [ss, ms] = rest.split(','); return Number(hh)*3600+Number(mm)*60+Number(ss)+Number(ms)/1000; };
  return { id:Number(id), start:seconds(from), end:seconds(to), text:text.join('\n') };
});

const browser = await chromium.launch({headless:true});
const context = await browser.newContext({
  viewport:{width:1600,height:900},
  locale:'zh-CN',
  acceptDownloads:true,
  recordVideo:{dir:here,size:{width:1280,height:720}},
});
const created=Date.now();
const page=await context.newPage();
let success=false, preroll=0, generatedVideo='';
try {
  await page.goto('https://nanxi-smart-travel.netlify.app',{waitUntil:'domcontentloaded',timeout:30000});
  await page.getByRole('heading',{name:/把复杂的楠溪江行程/}).waitFor({timeout:30000});
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior='smooth';
    const bar=document.createElement('div');
    bar.id='codex-video-caption';
    Object.assign(bar.style,{position:'fixed',left:'50%',bottom:'18px',transform:'translateX(-50%)',width:'min(1240px,86vw)',padding:'13px 22px',background:'rgba(10,52,42,.89)',color:'#fff',fontFamily:'Microsoft YaHei,sans-serif',fontSize:'30px',fontWeight:'600',lineHeight:'1.4',textAlign:'center',whiteSpace:'pre-line',borderRadius:'10px',boxShadow:'0 8px 22px rgba(0,0,0,.16)',zIndex:'2147483647',pointerEvents:'none'});
    document.body.appendChild(bar);
  });
  preroll=(Date.now()-created)/1000;
  const begin=Date.now();
  const waitUntil=async(sec)=>{const remain=begin+sec*1000-Date.now();if(remain>0) await new Promise(r=>setTimeout(r,remain));};
  const caption=async(i)=>{const cue=cues[i-1]; await page.evaluate((t)=>{document.getElementById('codex-video-caption').textContent=t;},cue.text);};

  await caption(1);
  await waitUntil(12); await caption(2);
  await waitUntil(25); await caption(3);
  await page.getByRole('button',{name:'生成行程'}).scrollIntoViewIfNeeded();
  await page.mouse.move(1170,660,{steps:14});
  await waitUntil(38); await caption(4);
  await waitUntil(43); await page.getByRole('button',{name:'生成行程'}).click();
  await page.getByRole('heading',{name:'楠溪江山水人文一日线'}).waitFor({timeout:30000});
  const aiVisible=await page.getByText(/AI 约束解析|AI 理解旅行约束/).count();
  if(!aiVisible) throw new Error('线上未显示 AI 解析，停止录制以免叙述失实');
  await waitUntil(50); await caption(5);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));
  await waitUntil(63); await caption(6);
  await page.getByTestId('tool-trace').last().scrollIntoViewIfNeeded();
  await waitUntil(77); await caption(7);
  await page.getByLabel('行程时间轴').scrollIntoViewIfNeeded();
  await waitUntil(91); await page.getByRole('button',{name:'情况有变，重新规划'}).scrollIntoViewIfNeeded();
  await waitUntil(95); await caption(8); await page.getByRole('button',{name:'情况有变，重新规划'}).click();
  await page.locator('.scenario-head span').getByText('演示情境',{exact:true}).waitFor({timeout:5000});
  await waitUntil(101); await page.getByRole('button',{name:'触发午后阵雨'}).click();
  await page.getByText('已完成 · 保留').waitFor({timeout:15000});
  await waitUntil(108); await caption(9);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));
  await waitUntil(125); await caption(10);
  await page.getByLabel('行程时间轴').scrollIntoViewIfNeeded();
  await waitUntil(145); await caption(11);
  const pdf=page.waitForEvent('download',{timeout:15000});
  await page.getByRole('button',{name:'导出 PDF'}).click();
  await pdf;
  await waitUntil(155);
  const ics=page.waitForEvent('download',{timeout:10000});
  await page.getByRole('button',{name:'添加到日历'}).click();
  await ics;
  await waitUntil(165); await caption(12);
  await page.getByRole('button',{name:'分享行程'}).click();
  await page.getByRole('status').waitFor({timeout:15000});
  await waitUntil(170); await caption(13);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));
  await waitUntil(180);
  success=true;
} catch(err) {
  console.error('RECORDER_ERROR',err?.stack??String(err));
} finally {
  generatedVideo=await page.video().path();
  await context.close();
  await browser.close();
  await fs.writeFile(path.join(here,'recording-result.json'),JSON.stringify({success,preroll,video:generatedVideo},null,2));
  console.log(JSON.stringify({success,preroll,video:generatedVideo}));
}
if(!success) process.exitCode=1;
