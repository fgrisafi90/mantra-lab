function esc(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function initials(name=''){const parts=String(name).trim().split(/\s+/).filter(Boolean);return (parts.length>1?parts.slice(0,2).map(x=>x[0]).join(''):parts[0]?.[0]||'?').toUpperCase();}
export function renderPlayerAvatar({name='',avatarUrl=null,size='sm'}={}){
  const init=initials(name);
  return `<span class="player-avatar player-avatar--${esc(size)}" data-avatar-fallback="${esc(init)}">${avatarUrl?`<img data-avatar-img loading="lazy" referrerpolicy="no-referrer" src="${esc(avatarUrl)}" alt="${esc(name)}">`:''}<span class="player-avatar__fallback">${esc(init)}</span></span>`;
}
