export type PremiumArenaKey = "premium-storm" | "premium-forge" | "premium-harbor";

const svgDataUri = (markup: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup.replace(/\s{2,}/g, " ").trim())}`;

const stars = Array.from({ length: 54 }, (_, index) => {
  const x = (index * 173 + 37) % 1280;
  const y = 34 + ((index * 89) % 360);
  const radius = index % 9 === 0 ? 2.1 : index % 4 === 0 ? 1.4 : 0.8;
  const opacity = 0.22 + (index % 5) * 0.12;
  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="#fff" opacity="${opacity}"/>`;
}).join("");

const city = Array.from({ length: 26 }, (_, index) => {
  const x = 20 + index * 50;
  const height = 50 + ((index * 31) % 145);
  const width = 18 + ((index * 13) % 30);
  const top = 520 - height;
  const spire = index % 3 === 0 ? `<path d="M${x} ${top} l${width / 2} -30 l${width / 2} 30Z" fill="#17112e"/>` : "";
  const windows = Array.from({ length: Math.max(1, Math.floor(height / 34)) }, (_, row) =>
    `<rect x="${x + 6}" y="${top + 12 + row * 28}" width="3" height="7" rx="1" fill="#45d9ff" opacity="${0.2 + (row % 3) * 0.18}"/>`,
  ).join("");
  return `<g>${spire}<rect x="${x}" y="${top}" width="${width}" height="${height}" rx="3" fill="#17112e" opacity=".88"/>${windows}</g>`;
}).join("");

const floatingIsland = (x: number, y: number, scale: number, accent: string, buildings = true): string => `
  <g transform="translate(${x} ${y}) scale(${scale})" filter="url(#shadow)">
    <ellipse cx="0" cy="0" rx="126" ry="22" fill="#20152f" stroke="${accent}" stroke-opacity=".34" stroke-width="3"/>
    <path d="M-116 0 C-92 72 -54 118 0 156 C54 118 94 70 116 0Z" fill="url(#rock)"/>
    <path d="M-103 -5 C-70 -24 72 -24 104 -4 L92 14 C58 2 -64 3 -94 16Z" fill="#283d36"/>
    <path d="M-76 16 C-45 5 44 6 78 14" fill="none" stroke="${accent}" stroke-width="5" opacity=".48"/>
    ${buildings ? `<g transform="translate(-62 -98)">
      <rect x="0" y="38" width="124" height="72" rx="6" fill="#221632" stroke="#ad78ff" stroke-opacity=".45"/>
      <path d="M-10 40 L18 3 L42 40 L65 -8 L90 40 L112 8 L140 40Z" fill="#291946"/>
      <rect x="18" y="55" width="8" height="24" rx="3" fill="${accent}" opacity=".8"/>
      <rect x="58" y="50" width="9" height="30" rx="3" fill="${accent}" opacity=".72"/>
      <rect x="99" y="57" width="8" height="22" rx="3" fill="${accent}" opacity=".8"/>
    </g>` : ""}
  </g>`;

const makeBackground = (key: PremiumArenaKey): string => {
  const palette = key === "premium-forge"
    ? { top: "#17091c", mid: "#5a203f", horizon: "#ff7d46", accent: "#ff9b4d", second: "#ff4f73" }
    : key === "premium-harbor"
      ? { top: "#07172f", mid: "#174d72", horizon: "#ff9b68", accent: "#52dcff", second: "#ffc45d" }
      : { top: "#0c0924", mid: "#4a245f", horizon: "#ff8a69", accent: "#70e6ff", second: "#bd7cff" };

  const forge = key === "premium-forge" ? `
    <g opacity=".95" transform="translate(1050 302)">
      <rect x="-64" y="-108" width="128" height="236" rx="18" fill="#23131f" stroke="#ff9b4d" stroke-opacity=".45" stroke-width="4"/>
      <circle cx="0" cy="8" r="44" fill="#ff6e37" opacity=".18" stroke="#ffae62" stroke-width="5"/>
      <circle cx="0" cy="8" r="18" fill="#ff8a42" filter="url(#glow)"/>
      <path d="M-38 -122 v-112 M20 -122 v-154" stroke="#3c1e24" stroke-width="24"/>
      <g fill="#493037" opacity=".55"><ellipse cx="-32" cy="-250" rx="50" ry="27"/><ellipse cx="28" cy="-286" rx="72" ry="36"/><ellipse cx="66" cy="-330" rx="95" ry="45"/></g>
    </g>` : "";

  const portal = key === "premium-storm" ? `
    <g transform="translate(1134 245)" filter="url(#shadow)">
      <path d="M-110 214 V30 Q0 -86 110 30 V214 H66 V50 Q0 -28 -66 50 V214Z" fill="#21152e" stroke="#9b67e9" stroke-width="4"/>
      <path d="M0 -32 l38 56 l-38 58 l-38 -58Z" fill="url(#crystal)" stroke="#eadcff" stroke-width="5" filter="url(#glow)"/>
      <path d="M-72 35 L-22 10 M72 35 L22 10 M-80 96 L-28 72 M80 96 L28 72" stroke="#d18cff" stroke-width="5" opacity=".45"/>
    </g>
    <g stroke="#e3d1ff" stroke-width="4" fill="none" opacity=".75" filter="url(#glow)">
      <path d="M1070 0 L1040 72 L1096 118 L1068 190"/><path d="M1190 0 L1150 64 L1197 126 L1170 205"/><path d="M1260 20 L1224 84 L1268 145"/>
    </g>` : "";

  const harbor = key === "premium-harbor" ? `
    <g transform="translate(650 160)" filter="url(#shadow)">
      <ellipse cx="0" cy="-36" rx="112" ry="46" fill="#385875" stroke="#8aeaff" stroke-opacity=".45" stroke-width="4"/>
      <path d="M-82 -34 L84 -34 L62 22 L-62 22Z" fill="#2a2639" stroke="#d39855" stroke-width="4"/>
      <rect x="-38" y="16" width="76" height="28" rx="8" fill="#5b3828" stroke="#ffc45d" stroke-width="3"/>
      <circle cx="92" cy="0" r="24" fill="none" stroke="#ffc45d" stroke-width="6"/>
      <path d="M-98 3 L-148 24 L-106 46Z" fill="#e4655b"/>
    </g>` : "";

  return svgDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${palette.top}"/><stop offset=".58" stop-color="${palette.mid}"/><stop offset="1" stop-color="${palette.horizon}"/></linearGradient>
      <linearGradient id="rock" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#382a46"/><stop offset="1" stop-color="#090814"/></linearGradient>
      <linearGradient id="crystal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#60e7ff"/><stop offset=".48" stop-color="#5a72ff"/><stop offset="1" stop-color="#d178ff"/></linearGradient>
      <radialGradient id="sun"><stop stop-color="#ffd8a0" stop-opacity=".92"/><stop offset=".35" stop-color="#ff9471" stop-opacity=".58"/><stop offset="1" stop-color="#ff6a8f" stop-opacity="0"/></radialGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="shadow"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#05020d" flood-opacity=".7"/></filter>
    </defs>
    <rect width="1280" height="720" fill="url(#sky)"/><circle cx="640" cy="490" r="265" fill="url(#sun)" opacity=".82"/>${stars}
    <g opacity=".18" fill="#fff"><ellipse cx="175" cy="215" rx="135" ry="36"/><ellipse cx="280" cy="235" rx="100" ry="30"/><ellipse cx="830" cy="180" rx="150" ry="38"/><ellipse cx="940" cy="205" rx="110" ry="30"/></g>
    ${floatingIsland(230, 205, .9, palette.accent)}${floatingIsland(862, 168, .72, palette.second)}${floatingIsland(1040, 310, .42, palette.accent, false)}${harbor}${portal}${forge}
    <g transform="translate(0 36)" opacity=".9">${city}</g>
    <path d="M0 545 C170 490 300 518 430 552 C585 592 728 510 860 535 C1020 566 1130 520 1280 540 V720 H0Z" fill="#0a0a18" opacity=".65"/>
    <rect y="560" width="1280" height="160" fill="#07182a" opacity=".32"/><g opacity=".34" stroke="${palette.accent}" stroke-width="2" fill="none"><path d="M0 612 Q90 585 180 612 T360 612 T540 612 T720 612 T900 612 T1080 612 T1260 612"/><path d="M0 638 Q100 615 200 638 T400 638 T600 638 T800 638 T1000 638 T1200 638"/></g>
  </svg>`);
};

const BRASK = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="0 0 260 260"><defs><linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#dbe9f2"/><stop offset=".35" stop-color="#627a91"/><stop offset=".72" stop-color="#243647"/><stop offset="1" stop-color="#0e1721"/></linearGradient><linearGradient id="brass"><stop stop-color="#ffd36a"/><stop offset=".48" stop-color="#b16b21"/><stop offset="1" stop-color="#4f250d"/></linearGradient><linearGradient id="beard"><stop stop-color="#ff9b42"/><stop offset=".55" stop-color="#c14f19"/><stop offset="1" stop-color="#5d210d"/></linearGradient><radialGradient id="core"><stop stop-color="#fff"/><stop offset=".25" stop-color="#7cecff"/><stop offset="1" stop-color="#0874e8"/></radialGradient><filter id="g"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="s"><feDropShadow dx="0" dy="7" stdDeviation="5" flood-color="#03050a" flood-opacity=".8"/></filter></defs><ellipse cx="118" cy="226" rx="92" ry="19" fill="#02050a" opacity=".55"/><g filter="url(#s)" stroke="#101621" stroke-width="5" stroke-linejoin="round"><path d="M55 181 Q42 194 46 220 H94 L100 191Z" fill="url(#steel)"/><path d="M111 191 L118 222 H166 Q172 198 158 182Z" fill="url(#steel)"/><path d="M52 110 Q31 122 31 159 Q31 188 54 198 L81 174 L76 118Z" fill="url(#steel)"/><circle cx="44" cy="143" r="24" fill="url(#steel)"/><circle cx="44" cy="143" r="11" fill="url(#brass)"/><path d="M72 93 Q91 66 126 70 Q160 74 168 105 L159 178 Q135 199 91 190 Q65 172 64 135Z" fill="url(#steel)"/><path d="M88 85 Q103 55 132 58 Q153 61 164 83 L152 104 H94Z" fill="#5a6572"/><path d="M100 74 Q114 52 132 57 Q143 60 149 73" fill="none" stroke="url(#brass)" stroke-width="9"/><circle cx="113" cy="78" r="14" fill="#0c1d29" stroke="url(#brass)"/><circle cx="113" cy="78" r="7" fill="url(#core)" stroke-width="2" filter="url(#g)"/><path d="M94 102 Q112 91 133 103 Q151 118 145 154 Q139 180 119 191 Q91 175 84 143 Q79 116 94 102Z" fill="url(#beard)" stroke="#5c250e"/><path d="M95 116 Q108 127 119 112 Q130 128 143 116 M94 142 Q109 154 120 139 Q130 154 143 141 M101 167 Q117 177 135 164" fill="none" stroke="#ffb35c" stroke-width="5" opacity=".72"/><path d="M72 116 Q54 109 46 124 L64 145 L84 135Z" fill="url(#brass)"/><path d="M150 115 Q166 96 181 107 L176 139 L153 143Z" fill="url(#brass)"/><g transform="translate(134 91) rotate(-5)"><path d="M0 42 L26 18 H83 L116 34 L104 78 H33 L6 62Z" fill="url(#steel)"/><rect x="25" y="29" width="70" height="39" rx="12" fill="#253a4c" stroke="url(#brass)"/><path d="M45 29 V68 M68 29 V68" stroke="#80a0b8" stroke-width="4"/><ellipse cx="105" cy="51" rx="26" ry="32" fill="url(#brass)"/><ellipse cx="109" cy="51" rx="17" ry="23" fill="#0c2941" stroke="#53deff" stroke-width="4" filter="url(#g)"/><ellipse cx="112" cy="51" rx="9" ry="14" fill="url(#core)" stroke-width="2"/><circle cx="9" cy="52" r="14" fill="url(#brass)"/></g><path d="M73 160 Q54 164 53 184 Q67 197 85 187 L96 167Z" fill="url(#steel)"/><circle cx="73" cy="178" r="13" fill="url(#brass)"/><path d="M86 185 H154" stroke="url(#brass)" stroke-width="9"/></g><g fill="#61e7ff" filter="url(#g)"><circle cx="71" cy="128" r="4"/><circle cx="154" cy="151" r="4"/><path d="M105 194 l8 -12 l8 12 l-8 12Z"/></g></svg>`);

const KAEL = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="0 0 260 260"><defs><linearGradient id="coat" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7047a2"/><stop offset=".45" stop-color="#2b183f"/><stop offset="1" stop-color="#120b1d"/></linearGradient><linearGradient id="gold"><stop stop-color="#ffe179"/><stop offset=".5" stop-color="#be7224"/><stop offset="1" stop-color="#5f2b0c"/></linearGradient><linearGradient id="gun"><stop stop-color="#a7b9c9"/><stop offset=".45" stop-color="#4d6077"/><stop offset="1" stop-color="#172234"/></linearGradient><radialGradient id="storm"><stop stop-color="#fff"/><stop offset=".28" stop-color="#c8a0ff"/><stop offset="1" stop-color="#6b27e8"/></radialGradient><filter id="g"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="s"><feDropShadow dx="0" dy="7" stdDeviation="5" flood-color="#03050a" flood-opacity=".8"/></filter></defs><ellipse cx="136" cy="228" rx="87" ry="18" fill="#02050a" opacity=".55"/><g filter="url(#s)" stroke="#100b19" stroke-width="5" stroke-linejoin="round"><path d="M104 179 L94 225 H130 L140 183Z" fill="#1a1a28"/><path d="M153 183 L158 225 H198 L184 176Z" fill="#181621"/><path d="M111 96 Q128 73 158 77 Q188 83 198 113 L187 177 Q158 199 119 183 Q99 158 103 122Z" fill="url(#coat)"/><path d="M121 102 Q139 92 158 103 Q174 113 174 139 Q171 158 153 168 Q131 160 123 141Z" fill="#d38b60"/><path d="M125 135 Q147 146 168 132" fill="none" stroke="#3b170d" stroke-width="5"/><path d="M128 119 Q139 111 147 119 M158 118 Q168 110 177 118" fill="none" stroke="#251019" stroke-width="5"/><path d="M109 85 Q135 48 175 58 Q203 64 215 91 Q180 80 151 87 Q126 93 100 101Z" fill="#2c193c" stroke="url(#gold)"/><path d="M141 64 Q158 39 178 64" fill="none" stroke="url(#gold)" stroke-width="8"/><path d="M150 69 l10 -13 l12 13 l-12 10Z" fill="#d8c0ff" stroke="#7e43db" stroke-width="3" filter="url(#g)"/><path d="M113 104 Q89 104 80 124 L93 151 L117 141Z" fill="url(#coat)"/><path d="M190 108 Q213 109 221 130 L207 154 L188 142Z" fill="url(#coat)"/><path d="M106 157 Q87 160 88 184 L111 194 L129 171Z" fill="url(#gold)"/><path d="M183 151 Q203 159 202 183 L180 192 L165 170Z" fill="url(#gold)"/><g transform="translate(16 112) rotate(3)"><path d="M0 27 L29 8 H121 L148 22 L139 60 H25 L0 46Z" fill="url(#gun)"/><rect x="32" y="17" width="83" height="34" rx="11" fill="#342451" stroke="url(#gold)"/><path d="M48 17 V51 M71 17 V51 M94 17 V51" stroke="#8c72b4" stroke-width="4"/><ellipse cx="15" cy="35" rx="22" ry="28" fill="url(#gold)"/><ellipse cx="12" cy="35" rx="13" ry="18" fill="#231040" stroke="#c58aff" stroke-width="4" filter="url(#g)"/><circle cx="126" cy="35" r="16" fill="url(#storm)" stroke="#b689ff" stroke-width="4" filter="url(#g)"/></g><path d="M132 173 Q151 185 178 171" fill="none" stroke="url(#gold)" stroke-width="9"/></g><g fill="none" stroke="#d4b5ff" stroke-width="4" filter="url(#g)" opacity=".95"><path d="M61 105 l-14 -15 l18 -12 l-10 -17"/><path d="M211 93 l17 -18 l-8 -17 l20 -16"/><path d="M220 142 l22 -10 l-8 -18"/></g></svg>`);

const LYRA = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="0 0 260 260"><defs><linearGradient id="armor"><stop stop-color="#f2f7ff"/><stop offset=".35" stop-color="#7d9fbe"/><stop offset=".72" stop-color="#263d5c"/><stop offset="1" stop-color="#10182a"/></linearGradient><linearGradient id="gold"><stop stop-color="#fff0a4"/><stop offset=".5" stop-color="#c69038"/><stop offset="1" stop-color="#5c3512"/></linearGradient><linearGradient id="cloth"><stop stop-color="#5d7cff"/><stop offset="1" stop-color="#211b6b"/></linearGradient><filter id="g"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="s"><feDropShadow dx="0" dy="7" stdDeviation="5" flood-color="#02050a" flood-opacity=".8"/></filter></defs><ellipse cx="126" cy="228" rx="82" ry="17" fill="#02050a" opacity=".55"/><g filter="url(#s)" stroke="#101827" stroke-width="5" stroke-linejoin="round"><path d="M87 177 L82 225 H119 L130 183Z" fill="url(#armor)"/><path d="M145 183 L154 225 H190 L180 174Z" fill="url(#armor)"/><path d="M82 99 Q105 72 139 77 Q171 80 188 108 L176 180 Q147 201 104 187 Q80 162 78 126Z" fill="url(#armor)"/><path d="M91 96 Q116 55 154 63 Q181 69 193 97 L172 108 H102Z" fill="url(#cloth)" stroke="url(#gold)"/><path d="M107 98 Q126 83 149 94 Q167 105 166 132 Q160 157 137 166 Q113 154 106 130Z" fill="#d9a17b"/><path d="M108 113 L151 106 L166 119 L154 132 L113 130Z" fill="#1b2944" stroke="#70e6ff" stroke-width="4" filter="url(#g)"/><circle cx="144" cy="119" r="8" fill="#9ef4ff" filter="url(#g)"/><path d="M91 116 Q67 119 64 143 L82 162 L104 145Z" fill="url(#armor)"/><path d="M179 113 Q201 118 204 143 L187 161 L169 144Z" fill="url(#armor)"/><path d="M96 163 Q77 169 80 192 L104 199 L120 174Z" fill="url(#gold)"/><path d="M172 158 Q193 164 193 188 L169 195 L153 172Z" fill="url(#gold)"/><g transform="translate(28 112) rotate(-8)"><path d="M0 32 L32 13 H153 L179 28 L170 52 H31 L4 45Z" fill="#233b5e" stroke="url(#gold)"/><rect x="51" y="20" width="81" height="26" rx="8" fill="#152544" stroke="#69e7ff" stroke-width="3"/><path d="M70 20 V46 M94 20 V46 M118 20 V46" stroke="#597da7" stroke-width="3"/><circle cx="149" cy="33" r="16" fill="#99efff" stroke="#fff" stroke-width="3" filter="url(#g)"/><path d="M163 33 L198 19 L185 33 L198 47Z" fill="#d7f7ff" filter="url(#g)"/></g><path d="M102 178 Q128 194 163 176" fill="none" stroke="url(#gold)" stroke-width="8"/><path d="M76 116 L44 86 L62 142Z M190 110 L219 78 L206 141Z" fill="#6ddfff" opacity=".42" stroke="#e9fcff" stroke-width="3" filter="url(#g)"/></g></svg>`);

const PILLAR = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="110" height="250" viewBox="0 0 110 250"><defs><linearGradient id="gold"><stop stop-color="#ffe18b"/><stop offset=".48" stop-color="#a85d1f"/><stop offset="1" stop-color="#3f1f0b"/></linearGradient><linearGradient id="stone"><stop stop-color="#4c5265"/><stop offset="1" stop-color="#171924"/></linearGradient><filter id="g"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="s"><feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#02040a" flood-opacity=".8"/></filter></defs><g filter="url(#s)" stroke="#17100c" stroke-width="5" stroke-linejoin="round"><path d="M18 231 H92 L103 247 H7Z" fill="url(#gold)"/><rect x="22" y="49" width="66" height="185" rx="12" fill="url(#stone)" stroke="url(#gold)"/><rect x="34" y="65" width="42" height="150" rx="9" fill="#08263c" stroke="#57dfff" stroke-width="4"/><path d="M55 75 l12 18 l-12 18 l-12 -18Z M55 125 l12 18 l-12 18 l-12 -18Z M55 177 l12 18 l-12 18 l-12 -18Z" fill="none" stroke="#7defff" stroke-width="5" filter="url(#g)"/><path d="M8 46 L30 18 H80 L102 46 L86 66 H24Z" fill="url(#gold)"/><path d="M55 19 l18 22 l-18 20 l-18 -20Z" fill="#54dcff" stroke="#defaff" stroke-width="4" filter="url(#g)"/><path d="M13 84 H31 M79 84 H97 M13 188 H31 M79 188 H97" stroke="url(#gold)" stroke-width="8"/></g></svg>`);

const weaponSvg = (index: number): string => {
  const bodies = [
    `<path d="M20 68 L58 28 L76 45 L38 82Z" fill="#5de6ff"/><path d="M58 28 l10 -14 l14 14 l-6 17Z" fill="#fff"/>`,
    `<circle cx="48" cy="51" r="29" fill="#263c63" stroke="#75e8ff" stroke-width="5"/><path d="M45 22 Q54 5 67 18" stroke="#dca652" stroke-width="6" fill="none"/><circle cx="35" cy="43" r="7" fill="#fff" opacity=".55"/>`,
    `<path d="M20 62 Q48 18 76 62 L68 81 H28Z" fill="#465363" stroke="#d8aa5b" stroke-width="5"/><circle cx="48" cy="55" r="9" fill="#ff6d38"/><path d="M48 22 v18 M35 28 l8 14 M62 28 l-8 14" stroke="#ffcc69" stroke-width="5"/>`,
    `<circle cx="48" cy="48" r="32" fill="#2a1320" stroke="#ff9b42" stroke-width="5"/><path d="M48 15 l9 20 l22 2 l-17 14 l5 23 l-19 -12 l-19 12 l5 -23 l-17 -14 l22 -2Z" fill="#ffb84d"/><circle cx="48" cy="48" r="12" fill="#fff1b3"/>`,
  ];
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><defs><filter id="g"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="5" y="5" width="86" height="86" rx="14" fill="#08111f" stroke="#c98834" stroke-width="5"/><g filter="url(#g)">${bodies[index - 1]}</g></svg>`);
};

export const PREMIUM_TEXTURES: Record<string, string> = {
  "premium-bg-storm": makeBackground("premium-storm"),
  "premium-bg-forge": makeBackground("premium-forge"),
  "premium-bg-harbor": makeBackground("premium-harbor"),
  "premium-brask": BRASK,
  "premium-kael": KAEL,
  "premium-lyra": LYRA,
  "premium-pillar": PILLAR,
  "premium-weapon-1": weaponSvg(1),
  "premium-weapon-2": weaponSvg(2),
  "premium-weapon-3": weaponSvg(3),
  "premium-weapon-4": weaponSvg(4),
};

export function premiumTextureForCharacter(characterId: string): string {
  if (characterId === "storm-corsair") return "premium-kael";
  if (characterId === "celestial-marksman") return "premium-lyra";
  return "premium-brask";
}

export function premiumBackgroundFor(characterId: string, challenge: boolean): string {
  if (challenge || characterId === "storm-corsair") return "premium-bg-storm";
  if (characterId === "rune-bombardier") return "premium-bg-forge";
  return "premium-bg-harbor";
}
