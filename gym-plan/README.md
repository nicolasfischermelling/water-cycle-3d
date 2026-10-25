# Gym Plan

Offline-first PWA for a 4-day lifting split + cardio. React + TypeScript + Vite, data in `localStorage`.

    npm install
    npm run dev      # http://localhost:5173 (also on LAN)
    npm run build    # outputs dist/

Hosting: serve `dist/` over HTTPS (GitHub Pages workflow included, or drag `dist/` onto Netlify Drop), open on the phone, then Share → Add to Home Screen (iOS Safari) or ⋮ → Install app (Android Chrome).

Data lives only in the browser on that device. Use Data → Export backup regularly.
