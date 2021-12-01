import type { NextApiRequest, NextApiResponse } from 'next'
const sigUtil = require('@metamask/eth-sig-util')

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {

  try {
    const privateKey = process.env.API_PRIVATE_KEY as string
    const publicKeyStr = sigUtil.getEncryptionPublicKey(privateKey)
    const apiPublicKey = Buffer.from(publicKeyStr).toString()
    const data = {
      publicKey: Buffer.from(apiPublicKey).toString('base64'),
      apiCred: Buffer.from(JSON.stringify({
        version: 'x25519-xsalsa20-poly1305',
        nonce: process.env.API_NONCE,
        ephemPublicKey: process.env.EPH_PUBLIC_KEY,
      })).toString('base64'),
    }
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ error })
  }
}
