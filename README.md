# GuennaDiary

```
alt!(banner.png)

```
## ✦ Vista general

```
┌─────────────────┬──────────────────────────────┐
│                 │   HOY                        │
│   CALENDARIO    │   Tareas del día con hora    │
│   Mes actual    ├──────────────────────────────┤
│   Eventos por   │   PENDIENTES                 │
│   día           │   Backlog con prioridades    │
└─────────────────┴──────────────────────────────┘
```

---

## ✦ Funcionalidades

### 📅 Calendario
- Navega mes a mes con las flechas
- Selecciona cualquier día para ver y añadir eventos
- Los días con eventos muestran un punto rojo
- El día actual aparece resaltado

### ⚡ Tareas de hoy
- Añade tareas específicas para el día de hoy
- Hora opcional (con ordenación automática)
- Marca como completadas con un click
- Se ordenan: pendientes primero, luego por hora

### 📋 Pendientes (Backlog)
- Lista general de tareas a hacer
- Prioridades: **Alta** · **Media** · **Baja**
- Filtro rápido por prioridad
- Notas opcionales por tarea

### 💾 Persistencia
- Todo se guarda automáticamente en `localStorage`
- No necesita servidor ni base de datos
- Los datos persisten entre sesiones

---

## ✦ Uso

```bash
# Simplemente abre el archivo en tu navegador
open index.html

# O sírvelo con cualquier servidor estático
npx serve .
python -m http.server 8080
```

### GitHub Pages

1. Sube el repositorio a GitHub
2. Ve a **Settings → Pages**
3. En *Source*, selecciona `main` y carpeta `/root`
4. Tu agenda estará en `https://tuusuario.github.io/agenda`

---

## ✦ Atajos de teclado

| Tecla    | Acción                        |
|----------|-------------------------------|
| `Esc`    | Cerrar modal                  |
| `Enter`  | Guardar en modal              |

---

## ✦ Tecnologías

- HTML5 / CSS3 / JavaScript vanilla
- Google Fonts: `Space Mono` · `Zen Kaku Gothic New` · `Noto Serif JP`
- `localStorage` para persistencia
- Sin dependencias externas · Sin build · Sin frameworks

---

## ✦ Estética

Inspiración **Tokyo interface** — dark, mono, sharp.  
Paleta cromática de acento para estados: rojo · azul · verde · amarillo.  
Tipografía japonesa mezclada con monospace occidental.

---

<p align="center">
  made with intention by <strong>Guenna</strong>
</p>
