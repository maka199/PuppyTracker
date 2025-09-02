# Deploy PuppyTracker Server på Render (gratis)

Följ dessa steg för att deploya din Node.js/Express-backend gratis på Render:

## 1. Skapa konto
Gå till [Render.com](https://render.com/) och skapa ett gratis konto.

## 2. Koppla GitHub
Koppla ditt GitHub-konto till Render.

## 3. Skapa en Web Service
1. Klicka på **New Web Service**
2. Välj **Deploy from a Git repository**
3. Välj ditt PuppyTracker-repo
4. Ange root directory till `server` (om Render frågar)

## 4. Inställningar
- **Build Command:** `npm install`
- **Start Command:** `npm start` eller `node index.js` (beroende på din server setup)
- **Environment:** Node

## 5. Deploy
Klicka på **Create Web Service**. Render bygger och startar din server.

## 6. Få din länk
När deployen är klar får du en länk till din backend-API.

## 7. Miljövariabler
Om du använder miljövariabler (t.ex. databas-url), lägg till dem under "Environment" i Render.

---

### Tips
- Render har gratisnivå, men "cold starts" kan göra att servern startar långsamt ibland.
- Om du pushar nya ändringar till GitHub, deployas servern automatiskt igen.

Lycka till! 🚀
