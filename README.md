# Bajenbanken

En enkel banksajt med Next.js (frontend), Express (backend) och MySQL, som körs med Docker Compose och deployas till AWS EC2 via GitHub Actions.

Inloggningen använder bcrypt-hashade lösenord och kortlivade JWT:er (15 minuter) som skickas som `Authorization: Bearer <token>`.

## Live-demo

Sajten är publicerad på AWS EC2: http://51.21.196.203:3000

## Starta projektet lokalt

Krav: Docker Desktop och Git.

1. Klona repot och gå till projektroten:

```bash
   git clone https://github.com/alicekrln/bajenbanken-cicd.git
   cd bajenbanken-cicd
```

2. Skapa en `.env` i projektroten med en egen, slumpad signeringsnyckel:

```bash
   echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
   echo "NEXT_PUBLIC_API_URL=http://localhost:3001" >> .env
```

   `.env` finns i `.gitignore` och får aldrig checkas in.

3. Starta frontend, backend och databas:

```bash
   docker compose up --build
```

4. Öppna http://localhost:3000

Om du har ändrat `database/init.sql` behöver databasen skapas om, eftersom `init.sql` bara körs när MySQL-volymen skapas första gången:

```bash
docker compose down -v
docker compose up --build
```

## Miljövariabler

Lägg dem i `.env` i projektroten. De verkliga värdena ska aldrig in i Git, i README eller i workflow-filer.

| Variabel | Används av | Beskrivning |
|---|---|---|
| `JWT_SECRET` | Backend | Signeringsnyckel för JWT. Minst 32 byte, skapas med `openssl rand -hex 32`. Servern startar inte utan den. |
| `NEXT_PUBLIC_API_URL` | Frontend (vid build) | Adress till backend. Valfri, standard är EC2-adressen. Sätt till `http://localhost:3001` lokalt. |

Databasvariablerna (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) sätts i `docker-compose.yml`.

I GitHub Actions behövs dessa repository secrets:

| Secret | Beskrivning |
|---|---|
| `TEST_JWT_SECRET` | Separat signeringsnyckel som bara används av teststacken |
| `HOST` | EC2-instansens adress |
| `USERNAME` | SSH-användare på EC2 |
| `SSH_KEY` | Privat SSH-nyckel för deploy |

## Köra testerna

**Backend (Vitest)**

```bash
cd backend
npm ci
npm test
```

**End-to-end (Playwright)**

Starta teststacken från projektroten. Den använder en egen databas som töms när stacken stängs:

```bash
export JWT_SECRET=$(openssl rand -hex 32)
docker compose -f docker-compose.test.yml up -d --build --wait
```

Kör testerna:

```bash
cd frontend
npm ci
npx playwright install chromium
npx playwright test
```

Stäng teststacken:

```bash
cd ..
docker compose -f docker-compose.test.yml down -v
```

E2E-testerna kontrollerar bland annat att:

- ett kontoanrop med giltig Bearer-token fungerar
- ett anrop utan token eller med en ändrad token nekas med 401
- fel lösenord inte ger någon token
- en omladdning eller utloggning kräver ny inloggning

## CI/CD

Vid varje pull request och push till `main` kör GitHub Actions lint, build, Vitest och Playwright. Vid push till `main` deployas appen sedan till EC2 via SSH.

Senaste gröna körningen: [GitHub Actions – grön körning](https://github.com/alicekrln/bajenbanken-cicd/actions/runs/39335120284)

## Säkerhetsfrågor

**1. Varför kan du läsa en JWT-payload utan signeringsnyckeln, och vad skyddar signaturen?**

Payloaden är bara Base64url-kodad, inte krypterad, så vem som helst som har token kan avkoda och läsa den. Signaturen skapas med serverns hemliga nyckel utifrån header och payload. Den skyddar mot ändringar: om någon ändrar till exempel `sub` till ett annat användar-id stämmer inte signaturen längre, och `jwt.verify()` nekar token. Signaturen skyddar alltså integriteten, inte sekretessen. Därför ska payloaden aldrig innehålla lösenord eller andra hemligheter.

**2. Vad händer om någon stjäl en giltig token innan den går ut? Stoppar en signatur den personen?**

Nej. Signaturen visar bara att token är äkta och oförändrad, inte vem som skickar den. Den som har en stulen giltig token kan använda den som den riktiga användaren tills den går ut. Därför är vår token kortlivad (15 minuter), sparas bara i minnet och inte i localStorage, och bör alltid skickas över HTTPS.

**3. Vad är skillnaden mellan att hasha ett lösenord och att signera en token?**

Hashning är envägs: bcrypt gör om lösenordet till ett hashvärde som inte kan räknas tillbaka. Vid inloggning hashas det inskrivna lösenordet och jämförs med hashen. Det skyddar lösenorden om databasen läcker, och saltet gör att samma lösenord får olika hashar. Signering lämnar innehållet läsbart och lägger till en signatur gjord med en hemlig nyckel, så att servern kan kontrollera att ingen har ändrat token. Hashning skyddar en hemlighet, och signering skyddar att data inte ändras.

**4. Vilken risk finns med att lagra en token i localStorage om sidan får en XSS-sårbarhet?**

All JavaScript som körs på sidan kan läsa localStorage, även skadlig kod som injicerats via XSS. En angripare kan då läsa token och skicka den till sig själv, och sedan använda den från en annan dator. Om token bara finns i React state är den svårare att komma åt, och den försvinner när sidan stängs eller laddas om. XSS är fortfarande farligt, men risken att token stjäls och används på annat håll minskar.

**5. Varför kan servern inte automatiskt veta att en JWT ska sluta gälla när användaren klickar på Logga ut?**

En JWT är stateless: servern sparar inga sessioner, utan kontrollerar bara signaturen och `exp` varje gång. När användaren loggar ut tar frontend bort token från sitt state, men själva token är fortfarande giltig tills den går ut. Om någon har en kopia kan den användas till dess. För att spärra token direkt skulle servern behöva spara en lista över spärrade tokens, eller använda korta access-tokens tillsammans med refresh-tokens som kan återkallas.

**6. Vilka hemligheter finns i ert projekt, och var ska de lagras lokalt, i GitHub Actions och på EC2?**

Hemligheterna är `JWT_SECRET`, SSH-nyckeln och adressen till EC2, samt databaslösenorden. Databaslösenorden ligger i nuläget i `docker-compose.yml` och borde också flyttas till `.env`.

- **Lokalt:** i `.env` i projektroten, som finns i `.gitignore`.
- **GitHub Actions:** som repository secrets (`TEST_JWT_SECRET`, `SSH_KEY`, `HOST` och `USERNAME`). Teststacken använder en egen nyckel, aldrig produktionsnyckeln.
- **EC2:** i en `.env`-fil i projektmappen på servern med en egen nyckel, skyddad med `chmod 600`. `git pull` påverkar inte den, eftersom den inte finns i repot.

Varje miljö har sin egen nyckel, och ingen nyckel skrivs ut i loggar, kod eller README.