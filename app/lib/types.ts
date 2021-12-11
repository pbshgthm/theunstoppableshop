export interface IBeneficiary {
  address: string
  share: number
}

export interface IShopInfo {
  handle: string,
  name: string,
  tagline: string,
  owner: string,
  logo: string,
  description: string,
  benificiaries: IBeneficiary[],
  website?: string,
  twitter?: string,
  discord?: string,
  youtube?: string,
  spotify?: string
}

export interface IProductInfo {
  name: string,
  description: string,
  preview: string[]
}