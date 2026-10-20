const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const studentData = [
  {id:"shiroko",name:"砂狼白子",school:"阿拜多斯",role:"输出",form:"常服",rarity:"示例资料",color:"",mark:"白",note:"阿拜多斯学生。可扩展技能、装备与养成资料。"},
  {id:"hoshino",name:"小鸟游星野",school:"阿拜多斯",role:"坦克",form:"常服",rarity:"示例资料",color:"pink",mark:"星",note:"阿拜多斯学生。可扩展个人档案与形态列表。"},
  {id:"nonomi",name:"十六夜野乃美",school:"阿拜多斯",role:"输出",form:"常服",rarity:"示例资料",color:"gold",mark:"乃",note:"阿拜多斯学生。可加入技能说明与培养记录。"},
  {id:"serika",name:"黑见芹香",school:"阿拜多斯",role:"输出",form:"常服",rarity:"示例资料",color:"green",mark:"芹",note:"阿拜多斯学生。可继续扩充不同服装形态。"},
  {id:"arisu",name:"天童爱丽丝",school:"千年",role:"输出",form:"常服",rarity:"示例资料",color:"purple",mark:"爱",note:"千年学生。可加入武器、技能与素材清单。"},
  {id:"mika",name:"圣园未花",school:"三一",role:"输出",form:"常服",rarity:"示例资料",color:"pink",mark:"未",note:"三一学生。可添加专属资料页与收藏标签。"}
];
const schools = {
  "阿拜多斯":{desc:"沙漠中的学园区域。可以在这里整理阿拜多斯学生、故事线索与相关资料。",color:"#e9f6ff"},
  "千年":{desc:"以科技与研究氛围著称的学园。适合归档社团、发明与技术相关设定。",color:"#e8f8f1"},
  "三一":{desc:"拥有独特校园文化与社团关系的学园。可逐步整理学生与剧情资料。",color:"#f3eaff"},
  "格黑娜":{desc:"风格鲜明、社团众多的学园。可建立社团索引和人物关系资料。",color:"#fff0e8"},
  "百鬼夜行":{desc:"具有传统文化与庆典氛围的学园区域。可扩展地点和活动档案。",color:"#fff4d9"}
};
const storage = {
  get(key, fallback){try{const v=localStorage.getItem(key);return v===null?fallback:JSON.parse(v)}catch{return fallback}},
  set(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
};
let saved = storage.get("kh_saved", []);
let goals = storage.get("kh_goals", []);
let currentPage = "home";
let toastTimer;
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2200)}
function go(page){
  currentPage=page;
  $$(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  const active=$(`.nav-item[data-page="${page}"]`);
  $("#pageName").textContent=active?active.textContent.trim():({home:"首页",students:"学生档案",map:"学园地图",story:"剧情档案",planner:"养成规划",collection:"我的收藏",studio:"创作空间"}[page]||"首页");
  $(".sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
  if(page==="collection") renderCollection();
}
function studentCard(s){
  const isSaved=saved.includes(s.id);
  return `<article class="student-card">
    <div class="student-top"><div class="student-avatar ${s.color}">${s.mark}</div><div><div class="student-name">${escapeHtml(s.name)}</div><div class="student-school">${escapeHtml(s.school)} · ${escapeHtml(s.form)}</div></div></div>
    <div class="student-tags"><span class="tag">${escapeHtml(s.role)}</span><span class="tag">${escapeHtml(s.rarity)}</span><span class="tag">资料待扩充</span></div>
    <div class="student-note">${escapeHtml(s.note)}</div>
    <div class="student-actions"><button class="detail-button" data-detail="${s.id}">查看档案 ↗</button><button class="heart-button ${isSaved?"saved":""}" data-save="${s.id}" aria-label="收藏${escapeHtml(s.name)}">${isSaved?"♥":"♡"}</button></div>
  </article>`;
}
function escapeHtml(str){return String(str).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderStudents(){
  const q=$("#studentSearch").value.trim().toLowerCase();
  const school=$("#schoolFilter").value, role=$("#roleFilter").value;
  const list=studentData.filter(s=>(!q||`${s.name} ${s.school} ${s.role} ${s.form}`.toLowerCase().includes(q))&&(school==="全部"||s.school===school)&&(role==="全部"||s.role===role));
  $("#studentGrid").innerHTML=list.map(studentCard).join("");
  $("#studentEmpty").classList.toggle("hidden",list.length>0);
}
function renderCollection(){
  const list=studentData.filter(s=>saved.includes(s.id));
  $("#collectionGrid").innerHTML=list.map(studentCard).join("");
  $("#collectionEmpty").classList.toggle("hidden",list.length>0);
  $("#collectionGrid").classList.toggle("hidden",list.length===0);
  updateStats();
}
function toggleSave(id){
  saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];
  storage.set("kh_saved",saved);
  renderStudents();renderCollection();updateStats();
  const s=studentData.find(x=>x.id===id);
  toast(saved.includes(id)?`已收藏：${s?.name||"学生"}`:"已取消收藏");
}
function updateStats(){
  $("#statStudents").textContent=studentData.length;
  $("#statSaved").textContent=saved.length;
  $("#statGoals").textContent=goals.length;
}
function renderGoals(){
  $("#goalList").innerHTML=goals.map((g,i)=>`<div class="goal-item ${g.done?"done":""}"><input type="checkbox" data-goal="${i}" ${g.done?"checked":""} aria-label="完成目标"><span>${escapeHtml(g.text)}</span><button data-delete-goal="${i}" aria-label="删除目标">×</button></div>`).join("");
  const done=goals.filter(g=>g.done).length, pct=goals.length?Math.round(done/goals.length*100):0;
  $("#goalProgress").textContent=`${pct}%`;$("#goalProgressBar").style.width=`${pct}%`;
  $("#goalSummary").textContent=goals.length?`已完成 ${done} / ${goals.length} 项目标。`:"还没有规划目标，添加第一项吧。";
  updateStats();
}
document.addEventListener("click",e=>{
  const nav=e.target.closest("[data-page]");if(nav){e.preventDefault();go(nav.dataset.page);return}
  const goto=e.target.closest("[data-goto]");if(goto){go(goto.dataset.goto);return}
  const save=e.target.closest("[data-save]");if(save){toggleSave(save.dataset.save);return}
  const detail=e.target.closest("[data-detail]");if(detail){const s=studentData.find(x=>x.id===detail.dataset.detail);if(s)showStudentDetail(s);return}
  const pin=e.target.closest("[data-school]");if(pin){showSchool(pin.dataset.school,pin);return}
  const del=e.target.closest("[data-delete-goal]");if(del){goals.splice(Number(del.dataset.deleteGoal),1);storage.set("kh_goals",goals);renderGoals();toast("目标已删除");return}
  const studio=e.target.closest("[data-studio]");if(studio){toast(`${studio.dataset.studio}：可在此基础上继续扩展`);$("#studioNote").focus();return}
});
function showStudentDetail(s){
  toast(`${s.name} · ${s.school} · ${s.role}。当前为示例档案，可继续补充技能与养成信息。`);
}
function showSchool(name,btn){
  $$(".map-pin").forEach(x=>x.classList.toggle("selected",x===btn));
  const data=schools[name]||{desc:"该学园的资料将在后续版本继续补充。"};
  $("#mapInfo").innerHTML=`<span class="pill">DISTRICT GUIDE</span><h2>${escapeHtml(name)}</h2><p>${escapeHtml(data.desc)}</p><div class="info-rule"></div><small>这里可以继续加入学园介绍、学生列表、社团索引与相关剧情。</small>`;
}
$("#studentSearch").addEventListener("input",renderStudents);
$("#schoolFilter").addEventListener("change",renderStudents);
$("#roleFilter").addEventListener("change",renderStudents);
$("#globalSearch").addEventListener("keydown",e=>{if(e.key==="Enter"){go("students");$("#studentSearch").value=e.target.value;renderStudents()}});
$("#globalSearch").addEventListener("input",e=>{if(e.target.value.trim().length>1){go("students");$("#studentSearch").value=e.target.value;renderStudents()}});
$("#mobileMenu").addEventListener("click",()=>$(".sidebar").classList.toggle("open"));
$("#profileButton").addEventListener("click",()=>go("collection"));
$("#goalForm").addEventListener("submit",e=>{e.preventDefault();const text=$("#goalInput").value.trim();if(!text)return;goals.push({text,done:false});storage.set("kh_goals",goals);$("#goalInput").value="";renderGoals();toast("已添加养成目标")});
$("#goalList").addEventListener("change",e=>{if(e.target.matches("[data-goal]")){goals[Number(e.target.dataset.goal)].done=e.target.checked;storage.set("kh_goals",goals);renderGoals()}});
$("#studioNote").value=storage.get("kh_note","");
$("#studioNote").addEventListener("input",()=>{storage.set("kh_note",$("#studioNote").value);$("#noteStatus").textContent="已自动保存到本设备"});
$("#saveNote").addEventListener("click",()=>{storage.set("kh_note",$("#studioNote").value);$("#noteStatus").textContent="已保存";toast("创作便笺已保存")});
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#globalSearch").focus()}if(e.key==="Escape")$(".sidebar").classList.remove("open")});
renderStudents();renderGoals();renderCollection();updateStats();
