# Workout Backend diagrams

Documentation-ready diagrams generated from the current project source:

- `class-diagram.svg` / `.png`: logical UML class view of services, repositories, and infrastructure.
- `erd-diagram.svg` / `.png`: all 22 Prisma models, keys, main fields, relations, and cardinalities.
- `usecase-diagram.svg` / `.png`: implemented use cases by Guest, Player, Trainer, Admin, and external systems.

Ground truth used:

- `prisma/schema.prisma`
- `src/app.js`
- `src/modules/**/routes/*.routes.js`
- `src/modules/**/service/*.service.js`
- `src/modules/**/repository/*.repository.js`

Important scope note: `chat` and `location` are not shown as implemented use cases because their current route files only contain TODO placeholders.

To regenerate the SVG sources:

```powershell
node docs/diagrams/generate-diagrams.js
```

PNG files are raster exports of the SVG originals. Prefer SVG in Word/Google Docs when supported because it stays sharp at any zoom level.
