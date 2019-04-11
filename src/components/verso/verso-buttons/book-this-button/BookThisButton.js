/* eslint
  react/jsx-one-expression-per-line: 0 */
import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import Price from '../../../layout/Price'

const formatOutputPrice = (prices, devise) => {
  const arrow = '\u27A4'
  const [startingPrice, endingPrice] = prices
  return (
    <React.Fragment>
      <span>{startingPrice}</span>
      <span className="fs12 px3">{arrow}</span>
      <span>
        {endingPrice}&nbsp;{devise}
      </span>
    </React.Fragment>
  )
}

const BookThisButton = ({ linkDestination, priceValue }) => (
  <Link
    to={linkDestination}
    id="verso-booking-button"
    className="button-with-price flex-columns is-bold is-white-text fs18"
  >
    <Price
      free="Gratuit"
      className="px6 py8"
      value={priceValue}
      format={formatOutputPrice}
    />
    <hr className="dotted-left-2x-white no-margin" />
    <span className="button-label px6 py8">J&apos;y vais!</span>
  </Link>
)

BookThisButton.propTypes = {
  linkDestination: PropTypes.string.isRequired,
  priceValue: PropTypes.array.isRequired,
}

export default BookThisButton
