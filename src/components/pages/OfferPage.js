import get from 'lodash.get'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { NavLink } from 'react-router-dom'
import { compose } from 'redux'

import OfferForm from '../OfferForm'
import withLogin from '../hocs/withLogin'
import withCurrentOccasion from '../hocs/withCurrentOccasion'
import FormField from '../layout/FormField'
import Label from '../layout/Label'
import PageWrapper from '../layout/PageWrapper'
import SubmitButton from '../layout/SubmitButton'
import { resetForm } from '../../reducers/form'
import { closeModal, showModal } from '../../reducers/modal'
import { showNotification } from '../../reducers/notification'
import selectOfferForm from '../../selectors/offerForm'
import selectSelectedType from '../../selectors/selectedType'


class OfferPage extends Component {
  constructor () {
    super()
    this.state = {
      isReadOnly: true,
      hasNoVenue: false
    }
  }

  static getDerivedStateFromProps (nextProps) {
    const {
      location: { search },
      isNew
    } = nextProps
    const isEdit = search === '?modifie'
    const isReadOnly = !isNew && !isEdit
    return {
      isReadOnly
    }
  }

  handleRequestData = () => {
    const {
      history,
      requestData,
      showModal,
      user
    } = this.props

    if (!user) {
      return
    }

    requestData(
      'GET',
      'offerers',
      {
        handleSuccess: (state, action) => !get(state, 'data.venues.length')
          && showModal(
            <div>
              Vous devez avoir déjà enregistré un lieu
              dans une de vos structures pour ajouter des offres
            </div>,
            {
              onCloseClick: () => history.push('/structures')
            }
          ),
        normalizer: { managedVenues: 'venues' }
      }
    )
    requestData('GET', 'types')
  }

  componentDidMount () {
    this.handleRequestData()
  }

  componentDidUpdate (prevProps) {
    const {
      user
    } = this.props
    if (prevProps.user !== user) {
      this.handleRequestData()
    }
  }

  componentWillUnmount () {
    this.props.resetForm()
  }


  render () {
    const {
      currentOccasion,
      isLoading,
      isNew,
      location: { pathname },
      occasionIdOrNew,
      offerForm,
      routePath,
      selectedType,
      typeOptions,
    } = this.props
    const {
      id,
      name
    } = (currentOccasion || {})
    const {
      isEventType,
      requiredFields
    } = (offerForm || {})
    const {
      isReadOnly
    } = this.state

    const typeOptionsWithPlaceholder = get(typeOptions, 'length') > 1
      ? [{ label: "Sélectionnez un type d'offre" }].concat(typeOptions)
      : typeOptions

    return (
      <PageWrapper
        backTo={{path: '/offres', label: 'Vos offres'}}
        name='offer'
        loading={isLoading}
      >
        <div className='section'>
          <h1 className='pc-title'>
            {
              isNew
                ? 'Ajouter'
                : 'Modifier'
            } une offre
          </h1>
          <p className='subtitle'>
            Renseignez les détails de cette offre et mettez-la en avant en ajoutant une ou plusieurs accorches.
          </p>
          <FormField
            collectionName='occasions'
            defaultValue={name}
            entityId={occasionIdOrNew}
            isHorizontal
            isExpanded
            label={<Label title="Titre de l'offre:" />}
            name="name"
            readOnly={isReadOnly}
            required={!isReadOnly}
          />
          <FormField
            collectionName='occasions'
            defaultValue={selectedType}
            entityId={occasionIdOrNew}
            isHorizontal
            label={<Label title="Type :" />}
            name="type"
            options={typeOptionsWithPlaceholder}
            readOnly={isReadOnly}
            required={!isReadOnly}
            type="select"
          />
        </div>
        {
          selectedType && <OfferForm {...this.props} />
        }

        <hr />
        <div className="field is-grouped is-grouped-centered" style={{justifyContent: 'space-between'}}>
          <div className="control">
            {
              isReadOnly
                ? (
                  <NavLink to={`${pathname}?modifie`} className='button is-secondary is-medium'>
                    Modifier l'offre
                  </NavLink>
                )
                : (
                  <NavLink
                    className="button is-secondary is-medium"
                    to='/offres'>
                    Annuler
                  </NavLink>
                )
            }
          </div>
          <div className="control">
            {
              isReadOnly
                ? (
                  <NavLink to={routePath} className='button is-primary is-medium'>
                    Terminer
                  </NavLink>
                )
                : (
                  <SubmitButton
                    className="button is-primary is-medium"
                    getBody={form => {
                      const occasionForm = get(form, `occasionsById.${occasionIdOrNew}`)
                      // remove the EventType. ThingType.
                      if (occasionForm.type) {
                        occasionForm.type = occasionForm.type.split('.')[1]
                      }
                      return occasionForm
                    }}
                    getIsDisabled={form => {
                      if (!requiredFields) {
                        return true
                      }
                      const missingFields = requiredFields.filter(r =>
                        !get(form, `occasionsById.${occasionIdOrNew}.${r}`))
                      return isNew
                        ? missingFields.length > 0
                        : missingFields.length === requiredFields.length
                    }}
                    handleSuccess={this.handleSuccessData}
                    method={isNew ? 'POST' : 'PATCH'}
                    path={isEventType
                      ? `events${id ? `/${id}` : ''}`
                      : `things${id ? `/${id}` : ''}`
                    }
                    storeKey="occasions"
                    text="Enregistrer"
                  />
                )
              }
          </div>
        </div>
      </PageWrapper>
    )
  }
}

export default compose(
  withLogin({ isRequired: true }),
  withCurrentOccasion,
  connect(
    (state, ownProps) => ({
      offerForm: selectOfferForm(state, ownProps),
      selectedType: selectSelectedType(state, ownProps),
      typeOptions: state.data.types
    }),
    {
      closeModal,
      resetForm,
      showModal,
      showNotification
    }
  )
)(OfferPage)
