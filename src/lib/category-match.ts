import type { Category } from "@/lib/types";

function norm(v:string){return v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function has(hay:string,terms:string[]){return terms.some(term=>{const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`,"i").test(hay);});}

const SUBJECT_RULES:Array<[string,string[]]>=[
  ["Romance",["romance","romantic","love stories","enemies to lovers","friends to lovers"]],
  ["Mistério e Suspense",["mystery","misterio","suspense","thriller","detective","detetive","crime fiction"]],
  ["Terror",["horror","terror","ghost stories","vampires","zombies","supernatural horror"]],
  ["Fantasia",["fantasy","fantasia","magic","magia","witches","dragons","fae"]],
  ["Ficção Científica e Distopia",["science fiction","ficcao cientifica","dystopia","distopia","cyberpunk","space opera","time travel"]],
  ["Ação e Aventura",["adventure","aventura","action and adventure","espionage","pirates"]],
  ["Poesia",["poetry","poesia","poems","poemas"]],
  ["Religião e Espiritualidade",["religion","religiao","spirituality","espiritualidade","theology","teologia","christianity","cristianismo","buddhism","budismo","devotional","devocional"]],
  ["Autoajuda e Desenvolvimento Pessoal",["self-help","autoajuda","personal development","desenvolvimento pessoal","productivity","produtividade"]],
  ["Biografias e Memórias",["biography","biografia","autobiography","autobiografia","memoir","memorias"]],
  ["História e Sociedade",["history","historia","sociology","sociologia","civilization","civilizacao"]],
  ["Negócios e Finanças",["business","marketing","sales","vendas","finance","financas","economics","economia","investing","management"]],
  ["Psicologia e Comportamento",["psychology","psicologia","behavior","comportamento","therapy","terapia","trauma","anxiety","ansiedade"]],
  ["Saúde e Bem-estar",["health","saude","medicine","medicina","nutrition","nutricao","diet","dieta","yoga","wellness","fitness","anatomy"]],
  ["Ciência e Tecnologia",["science","ciencia","technology","tecnologia","programming","programacao","software","artificial intelligence","physics","biology"]],
  ["Educação e Referência",["education","educacao","textbook","reference","dictionaries","grammar","study guides"]],
  ["Crime Real",["true crime","crime real","criminal biography"]],
  ["Infantojuvenil",["juvenile fiction","children's literature","middle grade","literatura juvenil","literatura infantil"]],
  ["Contos e Crônicas",["short stories","contos","cronicas"]],
  ["Drama",["drama","plays","dramatic literature"]],
  ["Humor",["humor","comedy","comedia","satire","satira"]],
  ["Arte e Cultura",["photography","fotografia","cinema","music","musica","visual arts","art history","graphic design"]],
  ["Culinária e Gastronomia",["cooking","cookbooks","culinaria","gastronomia","recipes","receitas"]],
  ["Filosofia",["philosophy","filosofia","epistemology","existentialism","stoicism"]],
  ["Política e Direito",["political science","politica","law","direito","constitution","democracy","geopolitics"]],
  ["Esportes",["sports","esportes","soccer","futebol","basketball","basquete","athletics"]],
  ["Viagem e Turismo",["travel guides","travelogue","tourism","turismo"]],
  ["HQ e Graphic Novel",["graphic novels","graphic novel","comics","quadrinhos","manga"]],
  ["Clássicos",["classic literature","literary classics","classicos da literatura"]],
  ["Literatura Brasileira",["brazilian literature","brazilian fiction","literatura brasileira"]]
];

const TITLE_RULES:Array<[string,string[]]>=[
  ["Romance",["romance","romantic"]],
  ["Mistério e Suspense",["misterio","mystery","suspense","thriller","detetive","detective"]],
  ["Terror",["horror","terror","haunted","fantasma","ghost","vampire","vampiro","zombie","zumbi"]],
  ["Fantasia",["fantasy","fantasia","magic","magia","witch","bruxa","wizard","dragon","dragao"]],
  ["Ficção Científica e Distopia",["science fiction","ficcao cientifica","dystopia","distopia","cyberpunk","space opera"]],
  ["Ação e Aventura",["adventure","aventura","espionagem","pirate","pirata"]],
  ["Poesia",["poesia","poetry","poemas","poems","poemario"]],
  ["Religião e Espiritualidade",["religiao","espiritualidade","devocional","evangelho","teologia","cristianismo","budismo","oracoes"]],
  ["Autoajuda e Desenvolvimento Pessoal",["autoajuda","self-help","desenvolvimento pessoal","produtividade","mindset"]],
  ["Biografias e Memórias",["biografia","biography","autobiografia","autobiography","memoir","memorias"]],
  ["História e Sociedade",["historia do brasil","historia mundial","historia da humanidade","historia antiga","historia moderna","historia medieval","guerra mundial","world war","civilizacao","sociologia"]],
  ["Negócios e Finanças",["business","marketing","vendas","sales","financas","finance","economia","economics","investimentos","investing","empreendedorismo","management","gestao"]],
  ["Psicologia e Comportamento",["psicologia","psychology","comportamento","behavior","therapy","terapia","trauma","ansiedade","anxiety"]],
  ["Saúde e Bem-estar",["saude","health","medicina","medicine","nutricao","nutrition","dieta","diet","yoga","wellness","fitness","anatomia"]],
  ["Ciência e Tecnologia",["ciencia","science","tecnologia","technology","programacao","programming","software","artificial intelligence","inteligencia artificial","physics","fisica","biology","biologia"]],
  ["Educação e Referência",["educacao","education","textbook","didatico","dicionario","gramatica","study guide"]],
  ["Crime Real",["true crime","crime real"]],
  ["Infantojuvenil",["infantojuvenil","literatura juvenil","literatura infantil","middle grade"]],
  ["Contos e Crônicas",["contos","cronicas","short stories"]],
  ["Drama",["drama","plays"]],
  ["Humor",["humor","comedia","comedy","satira","satire"]],
  ["Arte e Cultura",["fotografia","photography","cinema","musica","music","visual arts","historia da arte","graphic design"]],
  ["Culinária e Gastronomia",["culinaria","gastronomia","receitas","recipes","cooking","cookbook"]],
  ["Filosofia",["filosofia","philosophy","epistemologia","existencialismo","estoicismo","stoicism"]],
  ["Política e Direito",["politica","political science","direito","juridico","constituicao","democracia","geopolitica"]],
  ["Esportes",["esportes","sports","futebol","soccer","basquete","basketball","athletics"]],
  ["Viagem e Turismo",["turismo","tourism","travel guide","travelogue"]],
  ["HQ e Graphic Novel",["graphic novel","quadrinhos","historia em quadrinhos","manga","comic book","comics"]],
  ["Clássicos",["classicos da literatura","classic literature","literary classics"]],
  ["Literatura Brasileira",["literatura brasileira","brazilian literature","brazilian fiction"]]
];

const FICTION_CHILDREN=new Set(["Romance","Mistério e Suspense","Terror","Fantasia","Ficção Científica e Distopia","Ação e Aventura","Drama","Contos e Crônicas"]);
const NONFICTION_CHILDREN=new Set(["Autoajuda e Desenvolvimento Pessoal","Biografias e Memórias","História e Sociedade","Negócios e Finanças","Psicologia e Comportamento","Saúde e Bem-estar","Ciência e Tecnologia","Educação e Referência","Crime Real","Filosofia","Política e Direito","Esportes","Viagem e Turismo","Culinária e Gastronomia"]);

export function guessCategoryIds(categories:Category[],subjects:string[]=[],title="",_description=""){
  const subjectHay=norm(subjects.join(" | "));const titleHay=norm(title);const names=new Set<string>();
  for(const [category,terms] of SUBJECT_RULES)if(has(subjectHay,terms.map(norm)))names.add(category);
  for(const [category,terms] of TITLE_RULES)if(has(titleHay,terms.map(norm)))names.add(category);
  if(names.has("Religião e Espiritualidade")&&/(biblia de vendas|sales bible)/i.test(titleHay))names.delete("Religião e Espiritualidade");
  if(has(subjectHay,["fiction","ficcao","novel"]))names.add("Ficção");if(has(subjectHay,["nonfiction","non-fiction","nao ficcao"]))names.add("Fatos Reais");
  for(const c of categories){const cn=norm(c.name);if(subjects.some(s=>{const sn=norm(s);return sn===cn||sn.includes(cn)||cn.includes(sn);} ))names.add(c.name);}
  if([...names].some(n=>FICTION_CHILDREN.has(n)))names.add("Ficção");if([...names].some(n=>NONFICTION_CHILDREN.has(n)))names.add("Fatos Reais");
  return categories.filter(c=>names.has(c.name)).map(c=>c.id);
}
export function guessCategoryId(categories:Category[],subjects:string[]=[],title="",description=""){return guessCategoryIds(categories,subjects,title,description)[0]||null;}
