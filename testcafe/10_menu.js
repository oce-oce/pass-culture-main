import { Selector } from 'testcafe'

import { fetchSandbox } from './helpers/sandboxes'
import { createUserRole } from './helpers/roles'
import { ROOT_PATH } from '../src/utils/config'

const menuButton = Selector('#open-menu-button')

fixture('En ouvrant le menu').beforeEach(async t => {
  const { user } = await fetchSandbox(
    'webapp_10_menu',
    'get_existing_webapp_validated_user_with_has_filled_cultural_survey'
  )
  await t
    .useRole(createUserRole(user))
    .navigateTo(`${ROOT_PATH}profil`)
    .wait(500)
    .click(menuButton)
    .wait(100)
})

test('je peux naviguer vers mes offres', async t => {
  const menuOffres = Selector('.navlink').withText('Les offres')
  await t
    .expect(menuOffres.exists)
    .ok()
    .click(menuOffres)
    .wait(100)
  const location = await t.eval(() => window.location)
  await t.expect(location.pathname).contains('decouverte')
})

test('je peux naviguer vers mes réservations', async t => {
  const menuReservations = Selector('.navlink').withText('Mes réservations')
  await t
    .expect(menuReservations.exists)
    .ok()
    .click(menuReservations)
    .wait(2100)
  const location = await t.eval(() => window.location)
  await t.expect(location.pathname).eql('/reservations')
})

test('je peux naviguer vers les favoris', async t => {
  const menuFavoris = Selector('.navlink').withText('Mes favoris')
  await t
    .expect(menuFavoris.exists)
    .ok()
    .click(menuFavoris)
    .wait(2100)
  const location = await t.eval(() => window.location)
  await t.expect(location.pathname).eql('/favoris')
})
