const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
function closeMenu() { mobileNav.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Menu openen'); }
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  mobileNav.hidden = expanded;
  menuButton.setAttribute('aria-expanded', String(!expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Menu openen' : 'Menu sluiten');
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

const venueContent = {
  hotels: { label: 'VAN CHECK-IN TOT CITYTRIP', quote: 'Oplader vergeten?\nVraag het aan Henk.', small: 'Een warm welkom. Ook voor uw batterij.', eyebrow: 'HENK IN UW HOTEL', title: 'Een kleine plek aan de receptie. Een groot gebaar voor uw gast.', description: 'Na een lange reis wil uw gast meteen op pad. Met een Henk bij de receptie blijven navigatie, reserveringen en tickets binnen handbereik.', benefits: ['Een praktische toevoeging aan uw gastvrijheid', 'Zelfbediening voor uw gasten', 'Past bij hotels, hostels en hotelketens'], cta: 'Bespreek Henk voor uw hotel', formValue: 'Hotel of hostel' },
  horeca: { label: 'VAN EERSTE KOFFIE TOT LAATSTE RONDE', quote: 'Uw telefoon op 2%.\nUw avond op 100%.', small: 'Henk heeft stroom. U heeft gezelschap.', eyebrow: 'HENK IN UW ZAAK', title: 'Laat uw gasten opladen terwijl ze van hun bezoek genieten.', description: 'Een lege batterij hoeft geen reden te zijn om naar huis te gaan. Uw gasten laden hun telefoon op aan tafel, aan de bar of onderweg naar hun volgende bestemming.', benefits: ['Geen telefoons achter de bar bewaren', 'Geen losse opladers voor uw team', 'Een extra service voor restaurants, cafés en bars'], cta: 'Bespreek Henk voor uw zaak', formValue: 'Restaurant, café of bar' },
  events: { label: 'VAN EERSTE TICKET TOT LAATSTE TRACK', quote: 'Meer herinneringen.\nMinder batterijstress.', small: 'U maakt het evenement. Henk houdt u bij.', eyebrow: 'HENK OP UW EVENT', title: 'Laat bezoekers verbonden blijven met alles wat er gebeurt.', description: 'Tickets laten zien, betalen, foto’s maken of vrienden terugvinden: op een evenement is een opgeladen telefoon onmisbaar. Bespreek tijdelijke stations die passen bij uw bezoekers.', benefits: ['Mogelijkheden voor tijdelijke plaatsing', 'Afstemmen op locatie en bezoekersaantal', 'Branding en sponsoring bespreekbaar'], cta: 'Bespreek Henk voor uw event', formValue: 'Evenement of congres' },
  publiek: { label: 'VOOR IEDEREEN DIE ONDERWEG IS', quote: 'Nog veel te doen.\nHenk gaat met u mee.', small: 'Van een dagje uit tot een volle werkdag.', eyebrow: 'HENK OP PUBLIEKE PLEKKEN', title: 'Precies daar waar mensen even wat stroom kunnen gebruiken.', description: 'In een museum, sportlocatie, winkelcentrum of onderwijsinstelling: Henk maakt mobiele energie toegankelijk voor bezoekers die nog een hele dag voor zich hebben.', benefits: ['Service tijdens een bezoek of wachttijd', 'Een compacte plek voor mobiele energie', 'Samen kijken naar een passende stationopstelling'], cta: 'Bespreek Henk voor uw locatie', formValue: 'Publieke locatie of onderwijs' }
};
const venueTabs = Array.from(document.querySelectorAll('[data-venue]'));
const copy = value => window.HenkCopy ? window.HenkCopy.text(value) : value;
let selectedVenue = 'hotels';
function selectVenue(tab, focus = false) {
  selectedVenue = tab.dataset.venue;
  const content = venueContent[selectedVenue];
  venueTabs.forEach(item => { const selected = item === tab; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; });
  document.querySelector('#venue-panel').setAttribute('aria-labelledby', tab.id);
  ['label', 'small', 'eyebrow', 'title', 'description'].forEach(key => { document.getElementById('venue-' + key).textContent = copy(content[key]); });
  const quote = document.querySelector('#venue-quote');
  quote.replaceChildren();
  copy(content.quote).split('\n').forEach((line, index) => { if (index) quote.append(document.createElement('br')); quote.append(document.createTextNode(line)); });
  document.querySelector('#venue-benefits').replaceChildren(...content.benefits.map(text => { const li = document.createElement('li'); li.textContent = copy(text); return li; }));
  document.querySelector('.venue-cta').textContent = copy(content.cta);
  if (focus) tab.focus();
  document.dispatchEvent(new CustomEvent('henk:venue-change', {detail: {venue: selectedVenue}}));
}
venueTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectVenue(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % venueTabs.length;
    if (event.key === 'ArrowLeft') next = (index + venueTabs.length - 1) % venueTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = venueTabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectVenue(venueTabs[next], true); }
  });
});
document.querySelector('.venue-cta').addEventListener('click', () => { document.querySelector('[name="venue"]').value = venueContent[selectedVenue].formValue; });

const requestForm = document.querySelector('#request-form');
let currentRequest = '';
requestForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!requestForm.reportValidity()) return;
  const data = Object.fromEntries(new FormData(requestForm));
  currentRequest = ['Hallo Henk,', '', 'Ik maak graag kennis met Henk de Powerbank voor mijn locatie.', '', 'Naam: ' + data.name.trim(), 'E-mailadres: ' + data.email.trim(), 'Locatie: ' + data.business.trim(), 'Type locatie: ' + data.venue, 'Plaats: ' + data.city.trim(), 'Telefoonnummer: ' + (data.phone.trim() || 'Niet opgegeven'), '', 'Toelichting:', data.message.trim() || 'Geen aanvullende toelichting.', '', 'Met vriendelijke groet,', data.name.trim()].join('\n');
  document.querySelector('#request-result').hidden = false;
  document.querySelector('#copy-status').textContent = '';
  document.dispatchEvent(new CustomEvent('henk:request-ready'));
  document.querySelector('#request-result').scrollIntoView({block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
});
document.querySelector('#copy-request').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try { await navigator.clipboard.writeText(currentRequest); status.textContent = 'Aanvraag gekopieerd. Bewaar deze tot het contactkanaal beschikbaar is.'; document.dispatchEvent(new CustomEvent('henk:request-copy')); }
  catch { status.textContent = 'Kopiëren is niet beschikbaar. Gebruik “Download aanvraag” en open het tekstbestand.'; }
});
document.querySelector('#download-request').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([currentRequest], {type: 'text/plain;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = 'aanvraag-henk-de-powerbank.txt'; link.click();
  document.dispatchEvent(new CustomEvent('henk:request-download'));
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
const privacyDialog = document.querySelector('#privacy-dialog');
document.querySelector('#privacy-open').addEventListener('click', () => privacyDialog.showModal());
document.querySelector('#privacy-close').addEventListener('click', () => privacyDialog.close());
privacyDialog.addEventListener('click', event => { if (event.target === privacyDialog) { const rect = privacyDialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) privacyDialog.close(); } });
