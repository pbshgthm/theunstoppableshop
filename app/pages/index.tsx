import Image from 'next/image'
import Link from 'next/link'
import { Button } from '../components/UIComp'

export default function Index() {
  return (
    <div>
      <div className="mt-36 text-8xl m-auto font-bold text-center text-gray-700">
        The <span className='text-purple-800 italic'>Unstoppable</span> Shop
      </div>
      <div className="text-center text-gray-700 w-[600px] m-auto mt-16">
        The first truly decentralised digital marketplace, with no escrows, no platform risk - sell directly to your customers. Set up a shop once and earn forever. <span className='text-purple-800'>Here, or anywhere. Unstoppably.</span>
      </div>
      <div className='mt-12 flex flex-row gap-4 justify-center'>
        <Link href="/discover">
          <a><Button text="Discover" isPrimary={true} /></a>
        </Link>
        <Link href="/myshops/create">
          <a><Button text="Create Shop" /></a>
        </Link>
      </div>
      <div className="text-center text-sm text-gray-500 w-[600px] m-auto mt-16">
        We use IPFS + FIlecoin to securely store your products so its always available, only for your customers. Our Chainlink Oracle, automatically creates a personalised license for buyers to access your products.
      </div>
      <div className="text-sm text-gray-500 text-center mt-16">Powered By</div>
      <div className="m-auto text-center mt-4">
        <Image src="/assets/poweredby.png" width={600} height={60} alt="poweredby icons" />
      </div>
    </div>
  )
}
