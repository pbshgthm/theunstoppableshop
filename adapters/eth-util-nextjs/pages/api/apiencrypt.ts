import { randomBytes } from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'
import { encryptConst } from '../../lib/encDec'
const sigUtil = require('@metamask/eth-sig-util')

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {

  try {
    const plainText = req.body.plainText

    const privateKey = process.env.API_PRIVATE_KEY as string
    const publicKeyStr = sigUtil.getEncryptionPublicKey(privateKey)
    const apiPublicKey = Buffer.from(publicKeyStr).toString()

    const encryptedText = encryptConst(plainText, apiPublicKey)
    res.status(200).json({ encryptedText })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error })
  }
}
