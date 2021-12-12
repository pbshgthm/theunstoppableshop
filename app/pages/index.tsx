import Image from 'next/image'
import Link from 'next/link'
import { Button } from '../components/UIComp'

export default function Index() {
  return (
    <div>
      <div className="mt-56 text-5xl m-auto font-medium text-center text-gray-700">
        The <span className='text-purple-800'>Unstoppable</span> Shop
      </div>
      <div className="text-center text-gray-700 w-96 m-auto mt-16">
        It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.
      </div>
      <div className='mt-12 flex flex-row gap-4 justify-center'>
        <Link href="/discover">
          <a><Button text="Discover" isPrimary={true} /></a>
        </Link>
        <Link href="/myshops/create">
          <a><Button text="Create Shop" /></a>
        </Link>
      </div>
      <div className="text-sm text-gray-500 text-center mt-16">Powered By</div>
      <div className="m-auto text-center mt-4">
        <Image src="/assets/poweredby.png" width={600} height={60} alt="poweredby" />
      </div>

    </div>
  )
}