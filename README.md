# Meu Treino

App (PWA) para registrar e acompanhar treinos de musculação: rotina, programa, plano, check-ins com nota por grupo muscular, calendário e estatísticas. Funciona offline; os dados ficam só no aparelho (há exportar/importar backup em ⚙️).

## Instalar no Galaxy Z Fold7
1. Faça merge desta branch na `main` e ative **Settings → Pages → Source: GitHub Actions** (o workflow publica sozinho).
2. No Chrome do celular, abra `https://igornoberto.github.io/gymprogram/`.
3. Menu ⋮ → **Adicionar à tela inicial / Instalar app**.

## Rodar localmente
```bash
python3 -m http.server 8123
```
Sem build nem dependências: `index.html`, `styles.css`, `app.js`, `sw.js`.
