# Deploy PuppyTracker på Vercel via GitHub

Följ dessa steg för att göra din app tillgänglig för familjen:

## 1. Pusha koden till GitHub
Om du inte redan har gjort det, se till att hela projektet finns i ett GitHub-repo.

## 2. Skapa ett projekt på Vercel
1. Gå till [Vercel Dashboard](https://vercel.com/dashboard)
2. Klicka på **Add New Project**
3. Koppla ditt GitHub-konto om du inte redan gjort det
4. Välj ditt PuppyTracker-repo

## 3. Inställningar för Vite/React
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Vercel brukar känna igen detta automatiskt.

## 4. Deploy
Klicka på **Deploy**. Efter några minuter får du en länk till din live-app!

## 5. Dela länken
Skicka länken till din familj så kan de använda appen direkt.

---

### Tips
- Om du gör ändringar i koden och pushar till GitHub, uppdateras appen automatiskt på Vercel.
- Om du har en backend/server, rekommenderas Railway eller Render för den delen.

Lycka till! 🚀
