const LANGUAGE_LABELS: Record<string,string> = {
  pt:"Português",
  en:"Inglês",
  de:"Alemão",
  es:"Espanhol",
  fr:"Francês",
  it:"Italiano",
  ja:"Japonês",
  ko:"Coreano",
  zh:"Chinês",
  ru:"Russo",
  nl:"Holandês",
  pl:"Polonês",
  sv:"Sueco",
  no:"Norueguês",
  da:"Dinamarquês",
  fi:"Finlandês",
  tr:"Turco",
  ar:"Árabe",
  he:"Hebraico",
  cs:"Tcheco",
  ro:"Romeno",
  hu:"Húngaro",
  el:"Grego"
};

const LANGUAGE_ALIASES: Record<string,string> = {
  por:"pt", portuguese:"pt", portugues:"pt", "pt-br":"pt", "pt_br":"pt",
  eng:"en", english:"en", ingles:"en", inglês:"en", "en-us":"en", "en-gb":"en",
  deu:"de", ger:"de", german:"de", alemao:"de", alemão:"de",
  spa:"es", spanish:"es", espanhol:"es",
  fra:"fr", fre:"fr", french:"fr", frances:"fr", francês:"fr",
  ita:"it", italian:"it", italiano:"it",
  jpn:"ja", japanese:"ja", japones:"ja", japonês:"ja",
  kor:"ko", korean:"ko", coreano:"ko",
  zho:"zh", chi:"zh", chinese:"zh", chines:"zh", chinês:"zh",
  rus:"ru", russian:"ru", russo:"ru"
};

export function normalizeLanguage(value?:string|null){
  if(!value)return "";
  const raw=value.trim().toLowerCase();
  if(!raw)return "";
  const aliased=LANGUAGE_ALIASES[raw]||raw;
  return aliased.split(/[-_]/)[0];
}

export function languageLabel(value?:string|null){
  const code=normalizeLanguage(value);
  if(!code)return "Idioma não informado";
  return LANGUAGE_LABELS[code]||value?.trim()||code.toUpperCase();
}

export function isPortugueseLanguage(value?:string|null){
  return normalizeLanguage(value)==="pt";
}

export function languageSlug(value?:string|null){
  const label=languageLabel(value);
  return label.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
}
