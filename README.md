# SMYS — INTRA HOSTEL CRICKET
## THE ULTIMATE PLAYER REGISTRATION, AUCTION & LIVE BROADCAST PLATFORM
### By 75th Sathpantha

A dynamic tournament management ecosystem designed with IPL auction visual quality, real-time multi-tab synchronization, Web Audio gavel sound effects, and full CRUD control over teams and players.

---

## 🌟 The Portals

| Portal | URL Route | Description |
|---|---|---|
| **Public Live Auction** | `http://localhost:5173/` (or `/live`) | Dramatic dark stadium theme (`#0B1535`), live player spotlight, live bids, gavel strike SOLD celebration with confetti, ticker, franchise purse board. |
| **Player Registration** | `http://localhost:5173/register` | Mobile-first light theme, photo upload & URL preview, stats, role cards, 1-10 skill sliders with explicit NA, digital player pass. |
| **Admin Control Centre** | `http://localhost:5173/admin` | Navy sidebar, live KPIs, player verification (Approve/Reject/Correction/Delete/Add), team management (Create/Edit/Delete), automated squad balancing, live auction control deck, PDF reports, Supabase connector. |
| **Franchise Team Portal** | `http://localhost:5173/team` | Authenticated team bidding portal, budget tracking, one-click incremental bids, power raises, roster view for user-created teams. |

---

## 🛠️ Full Custom Control (No Hardcoded Data)

1. **Franchise Teams:**
   - Create your own teams with custom names, logos/emojis, team colors, captains, login credentials, initial purse balance, and max squad size.
   - **Edit** any team's details or purse at any time.
   - **Delete** any team with one click (with safety confirmation and automatic player unassignment).

2. **Players:**
   - Register new players through the public **Player Registration Portal** (`/register`).
   - Or add players directly from the **Admin Control Centre** with verified status.
   - **Approve, Reject, or Delete** any player from the tournament database.

---

## 🚀 Running the Platform

1. **Development Server:**
   ```bash
   npm run dev
   ```
   Server is live at: `http://localhost:5173/`

2. **Production Build:**
   ```bash
   npm run build
   ```

3. **Supabase Setup (Optional):**
   - Copy the schema in `src/supabase_schema.sql` and run it in your Supabase SQL Editor.
   - Enter your **Project URL** and **Anon Key** in **Admin Control Centre → Supabase Connector**.
