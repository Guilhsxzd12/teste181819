"use client";

import { useMemo,useRef,useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";
import styles from "./CatalogBookActions.module.css";

export type CatalogLanguageOption={
  code:string;
  label:string;
  hasEpub:boolean;
  hasPdf:boolean;
  epubFileId?:string|null;
  pdfFileId?:string|null;
};

type CoverChoice={url:string;label:string;isDefault:boolean};

function fileNameFromHeader(header:string|null,title:string){
  const encoded=header?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if(encoded){try{return decodeURIComponent(encoded);}catch{}}
  const plain=header?.match(/filename="([^"]+)"/i)?.[1];
  return plain||`${title.replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"")||"livro"}-Kindle.epub`;
}

function downloadBlob(blob:Blob,fileName:string){
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=fileName;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}

export function CatalogBookActions({id,title,allowDownload,initialFavorite,languages}:{id:string;title:string;allowDownload:boolean;initialFavorite:boolean;languages:CatalogLanguageOption[]}){
  const initial=languages[0]?.code||"pt";
  const [languageCode,setLanguageCode]=useState(initial);
  const [languagePicker,setLanguagePicker]=useState(false);
  const [coverPicker,setCoverPicker]=useState(false);
  const [covers,setCovers]=useState<CoverChoice[]>([]);
  const [coversLoaded,setCoversLoaded]=useState(false);
  const [coverUrl,setCoverUrl]=useState<string|null>(null);
  const [coverLabel,setCoverLabel]=useState("Capa original");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const coverInput=useRef<HTMLInputElement|null>(null);

  const current=useMemo(()=>languages.find(item=>item.code===languageCode)||languages[0], [languages,languageCode]);

  async function downloadEpub(){
    if(!current?.hasEpub){setMessage(`EPUB indisponível em ${current?.label||"este idioma"}.`);return;}
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/kindle/prepare",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({source:"catalog",id,coverUrl:coverUrl||undefined,languageFileId:current.epubFileId||undefined})
      });
      if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||"Não foi possível preparar o EPUB.");}
      const blob=await response.blob();
      downloadBlob(blob,fileNameFromHeader(response.headers.get("content-disposition"),title));
      setMessage(`EPUB em ${current.label} preparado com ${coverLabel.toLowerCase()}.`);
    }catch(error){setMessage(error instanceof Error?error.message:"Não foi possível preparar o EPUB.");}
    finally{setBusy(false);}
  }

  function openPdf(){
    if(!current?.hasPdf)return;
    const href=current.pdfFileId
      ?`/api/books/${encodeURIComponent(id)}/language-file?fileId=${encodeURIComponent(current.pdfFileId)}`
      :`/api/books/${encodeURIComponent(id)}/file`;
    window.open(href,"_blank","noopener,noreferrer");
  }

  async function openCoverPicker(){
    setMessage("");
    if(!coversLoaded){
      setBusy(true);
      try{
        const response=await fetch(`/api/kindle/covers?source=catalog&id=${encodeURIComponent(id)}`);
        const data=await response.json();
        if(!response.ok)throw new Error(data.error||"Não foi possível carregar as capas.");
        setCovers((data.covers||[]) as CoverChoice[]);
        setCoversLoaded(true);
      }catch(error){setMessage(error instanceof Error?error.message:"Não foi possível carregar as capas.");setBusy(false);return;}
      finally{setBusy(false);}
    }
    setCoverPicker(true);
  }

  function selectCover(url:string|null,label:string){
    setCoverUrl(url);setCoverLabel(label);setCoverPicker(false);
    setMessage(url?`${label} selecionada. A escolha só será aplicada ao EPUB baixado.`:"A capa original será mantida.");
  }

  async function uploadCustomCover(file:File){
    if(!/^image\/(jpeg|png|webp)$/i.test(file.type)){setMessage("Escolha uma capa em JPG, PNG ou WEBP.");return;}
    setBusy(true);setMessage("Enviando a capa...");
    try{
      const form=new FormData();form.append("file",file);
      const response=await fetch("/api/kindle/cover",{method:"POST",body:form});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Não foi possível usar essa capa.");
      setCoverUrl(String(data.coverUrl));setCoverLabel("Capa enviada");setCoverPicker(false);
      setMessage("Capa enviada selecionada. Ela será usada apenas neste EPUB.");
    }catch(error){setMessage(error instanceof Error?error.message:"Não foi possível usar essa capa.");}
    finally{setBusy(false);if(coverInput.current)coverInput.current.value="";}
  }

  return <div className={styles.wrap}>
    <div className={styles.heading}>
      <h3>Escolha o formato</h3>
      <p>PDF para leitura direta ou EPUB para Kindle e outros aplicativos compatíveis.</p>
      <div className={styles.selectionSummary}><span>Idioma: <b>{current?.label||"Português"}</b></span><span>Capa: <b>{coverLabel}</b></span></div>
    </div>

    <div className={styles.actions}>
      {current?.hasEpub&&<button className={`${styles.primary} ${styles.action}`} type="button" onClick={downloadEpub} disabled={busy}>{busy?"Preparando...":"Baixar EPUB / Kindle"}</button>}
      {current?.hasPdf&&<button className={`${styles.secondary} ${styles.action}`} type="button" onClick={openPdf}>Ler PDF</button>}
      <div className={styles.favorite}><FavoriteButton bookId={id} initial={initialFavorite}/></div>
      <button className={`${styles.secondary} ${styles.action}`} type="button" onClick={openCoverPicker} disabled={busy}>Escolher capa</button>
      <button className={`${styles.secondary} ${styles.action}`} type="button" onClick={()=>setLanguagePicker(true)}>Escolher idioma</button>
    </div>

    {!allowDownload&&<p className={styles.note}>A leitura continua disponível, mas o download direto deste título está desativado.</p>}
    {message&&<div className={styles.message}>{message}</div>}

    {languagePicker&&<div className={styles.backdrop} role="presentation" onClick={()=>setLanguagePicker(false)}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Escolher idioma" onClick={e=>e.stopPropagation()}>
        <div className={styles.modalHead}><div><strong>Escolher idioma</strong><p>As versões do mesmo livro ficam reunidas aqui.</p></div><button type="button" onClick={()=>setLanguagePicker(false)} aria-label="Fechar">×</button></div>
        <div className={styles.languageList}>{languages.map(item=><button type="button" key={item.code} className={`${styles.languageOption} ${item.code===current?.code?styles.selected:""}`} onClick={()=>{setLanguageCode(item.code);setLanguagePicker(false);setMessage(`Idioma alterado para ${item.label}.`);}}><span><b>{item.label}</b><small>{[item.hasEpub?"EPUB":"",item.hasPdf?"PDF":""].filter(Boolean).join(" • ")||"Sem arquivo"}</small></span>{item.code===current?.code&&<strong>Selecionado</strong>}</button>)}</div>
      </div>
    </div>}

    {coverPicker&&<div className={styles.backdrop} role="presentation" onClick={()=>!busy&&setCoverPicker(false)}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Escolher capa" onClick={e=>e.stopPropagation()}>
        <div className={styles.modalHead}><div><strong>Escolher capa</strong><p>Isso é opcional. Se não escolher outra, a capa original continua no EPUB.</p></div><button type="button" onClick={()=>setCoverPicker(false)} aria-label="Fechar">×</button></div>
        <button type="button" className={`${styles.keepOriginal} ${coverUrl===null?styles.selected:""}`} onClick={()=>selectCover(null,"Capa original")}><b>Manter capa original</b><span>Recomendado</span></button>
        {!!covers.length&&<div className={styles.coverGrid}>{covers.map((cover,index)=><button type="button" className={`${styles.coverChoice} ${coverUrl===cover.url?styles.coverSelected:""}`} key={`${cover.url}-${index}`} onClick={()=>selectCover(cover.url,cover.isDefault?"Capa original":cover.label)}><img src={cover.url} alt={cover.label}/><span>{cover.isDefault?"Capa atual":cover.label}</span></button>)}</div>}
        {!covers.length&&<p className={styles.note}>Ainda não há capas alternativas cadastradas. A capa que já existe dentro do EPUB será mantida.</p>}
        <button className={`${styles.secondary} ${styles.upload}`} type="button" disabled={busy} onClick={()=>coverInput.current?.click()}>Enviar minha própria capa</button>
        <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>{const file=e.target.files?.[0];if(file)void uploadCustomCover(file);}}/>
      </div>
    </div>}
  </div>;
}
