import type { NextApiRequest, NextApiResponse } from 'next'
import { decryptStr, encryptConst } from '../../lib/encDec'
const bytes32 = require('bytes32')

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
): void {
  try {

    console.log(req.url)
    const sourceEncryptedTextRaw = req.query.sourceEncryptedText as string
    const targetPublicKeyRaw = req.query.targetPublicKey as string

    const sourceEncryptedText = Buffer.from(sourceEncryptedTextRaw.replace(/ /g, '+'), 'base64').toString('utf8')
    const targetPublicKey = Buffer.from(targetPublicKeyRaw.replace(/ /g, '+'), 'base64').toString()


    const apiPrivateKey = process.env.API_PRIVATE_KEY as string
    const plainText = decryptStr(sourceEncryptedText, apiPrivateKey)


    const targetCipherText = encryptConst(plainText, targetPublicKey)
    const result = {
      part1: targetCipherText.substr(0, 32),
      part2: targetCipherText.substr(32),
      targetCipherText: targetCipherText,
      p1: bytes32({ input: targetCipherText.substr(0, 32) }),
      p2: bytes32({ input: targetCipherText.substr(32) }),
      px: bytes32({ input: bytes32({ input: targetCipherText.substr(32) }) }),
      num: 32
    }
    console.log(result)
    res.status(200).json(result)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error })
  }
}


/*
SELLER
{
    "privateKey": "2ae98e27fa568bcb1d0655eb19b75fa1088b293c40b22aade2b8433607d527d9",
    "publicKey": "62Y/Ty+Q/z9hJdu+c0gKVuGtxW4zv/0sqInaBmOiE0M="
}
BUYER
{
    "privateKey": "7f014c2e95b9f8ee80be4713b941c043928e2e85c2be2fba78036d88e184d73e",
    "publicKey": "uwLcYohjgmy7lzeyQfW8rVSTRB6dr9Wp755zlT2Lnzg="
}
API
{
  "publicKey" : "N8Dux/ah3ee2dLjKUAHDQOJE5cXAC/WflFUF0UfUmGQ="
}

"{\"version\":\"x25519-xsalsa20-poly1305\",\"nonce\":\"2f+FQPeKzNJrWEehvJKAQ5uY+hpMBaYQ4\",\"ephemPublicKey\":\"KfmQWzhihX0xHvJvhd5wGFClqypNX6VTvCaHcvEYshXA=\",\"ciphertext\":\"---\"}"

{\"version\":\"x25519-xsalsa20-poly1305\",\"nonce\":\"2+utoN/XpaL4AI8i//8OUmmc2iWb0R71\",\"ephemPublicKey\":\"KpfQweAqu266Ddzgz4ISJo4Bcg1ezeHwm8gnOHMdXwg=\",\"ciphertext\":\"4M20T4yvHVJGfgHz5Fm+MZAFl594\"}

"{\"version\": \"x25519-xsalsa20-poly1305\",\"nonce\":\"f+FQPeKzNJrWEehvJKAQ5uY+hpMBaYQ4\",\"ephemPublicKey\":\"fmQWzhihX0xHvJvhd5wGFClqypNX6VTvCaHcvEYshXA=\",\"ciphertext\":\"-----\"}"
*/

//https://theunstoppabledev.vercel.app/api/byte32?sourceEncryptedText=eyJ2ZXJzaW9uIjoieDI1NTE5LXhzYWxzYTIwLXBvbHkxMzA1Iiwibm9uY2UiOiJOajBpNGxueW96UTdEZnUwMXFNeDJQSW13YjdCSzFSNSIsImVwaGVtUHVibGljS2V5IjoiY1o0NmQrK0lSOEx6czVYU1pQZlQ5c2o2Q01RTmtJNm9VdTU5aWdlWTFVWT0iLCJjaXBoZXJ0ZXh0IjoiVWVYMHB5S0dVdjZCKzArRW5IWk01NHFmYmN0TnNZUDlYVkN6MFlVUTZ1Ty9icmRsWmRabGNTdURNVmdjU2ZoTyJ9&targetPublicKey=UFd5amlGYUZyQ1I3eW9iYWpLcnQ3Szd2RjdnbEgyVVd6Vy9vc3FwdjRUYz=

//https://theunstoppabledev.vercel.app/api/byte32?sourceEncryptedText=eyJ2ZXJzaW9uIjoieDI1NTE5LXhzYWxzYTIwLXBvbHkxMzA1Iiwibm9uY2UiOiI3VXdZTXVycmluSmRHeHBSRW9JVkRGTWdzR0RmQ093VyIsImVwaGVtUHVibGljS2V5IjoidFhoTmNoUXpoVWYrc1Q0SGxWaTMvMk02LzllMGNwSUxpbUFWeWNNMTVWND0iLCJjaXBoZXJ0ZXh0IjoiMnllZTNqYzJMckpPMGc4d01jaFU4WWQxd0YyVWJGR0FQNXhsaG9aQWQ4aTZaTjNVRVhmNFJOazNBeENJNmdoanJnPT0ifQ==&targetPublicKey=UFd5amlGYUZyQ1I3eW9iYWpLcnQ3Szd2RjdnbEgyVVd6Vy9vc3FwdjRUYz0=