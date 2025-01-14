import { FormikProvider, useFormik } from 'formik'
import React, { useState } from 'react'

import ConfirmDialog from 'components/Dialog/ConfirmDialog'
import FormLayout from 'components/FormLayout'
import { OFFER_WIZARD_STEP_IDS } from 'components/OfferIndividualBreadcrumb'
import { RouteLeavingGuardOfferIndividual } from 'components/RouteLeavingGuardOfferIndividual'
import { useOfferIndividualContext } from 'context/OfferIndividualContext'
import {
  Events,
  OFFER_FORM_NAVIGATION_MEDIUM,
  OFFER_FORM_NAVIGATION_OUT,
} from 'core/FirebaseEvents/constants'
import { OFFER_WIZARD_MODE } from 'core/Offers'
import { IOfferIndividual, IOfferIndividualStock } from 'core/Offers/types'
import { getOfferIndividualUrl } from 'core/Offers/utils/getOfferIndividualUrl'
import { useNavigate, useOfferWizardMode } from 'hooks'
import useAnalytics from 'hooks/useAnalytics'
import useNotification from 'hooks/useNotification'

import { ActionBar } from '../ActionBar'
import { getSuccessMessage } from '../utils'
import { logTo } from '../utils/logTo'

import { computeInitialValues } from './form/computeInitialValues'
import { onSubmit } from './form/onSubmit'
import { PriceCategoriesFormValues, PriceCategoryForm } from './form/types'
import { validationSchema } from './form/validationSchema'
import { PriceCategoriesForm } from './PriceCategoriesForm'

export interface IPriceCategories {
  offer: IOfferIndividual
}

export const shouldDisplayConfirmChangeOnPrice = (
  stocks: IOfferIndividualStock[],
  initialValues: PriceCategoriesFormValues,
  values: PriceCategoriesFormValues
) => {
  const initialPriceCategories: Record<
    string,
    Partial<PriceCategoryForm>
  > = initialValues.priceCategories.reduce(
    (dict: Record<string, Partial<PriceCategoryForm>>, priceCategory) => {
      dict[priceCategory.id || 'new'] = {
        id: priceCategory.id,
        label: priceCategory.label,
        price: priceCategory.price,
      }
      return dict
    },
    {}
  )
  const stockPriceCategoryIds = stocks.map(stock => stock.priceCategoryId)

  return values.priceCategories.some(priceCategory => {
    // if no id, it is new and has no stocks
    if (!priceCategory.id) {
      return false
    }

    // have fields which trigger warning been edited ?
    const initialpriceCategory = initialPriceCategories[priceCategory.id]
    if (initialpriceCategory['price'] !== priceCategory['price']) {
      // does it match a stock ?
      return stockPriceCategoryIds.some(
        stockPriceCategoryId => stockPriceCategoryId === priceCategory.id
      )
    } else {
      return false
    }
  })
}

const PriceCategories = ({ offer }: IPriceCategories): JSX.Element => {
  const { setOffer } = useOfferIndividualContext()
  const { logEvent } = useAnalytics()
  const [isClickingFromActionBar, setIsClickingFromActionBar] =
    useState<boolean>(false)
  const navigate = useNavigate()
  const mode = useOfferWizardMode()
  const [isClickingDraft, setIsClickingDraft] = useState<boolean>(false)
  const notify = useNotification()
  const [showConfirmChangeOnPrice, setShowConfirmChangeOnPrice] =
    useState(false)

  const onSubmitWithCallback = async (values: PriceCategoriesFormValues) => {
    if (
      mode !== OFFER_WIZARD_MODE.EDITION &&
      !showConfirmChangeOnPrice &&
      shouldDisplayConfirmChangeOnPrice(
        offer.stocks,
        formik.initialValues,
        values
      )
    ) {
      setShowConfirmChangeOnPrice(true)
      return
    } else {
      setShowConfirmChangeOnPrice(false)
    }

    try {
      await onSubmit(values, offer, setOffer, formik.resetForm)
      afterSubmitCallback()
    } catch (error) {
      if (error instanceof Error) {
        notify.error(error?.message)
      }
    }
  }

  const afterSubmitCallback = () => {
    notify.success(getSuccessMessage(mode))
    const afterSubmitUrl = getOfferIndividualUrl({
      offerId: offer.id,
      step:
        mode === OFFER_WIZARD_MODE.EDITION
          ? OFFER_WIZARD_STEP_IDS.SUMMARY
          : isClickingDraft
          ? OFFER_WIZARD_STEP_IDS.TARIFS
          : OFFER_WIZARD_STEP_IDS.STOCKS,
      mode,
    })
    logEvent?.(Events.CLICKED_OFFER_FORM_NAVIGATION, {
      from: OFFER_WIZARD_STEP_IDS.TARIFS,
      to: isClickingDraft
        ? OFFER_WIZARD_STEP_IDS.TARIFS
        : mode === OFFER_WIZARD_MODE.EDITION
        ? OFFER_WIZARD_STEP_IDS.SUMMARY
        : OFFER_WIZARD_STEP_IDS.STOCKS,
      used: isClickingDraft
        ? OFFER_FORM_NAVIGATION_MEDIUM.DRAFT_BUTTONS
        : OFFER_FORM_NAVIGATION_MEDIUM.STICKY_BUTTONS,
      isEdition: mode !== OFFER_WIZARD_MODE.CREATION,
      isDraft: mode !== OFFER_WIZARD_MODE.EDITION,
      offerId: offer.id,
    })
    navigate(afterSubmitUrl)
    setIsClickingDraft(false)
  }

  const initialValues = computeInitialValues(offer)

  const formik = useFormik<PriceCategoriesFormValues>({
    initialValues,
    validationSchema,
    onSubmit: onSubmitWithCallback,
  })

  const handlePreviousStep = () => {
    if (!formik.dirty) {
      logEvent?.(Events.CLICKED_OFFER_FORM_NAVIGATION, {
        from: OFFER_WIZARD_STEP_IDS.TARIFS,
        to: OFFER_WIZARD_STEP_IDS.INFORMATIONS,
        used: OFFER_FORM_NAVIGATION_MEDIUM.STICKY_BUTTONS,
        isEdition: mode !== OFFER_WIZARD_MODE.CREATION,
        isDraft: mode !== OFFER_WIZARD_MODE.EDITION,
        offerId: offer.id,
      })
    }
    navigate(
      getOfferIndividualUrl({
        offerId: offer.id,
        step: OFFER_WIZARD_STEP_IDS.INFORMATIONS,
        mode,
      })
    )
  }

  const handleNextStep =
    ({ saveDraft = false } = {}) =>
    async () => {
      setIsClickingFromActionBar(true)
      if (saveDraft) {
        // pass value to submit function
        setIsClickingDraft(true)
      }

      const isFormEmpty = formik.values === formik.initialValues

      // When saving draft with an empty form
      /* istanbul ignore next: DEBT, TO FIX when we have notification*/
      if ((saveDraft || mode === OFFER_WIZARD_MODE.EDITION) && isFormEmpty) {
        setIsClickingDraft(true)
        setIsClickingFromActionBar(false)
        if (saveDraft) {
          notify.success(getSuccessMessage(OFFER_WIZARD_MODE.DRAFT))
          return
        } else {
          notify.success(getSuccessMessage(OFFER_WIZARD_MODE.EDITION))
          navigate(
            getOfferIndividualUrl({
              offerId: offer.id,
              step: OFFER_WIZARD_STEP_IDS.SUMMARY,
              mode,
            })
          )
        }
      }

      /* istanbul ignore next: DEBT, TO FIX */
      if (Object.keys(formik.errors).length !== 0) {
        setIsClickingFromActionBar(false)
      }

      if (saveDraft) {
        await formik.submitForm()
      }
    }

  return (
    <FormikProvider value={formik}>
      {showConfirmChangeOnPrice && (
        <ConfirmDialog
          onCancel={() => setShowConfirmChangeOnPrice(false)}
          onConfirm={formik.submitForm}
          title="Cette modification de tarif s’appliquera à l’ensemble des occurrences qui y sont associées."
          confirmText="Confirmer la modification"
          cancelText="Annuler"
        />
      )}
      <FormLayout small>
        <form onSubmit={formik.handleSubmit}>
          <PriceCategoriesForm
            offerId={offer.nonHumanizedId.toString()}
            mode={mode}
            stocks={offer.stocks}
          />

          <ActionBar
            onClickPrevious={handlePreviousStep}
            onClickNext={handleNextStep()}
            onClickSaveDraft={handleNextStep({ saveDraft: true })}
            step={OFFER_WIZARD_STEP_IDS.TARIFS}
            isDisabled={formik.isSubmitting}
            offerId={offer.id}
          />
        </form>
      </FormLayout>
      <RouteLeavingGuardOfferIndividual
        when={formik.dirty && !isClickingFromActionBar}
        tracking={nextLocation =>
          logEvent?.(Events.CLICKED_OFFER_FORM_NAVIGATION, {
            from: OFFER_WIZARD_STEP_IDS.TARIFS,
            to: logTo(nextLocation),
            used: OFFER_FORM_NAVIGATION_OUT.ROUTE_LEAVING_GUARD,
            isEdition: mode !== OFFER_WIZARD_MODE.CREATION,
            isDraft: mode !== OFFER_WIZARD_MODE.EDITION,
            offerId: offer?.id,
          })
        }
      />
    </FormikProvider>
  )
}

export default PriceCategories
