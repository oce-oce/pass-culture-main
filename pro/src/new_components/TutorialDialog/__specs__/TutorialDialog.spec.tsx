import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router'
import type { Store } from 'redux'

import * as useAnalytics from 'components/hooks/useAnalytics'
import { Events } from 'core/FirebaseEvents/constants'
import * as pcapi from 'repository/pcapi/pcapi'
import { configureTestStore } from 'store/testUtils'

import TutorialDialog from '../TutorialDialog'

jest.mock('repository/pcapi/pcapi', () => ({
  setHasSeenTutos: jest.fn().mockResolvedValue({}),
}))

const stepTitles = [
  'Bienvenue dans l’espace acteurs culturels',
  'Gérer vos lieux culturels',
  'Créer une offre',
  'Suivre et gérer vos réservations',
]

const renderTutorialDialog = async (store: Store) => {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <TutorialDialog />
      </MemoryRouter>
    </Provider>
  )
}

const mockLogEvent = jest.fn()

describe('tutorial modal', () => {
  let store: Store

  beforeEach(() => {
    store = configureTestStore({})
  })
  it('should trigger an event when the user arrive on /accueil for the first time', async () => {
    jest.spyOn(useAnalytics, 'default').mockImplementation(() => ({
      logEvent: mockLogEvent,
      setLogEvent: null,
    }))
    store = configureTestStore({
      user: {
        currentUser: {
          id: 'test_id',
          hasSeenProTutorials: false,
        },
      },
    })
    renderTutorialDialog(store)
    const closeButton = screen.getByTitle('Fermer la modale')
    await userEvent.click(closeButton)
    expect(mockLogEvent).toHaveBeenNthCalledWith(1, Events.TUTO_PAGE_VIEW, {
      page_number: '1',
    })
    expect(mockLogEvent).toHaveBeenNthCalledWith(2, Events.FIRST_LOGIN)
    expect(mockLogEvent).toHaveBeenCalledTimes(2)
  })

  it('should show tutorial dialog if user has not seen it yet', async () => {
    store = configureTestStore({
      user: {
        currentUser: {
          id: 'test_id',
          hasSeenProTutorials: false,
        },
      },
    })

    await renderTutorialDialog(store)

    expect(screen.getByText(stepTitles[0])).toBeInTheDocument()
  })

  it("shouldn't show tutorial dialog if user has already seen it", async () => {
    store = configureTestStore({
      user: {
        currentUser: {
          id: 'test_id',
          hasSeenProTutorials: true,
        },
      },
    })

    await renderTutorialDialog(store)

    expect(screen.queryByText(stepTitles[0])).not.toBeInTheDocument()
  })

  describe('interacting with navigation buttons', () => {
    let buttonNext: HTMLElement
    beforeEach(async () => {
      store = configureTestStore({
        user: {
          currentUser: {
            id: 'test_id',
            hasSeenProTutorials: false,
          },
        },
      })

      await renderTutorialDialog(store)
      buttonNext = screen.getByText('Suivant')
    })

    describe('from first step', () => {
      it('should disabled "previous" button', async () => {
        const buttonPrevious = screen.getByText('Précédent')
        expect(buttonPrevious).toHaveAttribute('disabled')
      })

      it('should show change steps when clicking on "next"', async () => {
        expect(screen.getByText(stepTitles[0])).toBeInTheDocument()

        await userEvent.click(buttonNext)
        expect(screen.getByText(stepTitles[1])).toBeInTheDocument()

        await userEvent.click(buttonNext)
        expect(screen.getByText(stepTitles[2])).toBeInTheDocument()

        await userEvent.click(buttonNext)
        expect(screen.getByText(stepTitles[3])).toBeInTheDocument()
      })
    })

    describe('from last step', () => {
      let buttonPrevious: HTMLElement

      beforeEach(async () => {
        await userEvent.click(buttonNext)
        await userEvent.click(buttonNext)
        await userEvent.click(buttonNext)

        buttonPrevious = screen.getByText('Précédent')
      })

      describe('when clicking on finish button', () => {
        it('should close tutorial', async () => {
          const buttonFinish = screen.getByText('Terminer')
          expect(buttonFinish).toBeInTheDocument()

          expect(screen.getByTestId('tutorial-container')).toBeInTheDocument()
          await userEvent.click(buttonFinish)

          expect(
            screen.queryByTestId('tutorial-container')
          ).not.toBeInTheDocument()
        })

        it('should call set has seen tutos function', async () => {
          const buttonFinish = screen.getByText('Terminer')
          expect(buttonFinish).toBeInTheDocument()

          expect(screen.getByTestId('tutorial-container')).toBeInTheDocument()
          await userEvent.click(buttonFinish)
          expect(pcapi.setHasSeenTutos).toHaveBeenCalledWith()
        })
      })

      it('should change step when clicking on "next"', async () => {
        expect(screen.getByText(stepTitles[3])).toBeInTheDocument()

        await userEvent.click(buttonPrevious)
        expect(screen.getByText(stepTitles[2])).toBeInTheDocument()

        await userEvent.click(buttonPrevious)
        expect(screen.getByText(stepTitles[1])).toBeInTheDocument()

        await userEvent.click(buttonPrevious)
        expect(screen.getByText(stepTitles[0])).toBeInTheDocument()
      })
    })

    it('should change step when clicking on "previous"', async () => {
      await userEvent.click(buttonNext)
      await userEvent.click(buttonNext)
      await userEvent.click(buttonNext)

      const buttonPrevious = screen.getByText('Précédent')

      expect(screen.getByText(stepTitles[3])).toBeInTheDocument()

      await userEvent.click(buttonPrevious)
      expect(screen.getByText(stepTitles[2])).toBeInTheDocument()

      await userEvent.click(buttonPrevious)
      expect(screen.getByText(stepTitles[1])).toBeInTheDocument()

      await userEvent.click(buttonPrevious)
      expect(screen.getByText(stepTitles[0])).toBeInTheDocument()
    })

    it('should go on the right step when clicking on dots', async () => {
      const navDottes = screen.queryAllByTestId('nav-dot')

      expect(screen.getByText(stepTitles[0])).toBeInTheDocument()

      await userEvent.click(navDottes[3])
      expect(screen.getByText(stepTitles[3])).toBeInTheDocument()

      await userEvent.click(navDottes[1])
      expect(screen.getByText(stepTitles[1])).toBeInTheDocument()

      await userEvent.click(navDottes[0])
      expect(screen.getByText(stepTitles[0])).toBeInTheDocument()

      await userEvent.click(navDottes[2])
      expect(screen.getByText(stepTitles[2])).toBeInTheDocument()
    })
  })
})