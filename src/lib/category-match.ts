import type { Category } from "@/lib/types";

function norm(value:string){
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
}

function has(hay:string,terms:string[]){
  return terms.some(term=>{
    const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`,"i").test(hay);
  });
}

const SUBJECT_RULES:Array<[string,string[]]>=[
  ["Romance",["romance","romantic","love stories","enemies to lovers","friends to lovers"]],
  ["Mistério e Suspense",["mystery","misterio","suspense","thriller","detective","detetive","crime fiction"]],
  ["Terror",["horror","terror","ghost stories","vampires","zombies","supernatural horror"]],
  ["Fantasia",["fantasy","fantasia","magic","magia","witches","dragons","fae","romantasy"]],
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
  ["Romance",["romantic","romantica","romantico","dark romance","mafia romance","sports romance","sport romance","romance paranormal","romance de epoca","romance historico","rom-com","romcom"]],
  ["Mistério e Suspense",["thriller","suspense","detective","detetive","misterio"]],
  ["Terror",["horror","terror"]],
  ["Fantasia",["fantasy","fantasia","romantasy"]],
  ["Ficção Científica e Distopia",["science fiction","ficcao cientifica","sci-fi","sci fi","dystopia","distopia","cyberpunk","space opera"]],
  ["Ação e Aventura",["adventure","aventura","espionagem","pirate","pirata"]],
  ["Poesia",["poesia","poetry","poemas","poems"]],
  ["Religião e Espiritualidade",["religiao","espiritualidade","devocional","evangelho","teologia","cristianismo","budismo","oracoes","espiritismo"]],
  ["Autoajuda e Desenvolvimento Pessoal",["autoajuda","self-help","desenvolvimento pessoal","produtividade","mindset"]],
  ["Biografias e Memórias",["biografia","biography","autobiografia","autobiography","memoir"]],
  ["História e Sociedade",["historia do brasil","historia mundial","historia da humanidade","historia antiga","historia medieval","guerra mundial","world war","civilizacao"]],
  ["Negócios e Finanças",["business","marketing","vendas","sales","financas","finance","economia","economics","investimentos","investing","empreendedorismo","management","gestao"]],
  ["Psicologia e Comportamento",["psicologia","psychology","comportamento","behavior","therapy","terapia","trauma","ansiedade","anxiety"]],
  ["Saúde e Bem-estar",["saude mental","health","medicina","medicine","nutricao","nutrition","dietoterapia","yoga","wellness","fitness"]],
  ["Ciência e Tecnologia",["tecnologia","technology","programacao","programming","software","artificial intelligence","inteligencia artificial","physics","fisica","biology","biologia","astronomy","astronomia"]],
  ["Educação e Referência",["textbook","didatico","dicionario","dictionary","gramatica","grammar","study guide"]],
  ["Crime Real",["true crime","crime real"]],
  ["Infantojuvenil",["infantojuvenil","literatura juvenil","literatura infantil","middle grade","children's literature"]],
  ["Contos e Crônicas",["contos","short stories"]],
  ["Humor",["humor","satira","satire"]],
  ["Arte e Cultura",["fotografia","photography","cinema","historia da arte","art history","graphic design"]],
  ["Culinária e Gastronomia",["culinaria","gastronomia","receitas","recipes","cooking","cookbook","livro de receitas"]],
  ["Filosofia",["filosofia","philosophy","epistemologia","existencialismo","estoicismo","stoicism"]],
  ["Política e Direito",["political science","direito constitucional","constituicao","democracia","geopolitica","economia politica"]],
  ["Esportes",["sports romance","sport romance","esportes","sports","futebol","soccer","basquete","basketball","athletics"]],
  ["Viagem e Turismo",["turismo","tourism","travel guide","travelogue","guia de viagem"]],
  ["HQ e Graphic Novel",["graphic novel","quadrinhos","historia em quadrinhos","manga","comic book","comics"]],
  ["Clássicos",["classicos da literatura","classic literature","literary classics"]],
  ["Literatura Brasileira",["literatura brasileira","brazilian literature","brazilian fiction"]]
];

const CONDITIONAL_SUBCATEGORY_RULES:Array<{parent:string;child:string;terms:string[]}>= [
  {parent:"Romance",child:"Dark Romance",terms:["dark romance"]},
  {parent:"Romance",child:"Comédia Romântica",terms:["romantic comedy","comedia romantica","rom-com","romcom"]},
  {parent:"Romance",child:"Romance Esportivo",terms:["sports romance","sport romance","hockey romance"]},
  {parent:"Fantasia",child:"Romantasia",terms:["romantasy"]},
  {parent:"Fantasia",child:"Fantasia Sombria",terms:["dark fantasy","fantasia sombria"]},
  {parent:"Mistério e Suspense",child:"Thriller Psicológico",terms:["psychological thriller","thriller psicologico"]},
  {parent:"Mistério e Suspense",child:"Policial e Detetive",terms:["detective","detetive","serial killer"]},
  {parent:"Terror",child:"Vampiros",terms:["vampire","vampiro"]}
];

const FICTION_CHILDREN=new Set([
  "Romance","Mistério e Suspense","Terror","Fantasia","Ficção Científica e Distopia",
  "Ação e Aventura","Drama","Contos e Crônicas"
]);

const NONFICTION_CHILDREN=new Set([
  "Autoajuda e Desenvolvimento Pessoal","Biografias e Memórias","História e Sociedade",
  "Negócios e Finanças","Psicologia e Comportamento","Saúde e Bem-estar","Ciência e Tecnologia",
  "Educação e Referência","Crime Real","Arte e Cultura","Filosofia","Política e Direito",
  "Culinária e Gastronomia","Esportes","Viagem e Turismo"
]);

export function withCategoryParents(categories:Category[],ids:string[]){
  const byId=new Map(categories.map(category=>[category.id,category]));
  const result=new Set(ids);
  for(const id of [...result]){
    let current=byId.get(id);
    const seen=new Set<string>();
    while(current?.parent_id&&!seen.has(current.parent_id)){
      seen.add(current.parent_id);
      result.add(current.parent_id);
      current=byId.get(current.parent_id);
    }
  }
  return [...result];
}

export function guessCategoryIds(categories:Category[],subjects:string[]=[],title="",description=""){
  const subjectHay=norm(subjects.join(" | "));
  const titleHay=norm(title);
  const detailHay=norm(`${title} | ${description}`);
  const names=new Set<string>();

  for(const [category,terms] of SUBJECT_RULES)if(has(subjectHay,terms.map(norm)))names.add(category);
  for(const [category,terms] of TITLE_RULES)if(has(titleHay,terms.map(norm)))names.add(category);

  if(names.has("Religião e Espiritualidade")&&/(biblia de vendas|sales bible)/i.test(titleHay))names.delete("Religião e Espiritualidade");

  if(has(subjectHay,["fiction","ficcao","novel"]))names.add("Ficção");
  if(has(subjectHay,["nonfiction","non-fiction","nao ficcao"]))names.add("Fatos Reais");

  for(const category of categories){
    const categoryName=norm(category.name);
    if(subjects.some(subject=>{
      const subjectName=norm(subject);
      return subjectName===categoryName||subjectName.includes(categoryName)||categoryName.includes(subjectName);
    }))names.add(category.name);
  }

  if([...names].some(name=>FICTION_CHILDREN.has(name)))names.add("Ficção");
  if([...names].some(name=>NONFICTION_CHILDREN.has(name)))names.add("Fatos Reais");

  for(const rule of CONDITIONAL_SUBCATEGORY_RULES){
    if(names.has(rule.parent)&&has(detailHay,rule.terms.map(norm)))names.add(rule.child);
  }

  const matched=categories.filter(category=>names.has(category.name)).map(category=>category.id);
  return withCategoryParents(categories,matched);
}

export function guessCategoryId(categories:Category[],subjects:string[]=[],title="",description=""){
  return guessCategoryIds(categories,subjects,title,description)[0]||null;
}
