import type { NextApiRequest, NextApiResponse } from 'next'
import { decryptStr } from '../../lib/encDec'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {
  try {
    const encryptedText = req.body.encryptedText
    const privateKey = req.body.privateKey
    const plainText = decryptStr(encryptedText, privateKey)
    res.status(200).json({ plainText })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error })
  }
}
