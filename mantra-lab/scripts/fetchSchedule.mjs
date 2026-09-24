import { readFile } from 'node:fs/promises';

export async function fetchSchedule(){
  try{
    const data=JSON.parse(await readFile('src/data/generated/current-matchday.json','utf8'));
    return Array.isArray(data.fixtures)?data.fixtures:[];
  }catch{return [];}
}
