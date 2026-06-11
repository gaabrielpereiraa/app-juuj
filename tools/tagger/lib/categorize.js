// Heurística simples: título da memória -> categoria.
// Serve de dial de dificuldade nos jogos depois. Retorna null se nada casar.
// A ordem importa: a primeira categoria cujo padrão casar vence.

const RULES = [
  ['niver', /niver|anivers[áa]rio/i],
  ['viagem', /trip|b[úu]zios|viagem|cctrip|hotel|piscina do hotel/i],
  ['praia', /praia|asa(?!\w)|reserva|recreio|fundão|fundao/i],
  ['festa', /festa|carna|halloween|ccelloween|open trainee|resenha/i],
  ['japa', /japa|gurum[êe]|quitanda|sushi|nolita/i],
  ['poker', /poker/i],
  ['treino', /treino|leg day|legday|academia|corrida|corridinha|v[ôo]lei|volei|costas|perna|cardio/i],
  ['cinema', /cinema|cineminha|filme|filminho|stranger things|top gun|percy jackson|daisy jones|oscar|[óo]scar/i],
  ['churras', /churras|churrasco|churrasquinho/i],
  ['comida', /madero|pizza|risotto|risoto|outback|hamb[úu]rguer|burger|macarr[ãa]o|nhoque|subway|baccio|sorvet|brownie|cookie|fondue|brunch|mc(?!\w)|jeronimo|maraca|mamma jamma|tutto|porto do sabor|zona sul/i],
  ['chamego', /chamego|chameguinho|abra[çc]o|abraccio|cochilo|cochilinho|soninho|coworking|costudying|escrit[óo]rio/i],
];

export function categorize(title) {
  const t = String(title || '');
  for (const [cat, re] of RULES) {
    if (re.test(t)) return cat;
  }
  return null;
}
