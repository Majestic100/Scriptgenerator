export type AnalogyCategory = 'Skabe frygt' | 'Vis forbedring' | 'Skabe interesse';

export interface AnalogyItem {
  id: string;
  title: string;
  text: string;
  category: AnalogyCategory;
  description?: string;
}

export const PRESET_ANALOGIES: AnalogyItem[] = [
  // --- SKABE FRYGT (Advarsel, spild, risiko, ineffektivitet) ---
  {
    id: 'vaske-beskidt-rude',
    title: 'Vaske en rude med fedtet klud',
    text: 'Det er som at vaske en rude og stadig se snavs igennem den – du gør noget helt grundlæggende forkert.',
    category: 'Skabe frygt',
    description: 'Billedsprog for at bruge tid og kræfter uden synligt rent resultat.'
  },
  {
    id: 'haandbremse-og-speede',
    title: 'Trække i håndbremsen mens du træder på speederen',
    text: 'Det er som at køre med håndbremsen trukket helt op – du slider motoren op uden at komme ud af stedet.',
    category: 'Skabe frygt',
    description: 'Perfekt til at vise interne modkræfter og spildt potentiale.'
  },
  {
    id: 'spand-med-huller',
    title: 'Hælde vand i en spand med huller',
    text: 'Det er som at hælde vand i en spand med huller – pengene og energien løber ud lige så hurtigt, som de kommer ind.',
    category: 'Skabe frygt',
    description: 'Slår hårdt ned på spild af annoncebudget og tabte kunder.'
  },
  {
    id: 'opbevare-vand-i-doerslag',
    title: 'Bære vand i et dørslag',
    text: 'Det er som at opbevare vand i et dørslag – uanset hvor hurtigt du løber, mister du næsten det hele undervejs.',
    category: 'Skabe frygt',
    description: 'Advarer mod utætte systemer og manglende fastholdelse.'
  },
  {
    id: 'fyre-skorstenen',
    title: 'Fyre penge op i skorstenen',
    text: 'Det er som at fyre sedler op i skorstenen – de går op i røg uden at skabe varig varme eller resultat.',
    category: 'Skabe frygt',
    description: 'Visuel advarsel om ineffektive udgifter uden afkast.'
  },
  {
    id: 'koere-raes-med-punkteret-dæk',
    title: 'Køre ræs med et punkteret dæk',
    text: 'Det er som at køre et vigtigt ræs på et fladt dæk – du risikerer at ødelægge hele bilen for at spare to minutter.',
    category: 'Skabe frygt',
    description: 'Fremhæver faren ved at overse et usynligt problem.'
  },
  {
    id: 'smøre-solcreme-i-moerke',
    title: 'Smøre solcreme på i bælgmørke',
    text: 'Det er som at smøre solcreme på midt om natten – du beskytter mod noget, der slet ikke er det reelle problem.',
    category: 'Skabe frygt',
    description: 'Viser forkert diagnose af kundens reelle smertepunkt.'
  },
  {
    id: 'vande-doed-plante',
    title: 'Vande en plante, der allerede er død',
    text: 'Det er som at vande en plante, der allerede er gået ud – uanset hvor meget næring du tilfører, kommer der ikke liv ud af det.',
    category: 'Skabe frygt',
    description: 'Advarer om forældede metoder, der aldrig vil give afkast.'
  },
  {
    id: 'skære-broed-sloev-kniv',
    title: 'Skære brød med en sløv smørkniv',
    text: 'Det er som at skære franskbrød med en sløv smørkniv – du maser produktet fladt i stedet for at skære rent igennem.',
    category: 'Skabe frygt',
    description: 'Illustrerer brug af helt forkerte redskaber.'
  },
  {
    id: 'slukke-ildebrand-shotglas',
    title: 'Slukke ildebrand med et shotglas',
    text: 'Det er som at prøve at slukke en ildebrand med et shotglas vand – indsatsen er ganske enkelt for lille til problemet.',
    category: 'Skabe frygt',
    description: 'Afdækker at halv-hjertede løsninger er spild af tid.'
  },

  // --- VIS FORBEDRING (Transformation, lethed, overskud, revolution) ---
  {
    id: 'skifte-til-lyntog',
    title: 'Skifte fra cykel til lyntog',
    text: 'Det er som at skifte fra en cykel med modvind til et lyntog – samme destination, men ti gange mere ubesværet fremdrift.',
    category: 'Vis forbedring',
    description: 'Viser den enorme forskel på før og efter optimering.'
  },
  {
    id: 'rense-brillerne',
    title: 'Pudse et par meget beskidte briller',
    text: 'Det er som at pudse sine briller efter tre måneder – pludselig står alle detaljer og farver krystalklart frem.',
    category: 'Vis forbedring',
    description: 'Billedsprog for øjeblikkelig klarhed og aha-oplevelse.'
  },
  {
    id: 'sætte-turbo-paa',
    title: 'Sætte en raketmotor på cyklen',
    text: 'Det er som at sætte en turbo på motoren – i stedet for at knokle op ad bakken, glider du ubesværet over toppen.',
    category: 'Vis forbedring',
    description: 'Demonstrerer ubesværet vækst og overskud.'
  },
  {
    id: 'gravemaskine-fremfor-spiseske',
    title: 'Skifte spiseske ud med gravemaskine',
    text: 'Det er som at skifte fra at grave med en spiseske til at køre en gravemaskine – opgaven løses på ti sekunder frem for tre uger.',
    category: 'Vis forbedring',
    description: 'Fremhæver ekstrem effektivitet og tidsbesparelse.'
  },
  {
    id: 'taende-kontakten-i-moerket',
    title: 'Tænde for kontakten i mørket',
    text: 'Det er som at tænde for kontakten i et bælgmørkt rum – pludselig ser du præcis, hvor alle guldkornene ligger.',
    category: 'Vis forbedring',
    description: 'Illustrerer overblik og øjeblikkeligt resultat.'
  },
  {
    id: 'fra-smoerkkniv-til-skarp-skæring',
    title: 'Skifte til en barberblads-skarp kniv',
    text: 'Det er som at skære igennem varmt smør med en skarp kniv – intet modstand, kun et rent og perfekt snit hver gang.',
    category: 'Vis forbedring',
    description: 'Viser lethed og perfekt udførelse.'
  },
  {
    id: 'lappe-hullet-i-spanden',
    title: 'Lappe hullet i spanden én gang for alle',
    text: 'Det er som at lappe hullet i spanden én gang for alle – hver eneste dråbe du tilfører bliver nu i forretningen.',
    category: 'Vis forbedring',
    description: 'Viser varig optimering og maksimal udnyttelse.'
  },
  {
    id: 'fjerne-stenen-i-skoen',
    title: 'Fjerne stenen fra skoen på en løbetur',
    text: 'Det er som at pille en spids sten ud af løbeskoen – du kan med ét sekund løbe friere, hurtigere og helt uden smerte.',
    category: 'Vis forbedring',
    description: 'Fremhæver lettelse ved at fjerne en konstant irritation.'
  },
  {
    id: 'aaebne-for-vandhanen',
    title: 'Åbne for en stoppet vandhane',
    text: 'Det er som at fjerne en prop i vandhanen – pludselig strømmer det hele igennem i en jævn og stærk strøm.',
    category: 'Vis forbedring',
    description: 'Symboliserer genoprettet flow og stabil fremdrift.'
  },

  // --- SKABE INTERESSE (Øjenåbnere, nysgerrighed, aha-momenter) ---
  {
    id: 'skyde-spredehagl',
    title: 'Skyde med spredehagl i mørke',
    text: 'Det er som at skyde med spredehagl i mørke – du rammer måske et eller andet, men du ved ikke hvad eller hvorfor.',
    category: 'Skabe interesse',
    description: 'Vækker nysgerrighed om præcision frem for tilfældigheder.'
  },
  {
    id: 'trampe-i-sand',
    title: 'Trampe i løst sand',
    text: 'Det er som at trampe igennem dybt sand – du bruger enormt meget energi, men bevæger dig næsten ikke ud af stedet.',
    category: 'Skabe interesse',
    description: 'Skaber øjeblikkelig genkendelse af udmattelse uden fremskridt.'
  },
  {
    id: 'pumpe-dæk-med-hul',
    title: 'Pumpe et cykeldæk med et mikroskopisk hul',
    text: 'Det er som at pumpe luft i et dæk med et skjult hul – man pumper og pumper, men dækket er fladt igen om ti minutter.',
    category: 'Skabe interesse',
    description: 'Visuel metafor for symptombehandling frem for årsagsbehandling.'
  },
  {
    id: 'male-hegn-i-regnvejr',
    title: 'Male et træhegn i øsende regnvejr',
    text: 'Det er som at male et træhegn i øsende regnvejr – malingen skylles væk hurtigere end du kan nå at påføre den.',
    category: 'Skabe interesse',
    description: 'Sætter spørgsmålstegn ved dårlig timing og forkerte betingelser.'
  },
  {
    id: 'benzin-paa-bil-uden-motor',
    title: 'Benzin til en bil uden motor',
    text: 'Det er som at fylde premium benzin på en bil uden motor – ressourcen er i orden, men der mangler et system til fremdrift.',
    category: 'Skabe interesse',
    description: 'Sætter tanker i gang om at have det rette fundament.'
  },
  {
    id: 'leje-luksusbil-uden-noegle',
    title: 'Have en ferrari holdende i garagen uden nøgle',
    text: 'Det er som at have en luksusbil holdende i garagen uden nøglen – det ser flot ud, men du kan slet ikke køre i den.',
    category: 'Skabe interesse',
    description: 'Udfordrer ubrugte værktøjer eller overfladiske løsninger.'
  },
  {
    id: 'laese-bog-i-baelgmoerke',
    title: 'Læse en spændende bog i bælgmørke',
    text: 'Det er som at prøve at læse en bog uden lys – svarene står lige for næsen af dig, men du kan ikke se dem.',
    category: 'Skabe interesse',
    description: 'Tænder nysgerrighed om at få adgang til den manglende viden.'
  }
];
