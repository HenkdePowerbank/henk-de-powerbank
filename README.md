# Henk de Powerbank

Nederlandstalige statische website met responsive vormgeving en animaties. Logo en stationontwerp zijn placeholders. Er is geen installatie of build nodig.

## Lokaal bekijken

Start `python -m http.server 5173 --bind 127.0.0.1` en open `http://127.0.0.1:5173/`.

## Aanvragen en privacy

Het formulier maakt een aanvraag die u kunt kopiëren of downloaden. Contactgegevens volgen; er is geen verzending gekoppeld. Formulierinhoud blijft in de browser. Externe lettertypen komen van Google Fonts.

## A/B-test aanspreekvorm

Actief sinds 11 oktober 2026: openbare meetservice, uitsluitend voor de eigenaar toegankelijk dashboard. De bezoeker kiest of er gemeten mag worden; zonder toestemming blijft de u/uw-versie beschikbaar zonder meting.

De standaardtekst gebruikt u/uw. De originele je/jouw-tekst blijft behouden in `copy-variants.js`. Voorbeelden: `?variant=u` en `?variant=je`; deze tellen niet mee in de meting. Vormgeving, placeholders en animaties zijn identiek.

Na activering in `analytics-config.js` en meettoestemming deelt de centrale meetservice browsers willekeurig 50/50 in. De versie blijft via lokale opslag maximaal 30 dagen gelijk. Zonder toestemming werkt de gehele website met u/uw. Via Meetvoorkeuren kan de bezoeker toestemming intrekken.

Meetservice en dashboard: https://henk-conversie.sanderdenederlander.chatgpt.site/. Het dashboard is standaard alleen voor de eigenaar toegankelijk via ChatGPT-aanmelding. Sleutels en de e-mail van de eigenaar staan uitsluitend in de serveromgeving.

De primaire conversie is **een geldige aanvraag klaargezet binnen 7 dagen**; dit is geen verstuurde aanvraag of nieuwe klant. Het dashboard meet ook CTA-klikken, formulierstarts, kopiëren/downloaden, FAQ-gebruik en scrollbereik. De database ontvangt geen formulierinhoud of ruwe IP-adressen. Resultaten vertegenwoordigen alleen browsers die toestemming geven, geen unieke personen. Preview en localhost zijn uitgesloten. Meetgegevens ouder dan 30 dagen worden bij het volgende verzoek verwijderd.

De dashboardcijfers verversen iedere 15 seconden als het dashboard geopend is. Geen automatische winnaar: 95%-intervallen zijn beschrijvend en corrigeren niet voor herhaald kijken. De bron voor de statistische methode is [Newcombe (1998)](https://pubmed.ncbi.nlm.nih.gov/9595617/).

## Publiceren

GitHub Pages publiceert de hoofdmap van de `main`-branch. `.nojekyll` zorgt dat de bestanden rechtstreeks als statische website worden geleverd.

## Controle

JavaScript-syntax, lokale bestanden, ankerlinks, formuliervalidatie, aanvraaginhoud en ontbreken van het verwijderde adres gecontroleerd. De originele vormgeving en animaties zijn behouden.
