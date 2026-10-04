import {criteria} from './method.js';
export const defaultBands=[{min:0,label:"Peu d’affinités"},{min:40,label:'Neutre'},{min:60,label:'À suivre'},{min:75,label:'Très intéressant'},{min:85,label:'Top'}];
export const initial=()=>({version:1,weights:criteria.map(c=>c.weight),bands:structuredClone(defaultBands),people:[]});
export function score(answers,weights){
 const notes=criteria.map((_,i)=>{const v=answers.slice(i*10,i*10+10).filter(x=>typeof x==='number');return v.length?v.reduce((a,b)=>a+b,0)/v.length*10:null;});
 const active=notes.reduce((s,n,i)=>s+(n===null?0:weights[i]),0);
 return {notes,total:active?notes.reduce((s,n,i)=>s+(n===null?0:n*weights[i]),0)/active*10:null,coverage:answers.filter(x=>typeof x==='number').length/100};
}
export function category(total,bands){return total===null?'Non évalué':[...bands].reverse().find(b=>total>=b.min).label;}
export function summaries(data){
 const list=data.people.map((p,index)=>{const history=p.evaluations.map((e,i)=>({...score(e.answers,data.weights),e,number:i+1}));const rated=history.filter(x=>x.total!==null);const latest=rated.at(-1);return {p,index,history,latest,count:rated.length,delta:rated.length>1?latest.total-rated.at(-2).total:null};});
 for(const x of list)x.rank=x.latest?1+list.filter(y=>y.latest&&y.latest.total>x.latest.total).length:null;
 return list.sort((a,b)=>(b.latest?.total??-1)-(a.latest?.total??-1)||a.index-b.index);
}
export function validate(data){
 const fail=()=>{throw Error('Sauvegarde invalide ou incompatible. Les données actuelles sont conservées.');};
 if(!data||data.version!==1||!Array.isArray(data.weights)||data.weights.length!==10||data.weights.some(x=>!Number.isFinite(x)||x<0||x>100)||!data.weights.some(x=>x>0))fail();
 if(!Array.isArray(data.bands)||data.bands.length!==5||data.bands[0].min!==0||data.bands.some((b,i)=>!b||!Number.isFinite(b.min)||b.min<0||b.min>100||(i&&b.min<=data.bands[i-1].min)||typeof b.label!=='string'||!b.label.trim()||b.label.length>80))fail();
 if(!Array.isArray(data.people)||data.people.length>10000)fail();const ids=new Set();
 for(const p of data.people){if(!p||typeof p.id!=='string'||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>120||!Array.isArray(p.evaluations)||p.evaluations.length>10000)fail();ids.add(p.id);const ei=new Set();
  for(const e of p.evaluations){if(!e||typeof e.id!=='string'||ei.has(e.id)||typeof e.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||!Number.isFinite(Date.parse(e.date))||!(e.spontaneous===null||Number.isInteger(e.spontaneous)&&e.spontaneous>0)||typeof e.plus!=='string'||typeof e.minus!=='string'||e.plus.length>5000||e.minus.length>5000||!Array.isArray(e.answers)||e.answers.length!==100||e.answers.some(x=>![null,0,0.5,1].includes(x)))fail();ei.add(e.id);}
 }return data;
}
