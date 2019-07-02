const checkIfProviderShouldBeDisabled = (venueProviders, provider) => {
  const matchingVenueProvider = venueProviders.find(
    venueProvider => venueProvider.providerId === provider.id
  )

  return (
    (matchingVenueProvider && provider.requireProviderIdentifier === false) ===
    true
  )
}

export default checkIfProviderShouldBeDisabled
