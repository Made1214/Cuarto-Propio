# Flujo de git

Una rama por tema, commits pequeños a nombre de Made1214, PR a `main`, y limpieza de la rama local al fusionar. Todo se maneja con `scripts/git-flujo.sh`.

## Primera vez

```bash
scripts/git-flujo.sh instalar
```

Fija la identidad (`Made1214 <116743110+Made1214@users.noreply.github.com>`), activa los hooks de `.githooks/` y configura `fetch.prune`, `pull.ff only` y `push.autoSetupRemote`.

Además, una vez en GitHub: **Settings → General → Pull Requests → «Automatically delete head branches»**. Así la rama remota se borra sola al fusionar.

## Ciclo de cada tema

```bash
scripts/git-flujo.sh rama feat/diario-buscador       # 1. rama desde origin/main
# …trabajas…
scripts/git-flujo.sh commit "feat(diario): buscador por palabra" src/lib/diario src/app   # 2. commit
scripts/git-flujo.sh publicar                        # 3. push + enlace para abrir el PR
# …fusionas el PR en GitHub…
scripts/git-flujo.sh limpiar                         # 4. vuelve a main, la actualiza y borra la rama local
```

## Cuando ya mezclaste varios temas sin ramas

```bash
scripts/git-flujo.sh dividir
```

Agrupa los cambios sin commitear por tema (diario, listas, vitrina, audio, personalización, perfil, landing, acceso, base de datos, docs, herramientas…, según la ruta del archivo) y crea **una rama y un commit por tema**, todas desde `origin/main`. Los temas no se tocan entre sí, así que cada PR se revisa y se fusiona por separado. Antes de mover nada guarda una copia de seguridad (`git stash` y `refs/dividir/ultimo`). Para agregar un tema nuevo, una línea en `tema_de` dentro del script.

## Reglas

- **Ramas**: `tipo/palabras-con-guiones` (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`). Sin «claude» en el nombre.
- **Commits**: `tipo(área): resumen en minúsculas` — por ejemplo `fix(audio): reintento al perder conexión`. Un commit = una idea; si dos cambios no dependen entre sí, van en commits (o ramas) distintos.
- **Autoría**: siempre Made1214, como autora y committer. El hook `commit-msg` borra cualquier `Co-Authored-By: Claude…`, `Claude-Session:` o «Generated with Claude» y rechaza el commit si el autor no es Made1214.
- **`main` es solo de lectura local**: el hook `pre-commit` impide commitear directo; todo entra por PR.
- **Una rama = un PR**. Al fusionar, `limpiar` borra la rama local (también si el PR se fusionó con *squash*, que `git branch --merged` no detecta: usa el estado `[gone]` del remoto).
