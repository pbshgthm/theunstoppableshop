export interface IBeneficiary {
  address: string
  share: number
}

export interface IShopDesc {
  name: string,
  tagline: string,
  logo: string,
  description: string,
  website?: string,
  twitter?: string,
  discord?: string,
  youtube?: string,
  spotify?: string
}

export interface IShopInfo {
  shopId: number,
  owner: string,
  detailsCId: string,
  handle: string,
  benificiaries: IBeneficiary[]
}

export interface IProductDesc {
  name: string,
  description: string,
  preview: string[]
}

export interface IProductInfo {
  productId: number,
  contentCID: string,
  detailsCID: string,
  price: number,
  stock: number,
  salesCount: number,
  totalRevenue: number,
  creationTime: number,
  ratingsPercent: number[],
  ratingsCount: number,
  isAvailable: boolean,
  sellerLicense: string
}

export interface ICart {
  shopId: number,
  productId: number,
  price: number
}

export interface ISaleInfo {
  saleId: number,
  buyer: string,
  productId: number,
  amount: number,
  saleDeadline: number,
  unlockedLicense: string,
  rating: number,
  status: string,
}