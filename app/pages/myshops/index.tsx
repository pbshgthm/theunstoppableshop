import Link from 'next/link'
import { Button } from '../../components/UIComp'

export default function MyShops() {
  return (
    <div className="absolute top-1/2 left-1/2">
      <Link href="/myshops/create">
        <a>
          <Button text="Create Shop" />
        </a>
      </Link>
    </div>
  )
}