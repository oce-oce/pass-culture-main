import createDecorator from 'final-form-calculate'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { Form } from 'react-final-form'

import AppLayout from 'app/AppLayout'
import PageTitle from 'components/layout/PageTitle/PageTitle'
import Titles from 'components/layout/Titles/Titles'

import { bindAddressAndDesignationFromSiren } from './decorators/bindSirenFieldToDesignation'
import OffererCreationForm from './OffererCreationForm/OffererCreationForm'

class OffererCreation extends PureComponent {
  componentWillUnmount() {
    const { closeNotification } = this.props
    closeNotification()
  }

  handleSubmit = values => {
    const { createNewOfferer } = this.props
    createNewOfferer(values, this.onHandleFail, this.onHandleSuccess)
  }

  onHandleSuccess = (_, action) => {
    const { trackCreateOfferer, redirectToOfferersList } = this.props
    const { payload } = action
    const createdOffererId = payload.datum.id

    trackCreateOfferer(createdOffererId)
    redirectToOfferersList()
  }

  onHandleFail = () => {
    const { showNotification } = this.props
    showNotification('Vous étes déjà rattaché à cette structure.', 'danger')
  }

  createDecorators = () => {
    const addressAndDesignationFromSirenDecorator = createDecorator({
      field: 'siren',
      updates: bindAddressAndDesignationFromSiren,
    })

    return [addressAndDesignationFromSirenDecorator]
  }

  render() {
    return (
      <AppLayout
        layoutConfig={{
          backTo: this.props.isNewHomepageActive
            ? { label: 'Accueil', path: '/accueil' }
            : { label: 'Structures juridiques', path: '/structures' },
          pageName: 'offerer',
        }}
      >
        <PageTitle title="Créer une structure" />
        <Titles title="Structure" />

        <Form
          component={OffererCreationForm}
          decorators={this.createDecorators()}
          onSubmit={this.handleSubmit}
        />
      </AppLayout>
    )
  }
}

OffererCreation.propTypes = {
  closeNotification: PropTypes.func.isRequired,
  createNewOfferer: PropTypes.func.isRequired,
  isNewHomepageActive: PropTypes.bool.isRequired,
  redirectToOfferersList: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
  trackCreateOfferer: PropTypes.func.isRequired,
}

export default OffererCreation
