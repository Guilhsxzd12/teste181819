import type { Category } from "@/lib/types";

function norm(v:string){return v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function has(hay:string,terms:string[]){return terms.some(term=>{const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`,"i").test(hay);});}

const RULES:Array<[string,string[]]>=[
  ["Romance",["romance","romantic","love story","enemies to lovers","friends to lovers"]],
  ["Mistério e Suspense",["misterio","mystery","suspense","thriller","detetive","detective","investigacao criminal"]],
  ["Terror",["horror","terror","haunted","fantasma","ghost","demonio","demon","vampire","vampiro","zombie","zumbi","macabro"]],
  ["Fantasia",["fantasy","fantasia","magic","magia","witch","bruxa","wizard","feiticeiro","feiticeira","dragon","dragao","fae","elf"]],
  ["Ficção Científica e Distopia",["science fiction","sci-fi","ficcao cientifica","distopia","dystopia","cyberpunk","space opera","time travel"]],
  ["Ação e Aventura",["adventure","aventura","action","espionagem","spy thriller","survival","sobrevivencia","pirate","pirata"]],
  ["Poesia",["poesia","poetry","poemas","poems","poemario"]],
  ["Religião e Espiritualidade",["religiao","religious","espiritualidade","spirituality","devocional","evangelho","teologia","theology","cristianismo","christianity","budismo","buddhism","oracoes"]],
  ["Autoajuda e Desenvolvimento Pessoal",["autoajuda","self-help","personal development","desenvolvimento pessoal","motivacao","produtividade","mindset","crescimento pessoal"]],
  ["Biografias e Memórias",["biografia","biography","autobiografia","autobiography","memoir","memorias"]],
  ["História e Sociedade",["history","historia do brasil","historia mundial","historia da humanidade","historia antiga","historia moderna","world war","guerra mundial","civilizacao","sociologia"]],
  ["Negócios e Finanças",["business","marketing","vendas","sales","financas","finance","economia","economics","investimento","investing","empreendedorismo","management","gestao"]],
  ["Psicologia e Comportamento",["psicologia","psychology","comportamento","behavior","behaviour","terapia","therapy","trauma","ansiedade","anxiety","attachment theory","teoria do apego"]],
  ["Saúde e Bem-estar",["saude","health","medicina","medicine","nutricao","nutrition","dieta","diet","yoga","wellness","fitness","anatomia"]],
  ["Ciência e Tecnologia",["ciencia","science","tecnologia","technology","programacao","programming","software","artificial intelligence","inteligencia artificial","physics","fisica","biology","biologia"]],
  ["Educação e Referência",["educacao","education","textbook","didatico","dicionario","gramatica","reference","referencia","study guide"]],
  ["Crime Real",["true crime","crime real","criminal biography","serial killer biography"]],
  ["Infantojuvenil",["infantojuvenil","literatura juvenil","literatura infantil","juvenile fiction","children's literature","middle grade"]],
  ["Contos e Crônicas",["contos","cronicas","short stories","short story collection"]],
  ["Drama",["drama","dramatic literature","plays"]],
  ["Humor",["humor","comedia","comedy","satira","satire"]],
  ["Arte e Cultura",["fotografia","photography","cinema","music","musica","visual arts","art history","historia da arte","graphic design"]],
  ["Culinária e Gastronomia",["culinaria","gastronomia","receitas","recipes","cooking","cookbook"]],
  ["Filosofia",["filosofia","philosophy","epistemologia","existencialismo","estoicismo","stoicism"]],
  ["Política e Direito",["politica","political science","direito","law","juridico","constituicao","democracia","geopolitica"]],
  ["Esportes",["esportes","sports","futebol","soccer","basquete","basketball","athletics"]],
  ["Viagem e Turismo",["turismo","tourism","travel guide","travelogue"]],
  ["HQ e Graphic Novel",["graphic novel","quadrinhos","historia em quadrinhos","manga","comic book","comics"]],
  ["Clássicos",["classicos da literatura","classic literature","literary classics"]],
  ["Literatura Brasileira",["literatura brasileira","brazilian literature","brazilian fiction"]]
];

const FICTION_CHILDREN=new Set(["Romance","Mistério e Suspense","Terror","Fantasia","Ficção Científica e Distopia","Ação e Aventura","Drama","Contos e Crônicas"]);
const NONFICTION_CHILDREN=new Set(["Autoajuda e Desenvolvimento Pessoal","Biografias e Memórias","História e Sociedade","Negócios e Finanças","Psicologia e Comportamento","Saúde e Bem-estar","Ciência e Tecnologia","Educação e Referência","Crime Real","Filosofia","Política e Direito","Esportes","Viagem e Turismo","Culinária e Gastronomia"]);

export function guessCategoryIds(categories:Category[],subjects:string[]=[],title="",_description=""){
  const subjectHay=norm(subjects.join(" | "));const titleHay=norm(title);
  const names=new Set<string>();
  for(const [category,terms] of RULES){const normalizedTerms=terms.map(norm);if(has(subjectHay,normalizedTerms)||has(titleHay,normalizedTerms))names.add(category);}
  // Evita falsos positivos conhecidos em títulos metafóricos/comerciais.
  if(names.has("Religião e Espiritualidade")&&/(biblia de vendas|sales bible)/i.test(titleHay))names.delete("Religião e Espiritualidade");
  if(has(subjectHay,["fiction","ficcao","novel"]))names.add("Ficção");
  if(has(subjectHay,["nonfiction","non-fiction","nao ficcao"]))names.add("Fatos Reais");
  for(const c of categories){const cn=norm(c.name);if(subjects.some(s=>{const sn=norm(s);return sn===cn||sn.includes(cn)||cn.includes(sn);} ))names.add(c.name);}
  if([...names].some(n=>FICTION_CHILDREN.has(n)))names.add("Ficção");
  if([...names].some(n=>NONFICTION_CHILDREN.has(n)))names.add("Fatos Reais");
  return categories.filter(c=>names.has(c.name)).map(c=>c.id);
}

export function guessCategoryId(categories:Category[],subjects:string[]=[],title="",description=""){return guessCategoryIds(categories,subjects,title,description)[0]||null;}
