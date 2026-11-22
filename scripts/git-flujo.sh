#!/usr/bin/env bash
# Flujo de git de Cuarto Propio: ramas por tema, commits a nombre de Made1214,
# y limpieza de las ramas locales una vez que el PR se fusionó.
#
#   scripts/git-flujo.sh instalar              configura identidad, hooks y limpieza automática
#   scripts/git-flujo.sh rama feat/nombre      crea la rama desde origin/main
#   scripts/git-flujo.sh dividir [tipo]        reparte los cambios sueltos en una rama + commit por tema
#   scripts/git-flujo.sh commit "msg" [arch…]  commit con identidad y formato verificados
#   scripts/git-flujo.sh publicar              sube la rama actual (y muestra el enlace para el PR)
#   scripts/git-flujo.sh limpiar               tras fusionar el PR: vuelve a main y borra las ramas locales ya fusionadas
#
# Guía completa: docs/flujo-git.md

set -euo pipefail

NOMBRE="Made1214"
CORREO="116743110+Made1214@users.noreply.github.com"
BASE="main"
TIPOS="feat|fix|docs|chore|refactor|test|style|perf"

raiz="$(git rev-parse --show-toplevel)"
cd "$raiz"

die() { echo "✗ $*" >&2; exit 1; }
ok()  { echo "✓ $*"; }

rama_actual() { git branch --show-current; }

# Identidad por variables de entorno: gana sobre cualquier config suelta,
# así ningún commit sale con otro autor aunque falte `instalar`.
export GIT_AUTHOR_NAME="$NOMBRE" GIT_AUTHOR_EMAIL="$CORREO"
export GIT_COMMITTER_NAME="$NOMBRE" GIT_COMMITTER_EMAIL="$CORREO"

nombre_ok() { [[ "$1" =~ ^($TIPOS)/[a-z0-9][a-z0-9-]*$ ]]; }

# ───────────────────────── instalar ─────────────────────────
cmd_instalar() {
  git config user.name "$NOMBRE"
  git config user.email "$CORREO"
  git config core.hooksPath .githooks
  git config fetch.prune true          # al traer, olvida ramas remotas ya borradas
  git config pull.ff only              # main solo avanza, nunca crea merges sueltos
  git config push.autoSetupRemote true # el primer push enlaza la rama sola
  chmod +x .githooks/* scripts/git-flujo.sh 2>/dev/null || true
  ok "Identidad: $NOMBRE <$CORREO>"
  ok "Hooks en .githooks (sin firmas de Claude, sin commits directos a $BASE)"
  echo
  echo "Falta un ajuste en GitHub (una sola vez):"
  echo "  Repo → Settings → General → Pull Requests → ✔ Automatically delete head branches"
  echo "  (así la rama remota se borra sola al fusionar; 'limpiar' borra la local)."
}

# ───────────────────────── rama ─────────────────────────
cmd_rama() {
  local nombre="${1:-}"
  [[ -n "$nombre" ]] || die "Uso: git-flujo.sh rama <tipo>/<nombre>   (ej. feat/diario-buscador)"
  nombre_ok "$nombre" || die "Nombre inválido. Formato: ($TIPOS)/palabras-con-guiones, sin mayúsculas."
  [[ "$nombre" != *claude* ]] || die "El nombre de la rama no puede llevar «claude»."
  git fetch origin "$BASE" --quiet
  git switch -c "$nombre" "origin/$BASE"
  ok "Rama $nombre creada desde origin/$BASE"
}

# ───────────────────────── dividir ─────────────────────────
# Tema de cada archivo según su ruta. Un tema nuevo = una línea aquí.
tema_de() {
  case "$1" in
    supabase/*|*migrations/*)            echo "base-de-datos" ;;
    docs/*|README.md|CLAUDE.md|AGENTS.md) echo "docs" ;;
    *diario*)                            echo "diario" ;;
    *listas*)                            echo "listas" ;;
    *vitrina*|*imagenes*)                echo "vitrina" ;;
    *audio*)                             echo "audio" ;;
    *personalizacion*|*temas*|*cursores*|*iconos*|*decoracion-tema*) echo "personalizacion" ;;
    *perfil*)                            echo "perfil" ;;
    *landing*)                           echo "landing" ;;
    *'(auth)'*|*auth*|*login*|*registro*) echo "acceso" ;;
    *storage*)                           echo "almacenamiento" ;;
    package*.json|*.config.*|*.mjs|.github/*|.githooks/*|scripts/*) echo "herramientas" ;;
    *)                                   echo "varios" ;;
  esac
}

tipo_de_tema() {
  case "$1" in
    docs) echo "docs" ;;
    herramientas) echo "chore" ;;
    *) echo "${TIPO_FORZADO:-feat}" ;;
  esac
}

cmd_dividir() {
  TIPO_FORZADO="${1:-}"
  [[ -z "$TIPO_FORZADO" ]] || [[ "$TIPO_FORZADO" =~ ^($TIPOS)$ ]] || die "Tipo inválido: $TIPO_FORZADO"
  git fetch origin "$BASE" --quiet

  mapfile -d '' archivos < <(git ls-files -z -m -o -d --exclude-standard)
  # git ls-files repite los archivos con varios estados; quedamos con únicos.
  mapfile -t archivos < <(printf '%s\n' "${archivos[@]}" | tr -d '\0' | sort -u)
  [[ ${#archivos[@]} -gt 0 && -n "${archivos[0]}" ]] || die "No hay cambios para repartir."

  # Foto del árbol de trabajo (sin tocarlo): si algo falla, nada se pierde.
  local idx tree snap
  idx="$(mktemp)"; rm -f "$idx"
  GIT_INDEX_FILE="$idx" git add -A
  tree="$(GIT_INDEX_FILE="$idx" git write-tree)"
  rm -f "$idx"
  snap="$(git commit-tree "$tree" -p HEAD -m "dividir: foto de seguridad")"
  git update-ref refs/dividir/ultimo "$snap"

  declare -A grupos=()
  local f t
  for f in "${archivos[@]}"; do
    t="$(tema_de "$f")"
    grupos[$t]+="$f"$'\n'
  done

  echo "Temas encontrados:"
  for t in $(printf '%s\n' "${!grupos[@]}" | sort); do
    echo "  • $t ($(printf '%s' "${grupos[$t]}" | grep -c .) archivos)"
  done
  echo
  read -r -p "¿Crear una rama y un commit por cada tema? [s/N] " r
  [[ "$r" =~ ^[sS]$ ]] || die "Cancelado. No se tocó nada."

  local origen; origen="$(rama_actual)"
  git stash push -u -m "dividir: cambios originales" >/dev/null
  ok "Cambios guardados en el stash y en refs/dividir/ultimo (red de seguridad)"

  local fecha tipo rama msg
  fecha="$(date +%m%d)"
  for t in $(printf '%s\n' "${!grupos[@]}" | sort); do
    tipo="$(tipo_de_tema "$t")"
    rama="$tipo/$t-$fecha"
    git show-ref --verify --quiet "refs/heads/$rama" && rama="$rama-2"
    git switch -c "$rama" "origin/$BASE" --quiet
    while IFS= read -r f; do
      [[ -n "$f" ]] || continue
      if git cat-file -e "$snap:$f" 2>/dev/null; then
        git checkout "$snap" -- "$f"
      else
        git rm -q --ignore-unmatch -- "$f"
      fi
    done <<< "${grupos[$t]}"
    msg="$tipo($t): actualizar $t"
    read -r -p "Mensaje para [$rama] (Enter = «$msg»): " m
    git -c core.hooksPath=.githooks commit -q -m "${m:-$msg}"
    ok "$rama → $(git log -1 --format=%s)"
    git switch "$BASE" --quiet 2>/dev/null || git switch --detach "origin/$BASE" --quiet
  done

  git stash drop -q
  ok "Listo. Cada tema quedó en su rama. Sube cada una con: git switch <rama> && scripts/git-flujo.sh publicar"
  [[ "$origen" == "$BASE" || -z "$origen" ]] || echo "(Estabas en '$origen'; sus commits no se tocaron.)"
}

# ───────────────────────── commit ─────────────────────────
cmd_commit() {
  local msg="${1:-}"; shift || true
  [[ -n "$msg" ]] || die "Uso: git-flujo.sh commit \"tipo(área): mensaje\" [archivos…]"
  [[ "$msg" =~ ^($TIPOS)(\([a-z0-9-]+\))?!?:\ .+ ]] \
    || die "El mensaje debe ser tipo(área): resumen   (ej. feat(diario): buscador por palabra)"
  [[ "$(rama_actual)" != "$BASE" ]] || die "No se hace commit directo a $BASE. Crea una rama con 'rama'."
  if [[ $# -gt 0 ]]; then git add -- "$@"; fi
  git diff --cached --quiet && die "No hay nada en staging. Pasa archivos o usa 'git add -p'."
  git commit -m "$msg"
}

# ───────────────────────── publicar ─────────────────────────
cmd_publicar() {
  local rama; rama="$(rama_actual)"
  [[ -n "$rama" && "$rama" != "$BASE" ]] || die "Estás en $BASE; publica desde una rama de tema."
  [[ "$rama" != *claude* ]] || die "La rama '$rama' lleva «claude» en el nombre. Renómbrala: git branch -m <tipo>/<nombre>"
  git push -u origin "$rama"
  local url; url="$(git remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')"
  echo
  echo "Abre el PR: https://github.com/$url/compare/$BASE...$rama?expand=1"
  echo "Al fusionarlo: scripts/git-flujo.sh limpiar"
}

# ───────────────────────── limpiar ─────────────────────────
cmd_limpiar() {
  git switch "$BASE" --quiet
  git fetch origin --prune --quiet
  git pull --ff-only --quiet origin "$BASE"
  ok "$BASE al día con origin/$BASE"
  local b borradas=0
  # 1) ramas cuyo remoto ya no existe (PR fusionado + «borrar rama» de GitHub; también squash)
  while read -r b; do
    [[ -n "$b" && "$b" != "$BASE" ]] || continue
    git branch -D "$b" >/dev/null && ok "Borrada $b (su PR ya se fusionó)" && borradas=$((borradas+1))
  done < <(git for-each-ref --format='%(refname:short) %(upstream:track)' refs/heads | awk '$2=="[gone]"{print $1}')
  # 2) ramas ya contenidas en main
  while read -r b; do
    [[ -n "$b" && "$b" != "$BASE" ]] || continue
    git branch -d "$b" >/dev/null && ok "Borrada $b (ya está en $BASE)" && borradas=$((borradas+1))
  done < <(git branch --merged "$BASE" --format='%(refname:short)')
  [[ $borradas -gt 0 ]] || echo "Nada que limpiar."
  echo; git branch -vv
}

case "${1:-}" in
  instalar) shift; cmd_instalar "$@" ;;
  rama)     shift; cmd_rama "$@" ;;
  dividir)  shift; cmd_dividir "$@" ;;
  commit)   shift; cmd_commit "$@" ;;
  publicar) shift; cmd_publicar "$@" ;;
  limpiar)  shift; cmd_limpiar "$@" ;;
  *) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
