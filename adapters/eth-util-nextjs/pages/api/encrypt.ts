const sigUtil = require('@metamask/eth-sig-util')
import type { NextApiRequest, NextApiResponse } from 'next'
import { encryptStr } from '../../lib/encDec'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {

  try {
    const plainText = req.body.plainText
    const publicKey = req.body.publicKey
    const encryptedText = encryptStr(plainText, publicKey)
    res.status(200).json({ encryptedText })
  } catch (error) {
    res.status(500).json({ error })
  }
}
