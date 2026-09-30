import { pick, type Rng } from "./rng";

export const FIRST_NAMES = [
  "Aiden","Amari","Andre","Anthony","Ashton","Austin","Avery","Bennett","Brandon","Braylon",
  "Brooks","Caleb","Cam","Cameron","Carter","Cedric","Chris","Cole","Colin","Conrad",
  "Cooper","Darius","Davion","Declan","DeShawn","Devin","Dominic","Donovan","Drew","Dorian",
  "Elias","Eli","Emmett","Ezra","Finn","Gabriel","Grant","Grayson","Hassan","Henry",
  "Isaiah","Ivan","Jace","Jackson","Jalen","Jamal","James","Jasper","Jayden","Jaylen",
  "Jeremiah","Jonah","Jordan","Julian","Kai","Kameron","Keegan","Kellan","Khalil","Kobe",
  "Landon","Langston","Leo","Liam","Luca","Malachi","Malik","Marcus","Mateo","Micah",
  "Miles","Milo","Mitchell","Nasir","Nathan","Nico","Noah","Nolan","Omar","Owen",
  "Parker","Patrick","Quincy","Rafael","Reece","Riley","Roman","Ryan","Samir","Sawyer",
  "Sean","Silas","Simeon","Solomon","Theo","Tobias","Trent","Tyler","Victor","Wesley",
  "Xavier","Zion","Zane","Andres","Diego","Luis","Sergio","Tomas","Enzo","Rocco",
];

export const LAST_NAMES = [
  "Adams","Allen","Alvarez","Anderson","Bailey","Barnes","Bennett","Bishop","Boyd","Brooks",
  "Brown","Bryant","Burke","Butler","Campbell","Carter","Castillo","Clark","Cole","Collins",
  "Cooper","Cox","Cruz","Daniels","Davis","Diaz","Dixon","Edwards","Ellis","Evans",
  "Flores","Ford","Foster","Garcia","Gibson","Gomez","Gonzalez","Grant","Gray","Green",
  "Griffin","Hall","Harris","Hayes","Henderson","Hernandez","Hill","Howard","Hughes","Hunt",
  "Ingram","Jackson","James","Jenkins","Johnson","Jones","Jordan","Kelly","Kim","King",
  "Knight","Lane","Lee","Lewis","Lopez","Marshall","Martin","Martinez","Mason","Matthews",
  "Miller","Mitchell","Moore","Morales","Morgan","Morris","Murphy","Myers","Nelson","Nguyen",
  "Ortiz","Owens","Parker","Patel","Perez","Perry","Peterson","Phillips","Porter","Powell",
  "Price","Ramirez","Reed","Reyes","Reynolds","Richardson","Rivera","Roberts","Robinson","Rogers",
  "Ross","Russell","Sanchez","Sanders","Scott","Simmons","Singh","Smith","Stewart","Sullivan",
  "Taylor","Thomas","Thompson","Torres","Turner","Walker","Wallace","Ward","Washington","Watson",
  "Wells","West","White","Williams","Wilson","Wood","Wright","Young","Vaughn","Hodge",
];

export function randomPersonName(rng: Rng, used?: Set<string>): { first: string; last: string } {
  for (let i = 0; i < 32; i++) {
    const first = pick(rng, FIRST_NAMES);
    let last = pick(rng, LAST_NAMES);
    const roll = rng();
    if (roll < 0.06) last = `${last} Jr`;
    else if (roll < 0.09) last = `${last} III`;
    const key = `${first} ${last}`.toLowerCase();
    if (!used || !used.has(key)) {
      used?.add(key);
      return { first, last };
    }
  }
  const first = pick(rng, FIRST_NAMES);
  const last = `${pick(rng, LAST_NAMES)}${Math.floor(rng() * 90 + 10)}`;
  used?.add(`${first} ${last}`.toLowerCase());
  return { first, last };
}

export function randomIntlName(rng: Rng, used?: Set<string>, country?: string): { first: string; last: string } {
  const table: Record<string, { first: string[]; last: string[] }> = {
    AU: { first: ["Dyson", "Josh", "Isaac", "Lachlan"], last: ["Wright", "Clarke", "Walsh", "Nguyen"] },
    ES: { first: ["Pau", "Sergi", "Hugo", "Alex"], last: ["Garcia", "Lopez", "Ruiz", "Navarro"] },
    FR: { first: ["Theo", "Mathis", "Leo", "Enzo"], last: ["Martin", "Bernard", "Petit", "Moreau"] },
    CA: { first: ["Liam", "Nate", "Owen", "Jamal"], last: ["Roy", "Tremblay", "Walker", "Singh"] },
    NG: { first: ["Chidi", "Emeka", "Tunde", "Ifeanyi"], last: ["Okafor", "Adeyemi", "Nwosu", "Balogun"] },
    SN: { first: ["Mamadou", "Cheikh", "Ibrahima"], last: ["Diop", "Ndiaye", "Fall", "Sarr"] },
    LT: { first: ["Domantas", "Jonas", "Marius"], last: ["Jankauskas", "Kazlauskas", "Petrauskas"] },
    GR: { first: ["Nikos", "Giannis", "Kostas"], last: ["Papadopoulos", "Nikolaou", "Georgiou"] },
    DE: { first: ["Lukas", "Jonas", "Felix"], last: ["Mueller", "Schmidt", "Wagner"] },
    HR: { first: ["Luka", "Ivan", "Mateo"], last: ["Horvat", "Kovac", "Bogdan"] },
    RS: { first: ["Nikola", "Stefan", "Marko"], last: ["Jovanovic", "Nikolic", "Petrovic"] },
    BR: { first: ["Lucas", "Pedro", "Rafael"], last: ["Silva", "Santos", "Oliveira"] },
  };
  const pack = (country && table[country]) || table.AU!;
  for (let i = 0; i < 16; i++) {
    const first = pick(rng, pack.first);
    const last = pick(rng, pack.last);
    const key = `${first} ${last}`.toLowerCase();
    if (!used || !used.has(key)) {
      used?.add(key);
      return { first, last };
    }
  }
  return randomPersonName(rng, used);
}
