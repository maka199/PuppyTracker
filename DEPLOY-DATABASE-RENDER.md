# Skapa gratis PostgreSQL-databas på Render

Så här gör du för att skapa en databas och använda den med din server på Render:

## 1. Skapa en PostgreSQL-databas
1. Gå till [Render Dashboard](https://dashboard.render.com/)
2. Klicka på **New** och välj **PostgreSQL**
3. Ge databasen ett namn och välj gratisnivån
4. Skapa databasen

## 2. Hämta din DATABASE_URL
När databasen är skapad, hittar du din **Connection String** (DATABASE_URL) under inställningarna för databasen.

## 3. Lägg till miljövariabel i din Web Service
1. Gå till din Web Service på Render
2. Klicka på **Environment**
3. Lägg till en ny variabel:
   - **Key:** `DATABASE_URL`
   - **Value:** (klistra in din connection string)
4. Spara och deploya om din server

---

Nu kan din backend ansluta till databasen!

Behöver du hjälp med att migrera eller skapa tabeller i databasen? Säg bara till!
