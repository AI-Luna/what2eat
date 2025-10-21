// Predefined dietary restriction options
export const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-free (celiac disease)',
  'Lactose intolerant',
  'Kosher',
  'Halal',
  'Low sodium',
  'Diabetic-friendly/Low sugar',
  'Other',
] as const

// Predefined allergy options
export const ALLERGIES = [
  'Dairy/Milk',
  'Eggs',
  'Peanuts',
  'Tree nuts',
  'Soy',
  'Wheat',
  'Fish',
  'Shellfish',
  'Sesame',
  'Other',
] as const

export type DietaryRestriction = typeof DIETARY_RESTRICTIONS[number]
export type Allergy = typeof ALLERGIES[number]

// User's dietary preferences stored in Clerk metadata
export interface DietaryPreferences {
  restrictions: DietaryRestriction[]
  restrictionsOther?: string // For "Other" option
  allergies: Allergy[]
  allergiesOther?: string[] // For "Other" option (can have multiple)
  hasCompletedOnboarding: boolean
}

// Clerk user metadata type extension
export interface UserMetadata {
  dietaryPreferences?: DietaryPreferences
}
