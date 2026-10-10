// Taux du jour pour le site PLM (04/10/2026) : combien de F CFA pour 1 dollar.
// L'euro est à parité fixe (655,957 F CFA) ; le dollar se déduit du cours
// euro/dollar publié par la Banque centrale européenne (api.frankfurter.app),
// avec un second fournisseur si le premier ne répond pas. Écrit taux.json à la
// racine du site, lu par assets/site.js. Lancé chaque jour par workflows/taux.yml.
'use strict'
const fs = require('fs'), path = require('path')
const EUR_FCFA = 655.957
const FICHIER = path.join(__dirname, '..', 'taux.json')

async function bce () {
  const r = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD')
  if (!r.ok) throw new Error('frankfurter ' + r.status)
  const j = await r.json()
  const usdParEur = Number(j.rates && j.rates.USD)
  if (!(usdParEur > 0.5 && usdParEur < 2)) throw new Error('cours EUR/USD invalide : ' + usdParEur)
  return { usd: EUR_FCFA / usdParEur, date: j.date, source: 'BCE (api.frankfurter.app), euro à parité fixe' }
}
async function secours () {
  const r = await fetch('https://open.er-api.com/v6/latest/USD')
  if (!r.ok) throw new Error('er-api ' + r.status)
  const j = await r.json()
  const eurParUsd = Number(j.rates && j.rates.EUR)
  if (!(eurParUsd > 0.5 && eurParUsd < 2)) throw new Error('cours USD/EUR invalide : ' + eurParUsd)
  return { usd: EUR_FCFA * eurParUsd, date: new Date().toISOString().slice(0, 10), source: 'open.er-api.com, euro à parité fixe' }
}
;(async () => {
  let t
  try { t = await bce() } catch (e) { console.log('BCE indisponible (' + e.message + '), second fournisseur'); t = await secours() }
  const usd = Math.round(t.usd * 100) / 100
  if (!(usd > 300 && usd < 1500)) throw new Error('taux hors des bornes plausibles : ' + usd)
  const neuf = { usd, eur: EUR_FCFA, date: t.date, source: t.source, majLe: new Date().toISOString() }
  let ancien = null
  try { ancien = JSON.parse(fs.readFileSync(FICHIER, 'utf8')) } catch (_) {}
  if (ancien && ancien.usd === neuf.usd && ancien.date === neuf.date) { console.log('Taux inchangé : 1 $ = ' + usd + ' F CFA'); return }
  fs.writeFileSync(FICHIER, JSON.stringify(neuf, null, 2) + '\n')
  console.log('1 $ = ' + usd + ' F CFA (' + t.date + ', ' + t.source + ')')
})().catch((e) => { console.error(e.message); process.exit(1) })
