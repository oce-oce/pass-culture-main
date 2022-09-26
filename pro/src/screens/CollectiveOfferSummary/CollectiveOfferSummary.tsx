import React from 'react'

import {
  GetCollectiveOfferResponseModel,
  GetCollectiveOfferTemplateResponseModel,
} from 'apiClient/v1'
import useNotification from 'components/hooks/useNotification'
import {
  EducationalCategories,
  patchIsTemplateOfferActiveAdapter,
} from 'core/OfferEducational'
import OfferEducationalActions from 'new_components/OfferEducationalActions'
import { SummaryLayout } from 'new_components/SummaryLayout'
import { ButtonLink } from 'ui-kit'
import { ButtonVariant } from 'ui-kit/Button/types'

import styles from './CollectiveOfferSummary.module.scss'
import CollectiveOfferAccessibilitySection from './components/CollectiveOfferAccessibilitySection'
import CollectiveOfferContactSection from './components/CollectiveOfferContactSection'
import CollectiveOfferNotificationSection from './components/CollectiveOfferNotificationSection'
import CollectiveOfferParticipantSection from './components/CollectiveOfferParticipantSection'
import CollectiveOfferPracticalInformation from './components/CollectiveOfferPracticalInformation'
import CollectiveOfferTypeSection from './components/CollectiveOfferTypeSection'
import CollectiveOfferVenueSection from './components/CollectiveOfferVenueSection'
import { DEFAULT_RECAP_VALUE } from './components/constants'

const isCollectiveOfferTemplate = (
  offer:
    | GetCollectiveOfferTemplateResponseModel
    | GetCollectiveOfferResponseModel
): offer is GetCollectiveOfferTemplateResponseModel => {
  return !('collectiveStock' in offer)
}

interface ICollectiveOfferSummaryProps {
  offer:
    | GetCollectiveOfferTemplateResponseModel
    | GetCollectiveOfferResponseModel
  categories: EducationalCategories
}

const CollectiveOfferSummary = ({
  offer,
  categories,
}: ICollectiveOfferSummaryProps) => {
  const notify = useNotification()

  const setIsOfferActive = async () => {
    const response = await patchIsTemplateOfferActiveAdapter({
      offerId: offer.id,
      isActive: !offer.isActive,
    })

    if (response.isOk) {
      return notify.success(response.message)
    }

    notify.error(response.message)
  }

  const editLink = `/offre/${isCollectiveOfferTemplate(offer) ? 'T-' : ''}${
    offer.id
  }/collectif/edition`

  return (
    <>
      <OfferEducationalActions
        cancelActiveBookings={undefined}
        className={styles.actions}
        isBooked={false}
        isCancellable={offer.isCancellable}
        isOfferActive={offer.isActive}
        setIsOfferActive={setIsOfferActive}
      />
      <SummaryLayout>
        <SummaryLayout.Content fullWidth>
          <SummaryLayout.Section title="Détails de l’offre" editLink={editLink}>
            <CollectiveOfferVenueSection venue={offer.venue} />
            <CollectiveOfferTypeSection offer={offer} categories={categories} />
            <CollectiveOfferPracticalInformation offer={offer} />
            <CollectiveOfferParticipantSection students={offer.students} />
            <CollectiveOfferAccessibilitySection offer={offer} />
            <CollectiveOfferContactSection
              phone={offer.contactPhone}
              email={offer.contactEmail}
            />
            <CollectiveOfferNotificationSection
              bookingEmails={offer.bookingEmails}
            />
          </SummaryLayout.Section>
          <SummaryLayout.Section
            title="Date & Prix"
            editLink={`/offre/T-${offer.id}/collectif/stocks/edition`}
          >
            {isCollectiveOfferTemplate(offer) ? (
              <SummaryLayout.Row
                title="Détails"
                description={
                  offer.educationalPriceDetail || DEFAULT_RECAP_VALUE
                }
              />
            ) : null}
          </SummaryLayout.Section>
        </SummaryLayout.Content>
      </SummaryLayout>
      <ButtonLink
        variant={ButtonVariant.PRIMARY}
        link={{ isExternal: false, to: '/offers/collective' }}
      >
        Retour à la liste des offres
      </ButtonLink>
    </>
  )
}

export default CollectiveOfferSummary
