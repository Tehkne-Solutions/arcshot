import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  watch,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import { createHash } from "node:crypto";

interface BaseDefinition {
  id: string;
  type: "weapon" | "character";
  name: string;
  description: string;
  color: string;
}

interface WeaponDefinition extends BaseDefinition {
  type: "weapon";
  damage: number;
  blastRadius: number;
  speed: number;
  gravityScale: number;
  projectileCount: number;
  spreadDegrees: number;
  pierce: number;
  craterScale: number;
  ammo: number | null;
  icon: "orb" | "bomb" | "triple" | "drill";
}

type CharacterSilhouette = "bombardier" | "ranger" | "rune-dwarf" | "storm-corsair" | "sky-marksman";

interface CharacterDefinition extends BaseDefinition {
  type: "character";
  role: string;
  maxHealth: number;
  moveRange: number;
  silhouette: CharacterSilhouette;
  arenaTheme?: string;
  projectileStyle?: string;
  effectStyle?: string;
}

type Definition = WeaponDefinition | CharacterDefinition;

const root = resolve(process.cwd());
const definitionsDir = join(root, "asset-definitions");
const outputDir = join(root, "apps/game/public/assets/generated");
const imagesDir = join(outputDir, "images");

const listJsonFiles = (directory: string): string[] => {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? listJsonFiles(path) : path.endsWith(".json") ? [path] : [];
  });
};

const loadDefinitions = (): Definition[] =>
  listJsonFiles(definitionsDir).map((path) => {
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Definition;
    } catch (error) {
      throw new Error(`JSON inválido em ${relative(root, path)}: ${String(error)}`);
    }
  });

const assertNumber = (definition: Record<string, unknown>, key: string): void => {
  if (typeof definition[key] !== "number" || !Number.isFinite(definition[key])) {
    throw new Error(`${definition.id ?? "manifesto"}: campo numérico inválido '${key}'.`);
  }
};

const validateDefinitions = (definitions: Definition[]): void => {
  if (definitions.length === 0) throw new Error("Nenhum manifesto encontrado em asset-definitions.");
  const ids = new Set<string>();
  const silhouettes = new Set<CharacterSilhouette>(["bombardier", "ranger", "rune-dwarf", "storm-corsair", "sky-marksman"]);

  for (const raw of definitions) {
    const definition = raw as unknown as Record<string, unknown>;
    for (const key of ["id", "type", "name", "description", "color"]) {
      if (typeof definition[key] !== "string" || String(definition[key]).trim() === "") {
        throw new Error(`Manifesto inválido: campo obrigatório '${key}'.`);
      }
    }
    const id = String(definition.id);
    if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`${id}: use apenas minúsculas, números e hífen.`);
    if (ids.has(id)) throw new Error(`ID duplicado: ${id}.`);
    ids.add(id);

    if (definition.type === "weapon") {
      for (const key of ["damage", "blastRadius", "speed", "gravityScale", "projectileCount", "spreadDegrees", "pierce", "craterScale"]) {
        assertNumber(definition, key);
      }
    } else if (definition.type === "character") {
      for (const key of ["maxHealth", "moveRange"]) assertNumber(definition, key);
      if (!silhouettes.has(String(definition.silhouette) as CharacterSilhouette)) {
        throw new Error(`${id}: silhueta de personagem desconhecida.`);
      }
    } else {
      throw new Error(`${id}: tipo desconhecido.`);
    }
  }
};

const weaponSvg = (definition: WeaponDefinition): string => {
  const common = `fill="${definition.color}" stroke="#f7fbff" stroke-width="5"`;
  const shape = {
    orb: `<circle cx="64" cy="64" r="31" ${common}/><circle cx="52" cy="51" r="9" fill="#ffffff99"/>`,
    bomb: `<circle cx="62" cy="69" r="34" ${common}/><path d="M76 36 Q87 17 103 25" fill="none" stroke="#ffcf55" stroke-width="7"/><circle cx="104" cy="24" r="7" fill="#ff7a45"/>`,
    triple: `<circle cx="42" cy="72" r="22" ${common}/><circle cx="68" cy="48" r="22" ${common}/><circle cx="88" cy="78" r="22" ${common}/>`,
    drill: `<path d="M19 64 L91 28 L111 64 L91 100 Z" ${common}/><path d="M31 64 L91 43 M31 64 L91 85" stroke="#0d1626" stroke-width="7"/>`,
  }[definition.icon];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><filter id="g"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#g)">${shape}</g></svg>`;
};

const baseCharacter = (definition: CharacterDefinition, head: string, body: string, accessory: string, aura: string): string => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <defs>
      <filter id="glow"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <linearGradient id="metal" x1="0" x2="1"><stop stop-color="#eef7ff"/><stop offset=".45" stop-color="${definition.color}"/><stop offset="1" stop-color="#182238"/></linearGradient>
    </defs>
    <ellipse cx="64" cy="116" rx="42" ry="8" fill="#00000066"/>
    ${aura}
    <g filter="url(#glow)">${accessory}${body}${head}</g>
  </svg>`;

const characterSvg = (definition: CharacterDefinition): string => {
  if (definition.silhouette === "rune-dwarf") {
    return baseCharacter(
      definition,
      `<circle cx="62" cy="37" r="22" fill="#dca46d" stroke="#f8fbff" stroke-width="3"/><path d="M38 30 Q62 4 88 30 L82 43 Q61 31 41 43 Z" fill="url(#metal)" stroke="#f8fbff" stroke-width="3"/><path d="M48 48 Q62 79 76 48 L84 80 Q62 100 40 80 Z" fill="#f1b45f" stroke="#fff4d6" stroke-width="3"/><circle cx="55" cy="37" r="3"/><circle cx="69" cy="37" r="3"/>`,
      `<path d="M35 67 Q61 49 88 67 L94 108 Q63 123 31 108 Z" fill="${definition.color}" stroke="#f8fbff" stroke-width="4"/><path d="M43 71 L81 71 L75 99 L48 99 Z" fill="#40271d" stroke="#ffcf6e" stroke-width="3"/><path d="M43 105 L34 120 M82 105 L93 120" stroke="#f8fbff" stroke-width="8" stroke-linecap="round"/>`,
      `<rect x="15" y="63" width="48" height="22" rx="9" fill="#26354d" stroke="#f8fbff" stroke-width="4"/><circle cx="18" cy="74" r="9" fill="#ffcf55"/><path d="M84 58 Q112 50 110 84" fill="none" stroke="#9a5b35" stroke-width="8"/><circle cx="105" cy="84" r="12" fill="#ff793e" stroke="#ffd59a" stroke-width="3"/>`,
      `<circle cx="63" cy="66" r="49" fill="${definition.color}" opacity=".12"/><path d="M20 25 L30 18 M100 22 L111 14 M108 101 L119 108" stroke="#ffb85c" stroke-width="3"/>`,
    );
  }

  if (definition.silhouette === "storm-corsair") {
    return baseCharacter(
      definition,
      `<path d="M38 30 Q62 7 91 28 L84 44 Q63 34 39 47 Z" fill="#18243b" stroke="#f8fbff" stroke-width="4"/><path d="M39 26 L92 31 L105 42 L83 45" fill="${definition.color}" stroke="#f8fbff" stroke-width="3"/><circle cx="61" cy="43" r="20" fill="#e7b27b" stroke="#f8fbff" stroke-width="3"/><path d="M39 48 Q59 58 83 47" fill="none" stroke="#26354e" stroke-width="5"/><circle cx="55" cy="41" r="3"/><circle cx="68" cy="41" r="3"/>`,
      `<path d="M34 62 Q61 49 90 63 L101 112 Q68 123 29 108 Z" fill="#244260" stroke="#f8fbff" stroke-width="4"/><path d="M50 61 L58 107 M76 60 L72 108" stroke="${definition.color}" stroke-width="5"/><path d="M42 106 L31 120 M85 106 L98 119" stroke="#f8fbff" stroke-width="7" stroke-linecap="round"/>`,
      `<path d="M89 63 L118 71 L111 85 L82 80 Z" fill="#29384c" stroke="#f8fbff" stroke-width="3"/><circle cx="112" cy="78" r="8" fill="${definition.color}"/><path d="M25 63 Q10 79 20 102" fill="none" stroke="${definition.color}" stroke-width="6"/>`,
      `<path d="M16 99 Q39 78 29 57 M107 104 Q92 79 105 55" fill="none" stroke="${definition.color}" stroke-width="3" opacity=".65"/><circle cx="63" cy="69" r="50" fill="${definition.color}" opacity=".09"/>`,
    );
  }

  if (definition.silhouette === "sky-marksman") {
    return baseCharacter(
      definition,
      `<circle cx="63" cy="38" r="20" fill="#c98667" stroke="#f8fbff" stroke-width="3"/><path d="M40 34 Q57 7 86 28 L92 44 Q71 31 42 48 Z" fill="#e8e1ff" stroke="#f8fbff" stroke-width="3"/><path d="M48 37 L79 37 L87 45 L76 50 L49 48 Z" fill="${definition.color}" opacity=".82"/><circle cx="56" cy="41" r="3"/><circle cx="70" cy="41" r="3"/>`,
      `<path d="M38 59 Q63 48 88 61 L91 109 Q63 121 35 108 Z" fill="#3a3157" stroke="#f8fbff" stroke-width="4"/><path d="M48 64 L78 64 L73 101 L51 101 Z" fill="url(#metal)"/><path d="M43 106 L34 120 M82 106 L92 120" stroke="#f8fbff" stroke-width="7" stroke-linecap="round"/>`,
      `<path d="M82 64 L119 55 L121 66 L84 77 Z" fill="#202d48" stroke="#f8fbff" stroke-width="3"/><circle cx="113" cy="61" r="8" fill="${definition.color}"/><path d="M34 73 L18 83 L26 102 L40 92" fill="#7565aa" stroke="#f8fbff" stroke-width="3"/>`,
      `<path d="M24 86 L13 74 M101 92 L116 80" stroke="${definition.color}" stroke-width="4"/><circle cx="63" cy="68" r="48" fill="${definition.color}" opacity=".11"/>`,
    );
  }

  const isRanger = definition.silhouette === "ranger";
  const head = isRanger
    ? `<path d="M73 18 L98 35 L86 47 Q68 38 48 48 L39 31 Z" fill="${definition.color}" stroke="#f8fbff" stroke-width="4"/>`
    : `<circle cx="67" cy="35" r="24" fill="${definition.color}" stroke="#f8fbff" stroke-width="4"/><rect x="43" y="24" width="48" height="14" rx="7" fill="#18243a"/>`;
  const accessory = isRanger
    ? `<path d="M96 50 Q119 82 91 113" fill="none" stroke="#f4d77d" stroke-width="6"/><path d="M92 58 L117 82 L94 84" fill="none" stroke="#f4d77d" stroke-width="4"/>`
    : `<rect x="20" y="63" width="42" height="19" rx="8" fill="#263b5b" stroke="#f8fbff" stroke-width="4"/><circle cx="23" cy="72" r="8" fill="#ffcf55"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><ellipse cx="64" cy="116" rx="38" ry="8" fill="#00000055"/>${head}<path d="M45 53 Q64 43 83 53 L91 105 Q64 119 37 105 Z" fill="${definition.color}" stroke="#f8fbff" stroke-width="4"/><circle cx="57" cy="34" r="4" fill="#142033"/><circle cx="76" cy="34" r="4" fill="#142033"/>${accessory}<path d="M43 104 L35 119 M83 104 L93 119" stroke="#f8fbff" stroke-width="7" stroke-linecap="round"/></svg>`;
};

const hash = (content: string): string => createHash("sha256").update(content).digest("hex").slice(0, 12);

const build = (): void => {
  const definitions = loadDefinitions();
  validateDefinitions(definitions);
  mkdirSync(imagesDir, { recursive: true });

  const files: Array<Record<string, unknown>> = [];
  const catalog = {
    generatedAt: new Date().toISOString(),
    signature: "Tehkné Solutions",
    weapons: [] as Array<Record<string, unknown>>,
    characters: [] as Array<Record<string, unknown>>,
  };

  for (const definition of definitions) {
    const assetKey = `${definition.type}-${definition.id}`;
    const filename = `${assetKey}.svg`;
    const svg = definition.type === "weapon" ? weaponSvg(definition) : characterSvg(definition);
    writeFileSync(join(imagesDir, filename), svg);
    files.push({ type: "svg", key: assetKey, url: `assets/generated/images/${filename}` });
    const entry = { ...definition, assetKey, sourceHash: hash(JSON.stringify(definition)) };
    if (definition.type === "weapon") catalog.weapons.push(entry);
    else catalog.characters.push(entry);
  }

  writeFileSync(join(outputDir, "catalog.json"), JSON.stringify(catalog, null, 2));
  files.unshift({ type: "json", key: "arcshot-catalog", url: "assets/generated/catalog.json" });
  writeFileSync(join(outputDir, "asset-pack.json"), JSON.stringify({ arcshot: { files } }, null, 2));

  const cards = definitions.map((definition) => `<article><img src="images/${definition.type}-${definition.id}.svg" alt=""><div><span>${definition.type}</span><h2>${definition.name}</h2><p>${definition.description}</p><code>${definition.id}</code></div></article>`).join("\n");
  const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ArcShot Asset Catalog</title><style>body{margin:0;background:#08101f;color:#eaf2ff;font:16px system-ui;padding:40px}header{max-width:1100px;margin:auto auto 28px}h1{font-size:44px;margin:0}main{max-width:1100px;margin:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}article{display:flex;gap:18px;align-items:center;padding:20px;background:#111d33;border:1px solid #294064;border-radius:18px}img{width:104px;height:104px;object-fit:contain}span{color:#79d8ff;text-transform:uppercase;font-size:12px;letter-spacing:.15em}h2{margin:4px 0 8px}p{color:#aebbd0;line-height:1.45}code{color:#ffcf55}footer{max-width:1100px;margin:32px auto;color:#7d8ba4}</style><body><header><span>Tehkné Solutions</span><h1>ArcShot Asset Catalog</h1><p>Gerado automaticamente a partir dos manifestos.</p></header><main>${cards}</main><footer>${definitions.length} itens validados.</footer></body></html>`;
  writeFileSync(join(outputDir, "catalog.html"), html);
  console.log(`Asset Factory: ${catalog.weapons.length} armas e ${catalog.characters.length} personagens gerados.`);
};

const validate = (): void => {
  const definitions = loadDefinitions();
  validateDefinitions(definitions);
  console.log(`Asset Factory: ${definitions.length} manifestos válidos.`);
};

const clean = (): void => {
  rmSync(outputDir, { recursive: true, force: true });
  console.log("Asset Factory: saída gerada removida.");
};

const command = process.argv[2] ?? "build";
if (command === "build") build();
else if (command === "validate") validate();
else if (command === "clean") clean();
else if (command === "watch") {
  build();
  let timer: NodeJS.Timeout | undefined;
  watch(definitionsDir, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { build(); } catch (error) { console.error(error); }
    }, 150);
  });
  console.log("Asset Factory observando asset-definitions...");
} else {
  throw new Error(`Comando desconhecido: ${command}`);
}
