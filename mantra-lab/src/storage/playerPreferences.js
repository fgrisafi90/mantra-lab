import {validPreference} from '../domain/playerTiers.js';
const KEY='mantra-lab:player-preferences:v1';
export function loadPlayerPreferences(storage=globalThis.localStorage){
  try{
    const parsed=JSON.parse(storage?.getItem(KEY)||'{}');
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return {};
    return Object.fromEntries(Object.entries(parsed).filter(([key,value])=>/^(fc:|catalog:)/.test(key)&&validPreference(value)));
  }catch{return {};}
}
export function savePlayerPreferences(preferences,storage=globalThis.localStorage){
  if(!preferences||Object.values(preferences).some(p=>!validPreference(p)))throw new Error('Preferenze non valide.');
  storage?.setItem(KEY,JSON.stringify(preferences));
}
