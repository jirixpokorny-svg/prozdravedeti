// Pevný ceník konzultací a dárkových poukazů (převzato z původního webu prozdravedeti.cz).
// Stránky i /api/order čtou ceny odsud, aby cena nešla podvrhnout z prohlížeče.

export type CatalogItem = {
  id: string;
  title: string;
  price: number;
  duration?: string;
  includes: string;
  summary: string;
  options?: { label: string; price: number }[];
  image?: string;
};

export const CONSULTATIONS: CatalogItem[] = [
  {
    id: 'jednorazova',
    title: 'Jednorázová konzultace',
    price: 1150,
    duration: '60 minut',
    includes: '60minutová osobní nebo online konzultace + shrnutí konzultace do e-mailu',
    summary: 'Máte konkrétní problém nebo otázku, která nevyžaduje dlouhodobou spolupráci? Pro ty, kteří se chtějí krátce a stručně poradit: vhodné při potravinových alergiích, výživě v nemoci a podobně. A pro ty, s nimiž již spolupracuji: zhodnocení dosažených úspěchů a naplánování dalších změn.',
  },
  {
    id: 'komplexni',
    title: 'Komplexní konzultace',
    price: 3500,
    duration: 'cca 2 hodiny',
    includes: 'Vyhodnocení dodaných materiálů před konzultací + 2hodinová osobní nebo online konzultace + shrnutí konzultace do e-mailu',
    summary: 'Na všechny další kroky už tu budu s vámi. Dohodneme se na platbě a termínu konzultace a pošlu vám velký vstupní dotazník. Ten od vás budu potřebovat vyplněný nejdéle 3 dny před naší schůzkou. Písemný návrh úpravy stravy a harmonizace režimových změn vám pošlu do 3 dnů od schůzky.',
  },
  {
    id: 'motivacni',
    title: 'Motivační konzultace',
    price: 500,
    duration: '30 minut',
    includes: '30minutová osobní nebo online konzultace',
    summary: 'Spolupráci už jsme navázali komplexní konzultací a nyní potřebujete už pouze občasné vedení nebo motivaci. Průběžně vyhodnotíme vaši cestu k cíli.',
  },
];

export const VOUCHERS: CatalogItem[] = [
  {
    id: 'kurz-dle-vyberu',
    title: 'Kurz dle vlastního výběru',
    price: 1000,
    includes: 'Poukaz na kurz z mé nabídky, obdarovaný si vybere sám',
    summary: 'Darujte svým blízkým možnost vybrat si kurz podle jejich chuti a přání: z nabídky kurzů zdravého vaření, pečení, životosprávy či zážitků pro děti i dospělé. Stačí, když obdarovaný uplatní poukaz a zvolí si kurz, který ho zrovna osloví. Perfektní volba pro partnerku, partnera, maminku, tatínka, kamarádku nebo kamaráda.',
    options: [
      { label: 'Dospělý, hodnota 1 000 Kč', price: 1000 },
      { label: 'Dospělý, hodnota 1 500 Kč', price: 1500 },
      { label: 'Dospělý, hodnota 2 000 Kč', price: 2000 },
      { label: 'Dospělý + 1x dítě', price: 1200 },
      { label: 'Dospělý + 2x dítě', price: 1400 },
    ],
    image: '/images/poukazy/kurz-volny.png',
  },
  {
    id: 'komplexni-konzultace',
    title: 'Komplexní konzultace výživového poradenství',
    price: 3500,
    includes: 'Úvodní analýza stravování a denních návyků, podrobný rozbor s individuálními doporučeními a osobní/online konzultace',
    summary: 'Darujte něco, co má skutečnou hodnotu: péči o zdraví, energii a pohodu. Komplexní konzultace je balíček osobní i profesionální podpory, který pomůže vašemu blízkému lépe porozumět svému tělu, jídelníčku i životnímu stylu. Bez diet, zmatků a slepých uliček.',
    image: '/images/poukazy/komplexni-konzultace.png',
  },
  {
    id: 'jednorazova-konzultace',
    title: 'Jednorázová konzultace výživového poradenství',
    price: 1150,
    includes: '60minutová osobní nebo online konzultace s písemným shrnutím doporučení',
    summary: 'Darujte blízkému možnost objevit radost ze zdravého jídla a ucelený náhled na výživu. Ideální, když si někdo není jistý, jak poskládat jídlo při alergiích nebo specifických potřebách, nebo když chcete podpořit blízkou osobu v tom, aby se cítila lépe, zdravěji a s více energií.',
    image: '/images/poukazy/jednorazova-konzultace.png',
  },
  {
    id: 'parove-vareni',
    title: 'Párové vaření a vinná degustace, poukaz pro 2 osoby',
    price: 2990,
    includes: 'Kurz párového vaření tří chodů s řízenou degustací vín pro dvě osoby',
    summary: 'Darujte zážitek, který spojí dobré jídlo, skvělé víno a společně strávený čas. Pod vedením lektorky si dvojice vyzkouší přípravu vyváženého menu, které zvládne každý i doma, a k tomu řízenou degustaci vín. Termín si obdarovaní vyberou z vypsaných termínů kurzu.',
    image: '/images/poukazy/parove-vareni.png',
  },
];

export function findCatalogItem(list: CatalogItem[], id: string) {
  return list.find(i => i.id === id);
}
