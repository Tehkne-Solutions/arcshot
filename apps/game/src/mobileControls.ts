interface KeySpec {
  key: string;
  code: string;
  keyCode: number;
}

const KEYS: Record<string, KeySpec> = {
  left: { key: "a", code: "KeyA", keyCode: 65 },
  right: { key: "d", code: "KeyD", keyCode: 68 },
  angleUp: { key: "w", code: "KeyW", keyCode: 87 },
  angleDown: { key: "s", code: "KeyS", keyCode: 83 },
  powerDown: { key: "q", code: "KeyQ", keyCode: 81 },
  powerUp: { key: "e", code: "KeyE", keyCode: 69 },
  fire: { key: " ", code: "Space", keyCode: 32 },
  mode: { key: "Tab", code: "Tab", keyCode: 9 },
  menu: { key: "Escape", code: "Escape", keyCode: 27 },
  restart: { key: "r", code: "KeyR", keyCode: 82 },
  weapon1: { key: "1", code: "Digit1", keyCode: 49 },
  weapon2: { key: "2", code: "Digit2", keyCode: 50 },
  weapon3: { key: "3", code: "Digit3", keyCode: 51 },
  weapon4: { key: "4", code: "Digit4", keyCode: 52 },
};

function emitKeyboardEvent(type: "keydown" | "keyup", spec: KeySpec): void {
  const event = new KeyboardEvent(type, {
    key: spec.key,
    code: spec.code,
    bubbles: true,
    cancelable: true,
  });

  Object.defineProperties(event, {
    keyCode: { get: () => spec.keyCode },
    which: { get: () => spec.keyCode },
  });

  window.dispatchEvent(event);
}

function releaseAll(activeKeys: Set<string>): void {
  for (const keyName of activeKeys) {
    const spec = KEYS[keyName];
    if (spec) emitKeyboardEvent("keyup", spec);
  }
  activeKeys.clear();
}

export function installMobileControls(): void {
  const forced = new URLSearchParams(window.location.search).has("touch");
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (!forced && !coarsePointer && navigator.maxTouchPoints === 0) return;
  if (document.getElementById("arcshot-touch-controls")) return;

  const root = document.createElement("section");
  root.id = "arcshot-touch-controls";
  root.className = "touch-controls";
  root.setAttribute("aria-label", "Controles de toque do ArcShot");
  root.innerHTML = `
    <div class="touch-weapons" aria-label="Seleção de arma">
      <button type="button" data-key="weapon1" aria-label="Arma 1">1</button>
      <button type="button" data-key="weapon2" aria-label="Arma 2">2</button>
      <button type="button" data-key="weapon3" aria-label="Arma 3">3</button>
      <button type="button" data-key="weapon4" aria-label="Arma 4">4</button>
    </div>

    <div class="touch-cluster touch-movement" aria-label="Movimento">
      <button type="button" data-key="left" data-hold aria-label="Mover para esquerda">◀</button>
      <button type="button" data-key="right" data-hold aria-label="Mover para direita">▶</button>
    </div>

    <div class="touch-cluster touch-adjustments" aria-label="Ajustes do disparo">
      <button type="button" data-key="angleDown" data-hold aria-label="Diminuir ângulo">Â−</button>
      <button type="button" data-key="angleUp" data-hold aria-label="Aumentar ângulo">Â+</button>
      <button type="button" data-key="powerDown" data-hold aria-label="Diminuir potência">P−</button>
      <button type="button" data-key="powerUp" data-hold aria-label="Aumentar potência">P+</button>
    </div>

    <div class="touch-cluster touch-actions" aria-label="Ações">
      <button type="button" class="touch-secondary" data-key="mode" aria-label="Alternar modo de mira">MIRA</button>
      <button type="button" class="touch-fire" data-key="fire" aria-label="Disparar">FOGO</button>
    </div>

    <button type="button" class="touch-menu" data-key="menu" aria-label="Voltar ao menu">MENU</button>
    <div class="orientation-hint" role="status">Gire o dispositivo para jogar na horizontal.</div>
  `;

  document.body.append(root);
  const activeKeys = new Set<string>();

  for (const button of root.querySelectorAll<HTMLButtonElement>("button[data-key]")) {
    const keyName = button.dataset.key;
    const spec = keyName ? KEYS[keyName] : undefined;
    if (!keyName || !spec) continue;

    const release = (event?: Event): void => {
      event?.preventDefault();
      if (!activeKeys.has(keyName)) return;
      emitKeyboardEvent("keyup", spec);
      activeKeys.delete(keyName);
      button.classList.remove("is-pressed");
    };

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      if (activeKeys.has(keyName)) return;
      activeKeys.add(keyName);
      button.classList.add("is-pressed");
      emitKeyboardEvent("keydown", spec);

      if (!button.hasAttribute("data-hold")) {
        window.setTimeout(() => release(), 70);
      }
    });

    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  window.addEventListener("blur", () => releaseAll(activeKeys));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseAll(activeKeys);
  });
}
