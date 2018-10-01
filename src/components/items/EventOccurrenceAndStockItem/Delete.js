import React, { Component } from 'react'

class Delete extends Component {
  render() {
    const {
      isStockOnly,
      onCancelDeleteClick,
      onConfirmDeleteClick,
    } = this.props

    return (
      <tr>
        <td className="is-size-7" colSpan={isStockOnly ? '3' : '6'}>
          En confirmant l'annulation de{' '}
          {isStockOnly ? 'ce stock' : 'cette date'}, vous supprimerez aussi
          toutes les réservations associées. {!isStockOnly && <br />}
          Êtes-vous sûrs de vouloir continuer&nbsp;?
        </td>
        <td>
          <button className="button is-primary" onClick={onConfirmDeleteClick}>
            Oui
          </button>
        </td>
        <td>
          <button className="button is-primary" onClick={onCancelDeleteClick}>
            Non
          </button>
        </td>
      </tr>
    )
  }
}

export default Delete
