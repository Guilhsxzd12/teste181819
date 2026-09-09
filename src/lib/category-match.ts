import type { Category } from "@/lib/types";

function norm(v:string){return v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function has(hay:string,terms:string[]){return terms.some(term=>new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}([^a-z0-9]|$)`,"i").test(hay));}

const RULES:Array<[string,string[]]>=[
  ["Romance",["romance","romantico","romantica","romantic","love story"]],
  ["Mistério e Suspense",["misterio","suspense","thriller","detetive","detective","investigacao","assassinato","murder"]],
  ["Terror",["horror","terror","assombracao","haunted","fantasma","ghost","demonio","demon","vampiro","vampire","zumbi","zombie","macabro"]],
  ["Fantasia",["fantasy","fantasia","magia","magic","bruxa","witch","wizard","feiticeiro","feiticeira","dragon","dragao","fae","elf"]],
  ["Ficção Científica e Distopia",["science fiction","sci-fi","ficcao cientifica","distopia","dystopia","cyberpunk","alien","time travel","space opera"]],
  ["Ação e Aventura",["aventura","adventure","action","espionagem","spy","survival","sobrevivencia","pirata","pirate","quest"]],
  ["Poesia",["poesia","poetry","poemas","poems","poetico","poetica"]],
  ["Religião e Espiritualidade",["religiao","espiritualidade","devocional","biblia","evangelho","teologia","cristianismo","jesus","oracao","budismo","buddhism"]],
  ["Autoajuda e Desenvolvimento Pessoal",["autoajuda","self-help","desenvolvimento pessoal","motivacao","produtividade","mindset","proposito","crescimento pessoal"]],
  ["Biografias e Memórias",["biografia","biography","autobiografia","autobiography","memoir","memorias"]],
  ["História e Sociedade",["historiador","historiadora","historiografia","guerra mundial","world war","civilizacao","sociologia","revolucao francesa","revolucao russa","historia do brasil","historia mundial","historia da humanidade"]],
  ["Negócios e Finanças",["business","marketing","vendas","sales","financas","finance","economia","economics","investimento","investing","empreendedorismo","management","gestao"]],
  ["Psicologia e Comportamento",["psicologia","psychology","comportamento","behavior","behaviour","terapia","therapy","trauma","ansiedade","anxiety","teoria do apego"]],
  ["Saúde e Bem-estar",["saude","health","medicina","medicine","nutricao","nutrition","dieta","diet","yoga","wellness","fitness","anatomia"]],
  ["Ciência e Tecnologia",["ciencia","science","tecnologia","technology","programacao","programming","software","python","java","inteligencia artificial","artificial intelligence","fisica","physics","biologia","biology"]],
  ["Educação e Referência",["educacao","education","textbook","didatico","didatica","dicionario","gramatica","referencia","study guide"]],
  ["Crime Real",["true crime","crime real","caso criminal real","assassino em serie real","serial killer real"]],
  ["Infantojuvenil",["infantojuvenil","literatura juvenil","literatura infantil","juvenile","middle grade","children's literature"]],
  ["Contos e Crônicas",["contos","cronicas","short stories","short story collection"]],
  ["Humor",["humor","comedia","comedy","satira","satire"]],
  ["Arte e Cultura",["fotografia","photography","cinema","musica","music","artes visuais","visual arts","historia da arte","design grafico"]],
  ["Culinária e Gastronomia",["culinaria","gastronomia","receitas","recipe","cozinha","cooking","cookbook"]],
  ["Filosofia",["filosofia","philosophy","filosofico","filosofica","epistemologia","existencialismo","estoicismo","stoicism"]],
  ["Política e Direito",["politica","political","direito","juridico","juridica","constituicao","democracia","geopolitica"]],
  ["Esportes",["esporte","esportes","sport","sports","futebol","soccer","basquete","basketball","atleta","athlete"]],
  ["Viagem e Turismo",["turismo","tourism","guia de viagem","travel guide","travelogue"]],
  ["HQ e Graphic Novel",["graphic novel","quadrinhos","historia em quadrinhos","manga","comic book","comics"]],
  ["Clássicos",["classicos da literatura","classic literature","literary classic"]],
  ["Literatura Brasileira",["literatura brasileira","brazilian literature","brazilian fiction"]]
];

const FICTION_CHILDREN=new Set(["Romance","Mistério e Suspense","Terror","Fantasia","Ficção Científica e Distopia","Ação e Aventura","Drama","Contos e Crônicas"]);
const NONFICTION_CHILDREN=new Set(["Autoajuda e Desenvolvimento Pessoal","Biografias e Memórias","História e Sociedade","Negócios e Finanças","Psicologia e Comportamento","Saúde e Bem-estar","Ciência e Tecnologia","Educação e Referência","Crime Real","Filosofia","Política e Direito","Esportes","Viagem e Turismo","Culinária e Gastronomia"]);

export function guessCategoryIds(categories:Category[],subjects:string[]=[],title="",description=""){
  const hay=norm([...subjects,title,description].join(" | "));
  const names=new Set<string>();
  for(const [category,terms] of RULES)if(has(hay,terms.map(norm)))names.add(category);
  for(const c of categories){
    const cn=norm(c.name);
    if(subjects.some(s=>{const sn=norm(s);return sn===cn||sn.includes(cn)||cn.includes(sn);} ))names.add(c.name);
  }
  if([...names].some(n=>FICTION_CHILDREN.has(n)))names.add("Ficção");
  if([...names].some(n=>NONFICTION_CHILDREN.has(n)))names.add("Fatos Reais");
  return categories.filter(c=>names.has(c.name)).map(c=>c.id);
}

export function guessCategoryId(categories:Category[],subjects:string[]=[],title="",description=""){
  return guessCategoryIds(categories,subjects,title,description)[0]||null;
}
