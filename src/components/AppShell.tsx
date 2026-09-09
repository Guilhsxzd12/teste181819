import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

function Icon({name}:{name:"library"|"kindle"|"help"|"admin"|"search"}){
  const common={width:20,height:20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.9,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true};
  if(name==="library")return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16"/><path d="M8 7h8M8 11h7"/></svg>;
  if(name==="kindle")return <svg {...common}><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M9 6.5h6M12 10v6m0 0-2.5-2.5M12 16l2.5-2.5"/></svg>;
  if(name==="help")return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 1 1 3.7 2c-.9.6-1.4 1.1-1.4 2M12 17h.01"/></svg>;
  if(name==="admin")return <svg {...common}><path d="M12 3 4.5 6v5.7c0 4.6 3.2 7.8 7.5 9.3 4.3-1.5 7.5-4.7 7.5-9.3V6z"/><path d="M9.5 12 11 13.5l3.5-4"/></svg>;
  return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
}

function TelegramIcon(){return <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21.2 3.6 18 19.1c-.2 1.1-.9 1.4-1.8.9l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9-8.1c.4-.4-.1-.6-.6-.2L5.6 12.8.8 11.3c-1-.3-1-1 .2-1.5L19.8 2.6c.9-.3 1.6.2 1.4 1Z" fill="currentColor"/></svg>}

export async function AppShell({children}:{children:React.ReactNode}){
  const {profile}=await getViewer();const admin=profile?.role==="admin";
  return <div className="app-shell">
    <header className="app-header"><div className="header-inner">
      <Link className="brand" href="/biblioteca"><span className="brand-mark">K</span><span className="brand-copy">KINDLE <b>BOOK</b></span></Link>
      <nav className="desktop-nav"><Link href="/biblioteca">Biblioteca</Link><Link href="/kindle">Enviar ao Kindle</Link><Link href="/ajuda">Ajuda</Link>{admin&&<Link href="/admin">Admin</Link>}</nav>
      <form className="header-search" action="/biblioteca" method="get"><Icon name="search"/><input name="q" placeholder="Busque por título ou autor" aria-label="Pesquisar livros"/><button type="submit">Buscar</button></form>
      <Link className="header-icon-link" href="/ajuda" aria-label="Precisa de ajuda?" title="Precisa de ajuda?"><Icon name="help"/></Link>
      {admin&&<div className="user-pill"><span>{profile?.full_name||profile?.email}</span><SignOutButton/></div>}
    </div></header>
    {children}
    <a href="https://t.me/kindlebookadm" target="_blank" rel="noreferrer" aria-label="Falar com @kindlebookadm no Telegram" title="@kindlebookadm" style={{position:"fixed",right:20,bottom:84,zIndex:70,width:56,height:56,borderRadius:"50%",display:"grid",placeItems:"center",background:"#229ED9",color:"#fff",boxShadow:"0 12px 28px rgba(0,0,0,.2)"}}><TelegramIcon/></a>
    <nav className={`mobile-bottom-nav ${admin?"has-admin":"public-nav"}`} aria-label="Navegação principal">
      <Link href="/biblioteca"><Icon name="library"/><span>Biblioteca</span></Link><Link href="/kindle"><Icon name="kindle"/><span>Enviar ao Kindle</span></Link><Link href="/ajuda"><Icon name="help"/><span>Ajuda</span></Link>{admin&&<Link href="/admin"><Icon name="admin"/><span>Admin</span></Link>}
    </nav>
  </div>;
}
