import type { NextApiRequest, NextApiResponse } from 'next'
const sigUtil = require('@metamask/eth-sig-util')

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {

  try {
    console.log(process.env)
    const privateKey = process.env.API_PRIVATE_KEY as string
    console.log(privateKey)
    const publicKeyStr = sigUtil.getEncryptionPublicKey(privateKey)
    const apiPublicKey = Buffer.from(publicKeyStr).toString()
    res.status(200).json({ apiPublicKey })
  } catch (error) {
    res.status(500).json({ error })
  }
}
