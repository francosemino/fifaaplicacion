# FIFA/EA Sports FC Tournament Tracker — PRD

## Overview
Mobile app (Expo / React Native) for 4-5 friends to track FIFA/EA FC tournaments across game editions (FC 25, FC 26, FC 27...). Each edition has independent stats plus a global historic view.

## Core entities
- **Edition**: FC 25 / FC 26 / etc.
- **Player**: name + avatar (base64) + favorite team.
- **Championship**: league (round robin) within one edition.
- **Cup**: knockout bracket (F/SF/QF) within one edition.
- **Match**: championship or cup match with goals, teams, extra time, penalties.

## Key features implemented
- Dashboard with quick stats, ranking, recent champions, edition shortcuts.
- Editions list + per-edition view: ranking, "Campeón del FIFA" (most championships that edition), championships and cups.
- Players list, photo upload (gallery), full profile: totals, per-edition stats, vs rivals, biggest win/loss, streaks, championships/cups history, medals (Campeón FIFA, Rey de Campeonatos, Rey de Copas, Goleador Histórico, Muro Defensivo, Pecho Frío).
- Championships: create with participants+teams+rounds, add matches, auto standings (3/1/0), finish → auto champion + runner-up, MVP/top scorer/best defense/biggest goleada awards.
- Cups: create (F/SF/QF), visual bracket with auto-advancement, score modal with penalties, auto third-place pairing, champion/runner-up/third place.
- Rivalries: head-to-head with wins, draws, goals and recent matches.
- Historial: campeones, records (biggest win, highest scoring), rankings (general, ofensivo, defensivo, efectividad).
- Demo seed with Franco / Tute / Tocruz / Rath + FC25/FC26 championships and cups.

## Stack
- Backend: FastAPI + MongoDB (motor). Routes under `/api`. UUID primary keys.
- Frontend: Expo Router, dark theme (`#0A0B0E` / gold `#D4AF37`), Unbounded + Manrope fonts, Ionicons.

## Seed endpoint
`POST /api/seed` resets the DB and loads 4 players + FC25 + FC26 with representative championships and cups.
