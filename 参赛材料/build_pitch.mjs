import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(here, '楠溪智游-路演稿.pptx');
const qa = path.join(here, 'qa_pptx');
await fs.mkdir(qa, { recursive: true });

const deck = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const C = { ink: '#152C2B', dark: '#0D3B34', green: '#277A56', muted: '#53635F', pale: '#EEF7F1', line: '#C9D8D0', orange: '#E69A45' };
const font = 'Microsoft YaHei';

function box(slide, name, x, y, w, h, fill, border='none') {
  return slide.shapes.add({ geometry: 'rect', name, position: { left:x, top:y, width:w, height:h }, fill,
    line: { style:'solid', fill:border, width:border==='none'?0:1 } });
}
function txt(slide, name, value, x, y, w, h, size=24, color=C.ink, bold=false, align='left') {
  const s = slide.shapes.add({ geometry:'textbox', name, position:{left:x,top:y,width:w,height:h}, fill:'none', line:{style:'solid',fill:'none',width:0} });
  s.text = value;
  s.text.style = { typeface:font, fontSize:size, color, bold, alignment:align, verticalAlignment:'middle', autoFit:'shrinkText', wrap:'square', insets:{left:0,right:0,top:0,bottom:0} };
  return s;
}
function rule(slide, x, y, w, color=C.line) { box(slide, '分隔线', x,y,w,2,color); }
function base(title, n) {
  const slide = deck.slides.add(); slide.background.fill = '#FFFFFF';
  txt(slide,'页眉','楠溪智游  /  赛道一 · 命题二',60,30,700,25,16,C.green,true);
  txt(slide,'页码',String(n).padStart(2,'0'),1180,30,40,25,16,C.muted,false,'right');
  txt(slide,'标题',title,60,85,1160,92,40,C.ink,true);
  rule(slide,60,181,1160);
  return slide;
}
function notes(slide, lines, sources) {
  slide.speakerNotes.textFrame.setText(`${lines}\n\n[Sources]\n${sources.join('\n')}\n[/Sources]`);
}
async function imageBytes(rel) { const b=await fs.readFile(path.join(root,rel)); return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength); }
async function addImage(slide, rel, name, x,y,w,h,fit='contain') {
  slide.images.add({ blob:await imageBytes(rel), contentType:'image/png', alt:name, fit, position:{left:x,top:y,width:w,height:h} });
}

// Codex Grid cover-image-field silhouette, adapted to project evidence.
{
  const s=deck.slides.add(); s.background.fill='#FFFFFF';
  txt(s,'赛事','2026 首届“永嘉农商杯”AI＋OPC 创新创业大赛',60,34,1030,36,20,C.green,true);
  txt(s,'主标题','楠溪智游',60,168,550,96,72,C.ink,true);
  txt(s,'副标题','楠溪江动态行程\n决策智能体',60,285,560,150,46,C.ink,true);
  txt(s,'一句话','让一条行程能规划、能检查，也能随变化继续走下去。',60,495,500,95,23,C.muted);
  txt(s,'赛道','赛道一 · AI Agent × 永嘉特色产业 · 文旅智能导览',60,635,1050,30,17,C.green,true);
  await addImage(s,'artifacts/ui/01-builder.png','楠溪智游创建行程页',665,113,555,480,'cover');
  notes(s,'开场：家庭游客面对的不只是选景点，而是多条件下持续做决定。',[
    '大赛赛道说明：https://www.kdocs.cn/l/crAjwHTDW2VE',
    '产品截图：本项目 artifacts/ui/01-builder.png（演示版界面）'
  ]);
}

// Sparse dominant-statement silhouette (Codex Grid slide-02).
{
  const s=base('问题不是缺少景点，而是缺少可执行的决策',2);
  txt(s,'大观点','老人儿童体力、天气、路程、预算，必须一起算。',60,235,1080,155,48,C.ink,true);
  txt(s,'问题一','出发前：信息分散，路线容易折返。',60,455,570,48,24,C.muted);
  txt(s,'问题二','出发后：下雨或闭园，整条计划被打乱。',60,515,740,48,24,C.muted);
  txt(s,'问题性质','目标用户与痛点为产品假设，等待真实游客试点验证。',60,640,940,28,16,C.muted);
  notes(s,'这一页强调需求假设，不宣称已经做了正式市场调研。',[
    '大赛赛道说明文旅智能导览方向：https://www.kdocs.cn/l/crAjwHTDW2VE',
    '产品假设：本项目参赛申报书第二节'
  ]);
}

// Four-field editorial process silhouette (Codex Grid slide-13), simplified to a six-step chain.
{
  const s=base('Agent 不写一段建议，而是完成六步工具闭环',3);
  const items=[
    ['01','理解约束','AI 解析偏好与步行强度'],
    ['02','查询天气','实时天气；失败时明示回退'],
    ['03','筛选景点','永嘉点位库和适宜性过滤'],
    ['04','估算路线','按坐标估算顺序与距离'],
    ['05','核算预算','按同行人和节点费用计算'],
    ['06','检查风险','开放、天气、体力与预算'],
  ];
  items.forEach((it,i)=>{
    const col=i%3,row=Math.floor(i/3),x=60+col*398,y=230+row*175;
    txt(s,`序号${i}`,it[0],x,y,75,45,30,C.green,true);
    txt(s,`步骤${i}`,it[1],x+75,y,270,45,28,C.ink,true);
    rule(s,x,y+56,340);
    txt(s,`说明${i}`,it[2],x,y+69,345,70,19,C.muted);
  });
  notes(s,'模型负责需求解析；预算、路线、检查由工具和规则完成。工具轨迹中的展示耗时尚非生产级真实性能计量。',[
    '项目源码：src/agent/planner.ts；netlify/functions/plan.ts；src/tools/',
    '项目在线版：https://naxi-travel-ai.netlify.app'
  ]);
}

// Evidence-plus-interpretation layout, screenshot is the primary evidence.
{
  const s=base('结果集中呈现：路线、时间、预算、风险与执行轨迹',4);
  await addImage(s,'artifacts/ui/02-cockpit.png','行程驾驶舱截图',60,205,835,455,'contain');
  rule(s,922,221,2);
  txt(s,'驾驶舱说明','一屏可核查',947,230,265,42,28,C.ink,true);
  txt(s,'可见内容','逐站时间轴\n路线示意\n预算拆分\nAgent 工具轨迹',947,300,260,208,23,C.muted);
  txt(s,'截图口径','截图为规则演示模式；线上版已接入 AI 约束解析。',947,560,250,90,17,C.muted);
  notes(s,'指向路线、预算和右侧工具轨迹。注意此截图创建于 AI Gateway 开启前，界面标记为规则演示解析，线上实时演示应以当前页面为准。',[
    '产品截图：本项目 artifacts/ui/02-cockpit.png',
    '项目在线版：https://naxi-travel-ai.netlify.app'
  ]);
}

// Replanning evidence layout, reversed image/text balance.
{
  const s=base('途中下雨后，只修改还没发生的行程',5);
  txt(s,'原则','已完成节点锁定',60,250,360,50,32,C.green,true);
  txt(s,'解释','上午的行程保留；\n后续户外节点替换；\n路线与预算同步重算。',60,327,340,184,24,C.ink);
  txt(s,'风险标记','阵雨为可复现演示情境，\n不冒充当天实时天气。',60,562,340,66,17,C.muted);
  await addImage(s,'artifacts/ui/03-rain-replan.png','午后阵雨局部重排截图',440,210,780,445,'contain');
  notes(s,'点击“情况有变，重新规划”，触发午后阵雨。强调已完成节点不可改写，这是核心创新。',[
    '产品截图：本项目 artifacts/ui/03-rain-replan.png',
    '项目源码：src/agent/replanner.ts'
  ]);
}

// Four-field layout for concrete differentiation.
{
  const s=base('可信边界清楚，才有机会真正落地',6);
  const cells=[
    ['模型做理解','不让模型直接决定预算、开放与安全'],
    ['工具做执行','天气、点位、路线、费用逐步计算'],
    ['规则做兜底','服务异常时明确降级和风险提示'],
    ['结果可带走','中文 PDF、ICS 日历、脱敏云端分享'],
  ];
  cells.forEach((v,i)=>{const x=60+(i%2)*590,y=230+Math.floor(i/2)*188;
    txt(s,`边界标题${i}`,v[0],x,y,510,52,30,C.green,true); rule(s,x,y+62,490);
    txt(s,`边界正文${i}`,v[1],x,y+77,515,92,21,C.ink);
  });
  notes(s,'不把现有坐标估算说成实时地图导航，也不宣称已接入支付或预订。',[
    '项目源码：src/agent/；src/tools/；src/services/export.ts；netlify/functions/',
    '项目说明：README.md'
  ]);
}

// Metric-led grid silhouette, only development evidence metrics.
{
  const s=base('当前已是可公开体验的产品，而非概念图',7);
  const proof=[['27','永嘉相关点位记录'],['35','单元与组件测试'],['1','公网可体验 MVP']];
  proof.forEach((p,i)=>{const x=60+i*400;
    txt(s,`数字${i}`,p[0],x,245,345,150,89,C.green,true);
    rule(s,x,407,345);
    txt(s,`指标${i}`,p[1],x,430,345,75,24,C.ink,true);
  });
  txt(s,'补充','另有 2 条本地浏览器流程、1 条公网浏览器流程。上述为开发验证结果，不是用户数或收入。',60,576,1140,65,19,C.muted);
  notes(s,'所有数量为 2026-09-12 开发记录，提交前应重新运行验证。',[
    '项目源码：src/data/pois.ts；tests/；README.md',
    '项目验证记录：docs/demo-checklist.md',
    '在线体验：https://naxi-travel-ai.netlify.app'
  ]);
}

// Codex Grid three-stage timeline silhouette.
{
  const s=base('从游客 MVP，走向可运营的县域文旅工具',8);
  const phases=[
    ['现在','游客侧 MVP','在线生成、重排、导出'],
    ['0—3 个月','真实游客试点','核查可执行性与反馈'],
    ['3—12 个月','运营侧产品','授权内容维护、路线配置'],
  ];
  rule(s,65,335,1120,C.green);
  phases.forEach((p,i)=>{const x=60+i*400;
    box(s,`节点${i}`,x,329,14,14,C.green);
    txt(s,`时期${i}`,p[0],x,245,350,55,26,C.green,true);
    txt(s,`阶段${i}`,p[1],x,385,350,55,29,C.ink,true);
    txt(s,`任务${i}`,p[2],x,455,345,92,21,C.muted);
  });
  txt(s,'商业口径','景区/乡村运营方 SaaS 为探索方向，当前暂无签约客户与收入。',60,610,1130,45,18,C.muted);
  notes(s,'OPC 轻量路径：公开资料起步，个人主创与 AI 辅助研发，先以真实试点验证再谈收费。',[
    '项目商业规划：参赛申报书第八至九节',
    '大赛 OPC 与永嘉特色产业方向：https://www.kdocs.cn/l/crAjwHTDW2VE'
  ]);
}

// Sparse close, not a generic thank-you slide.
{
  const s=deck.slides.add(); s.background.fill='#FFFFFF';
  txt(s,'收束','让楠溪江行程，真正跟得上变化。',60,150,1140,185,52,C.ink,true);
  rule(s,60,396,1120,C.green);
  txt(s,'呼吁','寻找真实游客与文旅场景试点，验证行程可执行性。',60,431,1090,90,29,C.green,true);
  txt(s,'网址','naxi-travel-ai.netlify.app',60,585,900,54,30,C.ink);
  txt(s,'赛道','赛道一 · 命题二 · 楠溪智游',60,650,600,30,16,C.muted);
  notes(s,'结束时打开网址交给评委体验。',[
    '在线作品：https://naxi-travel-ai.netlify.app',
    '大赛赛道说明：https://www.kdocs.cn/l/crAjwHTDW2VE'
  ]);
}

for (const [index, slide] of deck.slides.items.entries()) {
  const png=await deck.export({slide,format:'png',scale:1});
  await fs.writeFile(path.join(qa,`slide-${String(index+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
  const layout=await slide.export({format:'layout'});
  await fs.writeFile(path.join(qa,`slide-${String(index+1).padStart(2,'0')}.json`),await layout.text());
}
const pptx=await PresentationFile.exportPptx(deck);
await pptx.save(out);
console.log(out);
