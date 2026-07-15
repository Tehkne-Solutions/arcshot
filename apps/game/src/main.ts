import "./style.css";
import { installMobileControls } from "./mobileControls";
import { initialiseArcshotTheme } from "./ui/theme";

initialiseArcshotTheme();

const app = document.getElementById("app");
if (!app) throw new Error("Elemento raiz #app não encontrado.");

const bootStatus = document.createElement("div");
bootStatus.className = "boot-status";
bootStatus.innerHTML = `
  <strong>ARCSHOT</strong>
  <span>Inicializando campo de batalha...</span>
`;
app.append(bootStatus);

installMobileControls();
window.addEventListener("arcshot:ready", () => bootStatus.remove(), { once: true });

void import("./game").catch((error: unknown) => {
  console.error("Falha ao iniciar ArcShot", error);
  bootStatus.classList.add("boot-status-error");
  bootStatus.innerHTML = `
    <strong>FALHA AO INICIAR</strong>
    <span>Recarregue a página. Se o problema continuar, consulte o console.</span>
  `;
});
