import * as yup from 'yup'

import { validationSchema as categoriesSchema } from './Categories'
import { validationSchema as informationsSchema } from './Informations'
import { validationSchema as usefulInformationsSchema } from './UsefulInformations'

export const validationSchema = yup.object().shape({
  ...informationsSchema,
  ...usefulInformationsSchema,
  ...categoriesSchema,
})
