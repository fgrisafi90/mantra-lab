const TZ='Europe/Rome';
function dateKey(input){
  const d=new Date(input);
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const o=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  return `${o.year}-${o.month}-${o.day}`;
}
function plusDays(key,days){
  const [y,m,d]=key.split('-').map(Number);
  const dt=new Date(Date.UTC(y,m-1,d+days,12));
  return dt.toISOString().slice(0,10);
}

export function shouldRefreshMatchday({now,fixtures,lastRefreshAt=null}){
  if(!Array.isArray(fixtures)||fixtures.length===0) return false;
  const unplayed=fixtures.filter(f=>!f.played);
  if(unplayed.length===0) return false;
  const allDates=fixtures.map(f=>dateKey(f.kickoff)).sort();
  const firstDate=allDates[0];
  const lastDate=allDates.at(-1);
  const today=dateKey(now);
  if(lastRefreshAt && dateKey(lastRefreshAt)===today) return false;
  if(today===plusDays(firstDate,-1)) return true;
  if(today>firstDate && today<=lastDate) return true;
  return false;
}
