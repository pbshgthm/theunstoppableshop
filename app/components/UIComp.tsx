export function Spinner({ msg }: { msg: string }) {
  return (
    <div className="flex flex-row gap-3 items-center">
      <div className="w-8 h-8 border-4 border-t-transparent border-gray-300 rounded-full animate-spin"></div>
      <div className="text-sm text-gray-400 mt-0.5">{msg}</div>
    </div>
  )
}

export function Button({ text, isPrimary, isDisabled, isRight, onClick }: {
  text: string,
  isPrimary?: boolean,
  isDisabled?: boolean,
  isRight?: boolean,
  onClick?: () => void
}) {
  return (
    <button className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-full ${isPrimary ? 'bg-purple-700 text-white' : 'text-gray-700 bg-white hover:bg-gray-50'} ${isDisabled ? 'opacity-60 hover:opacity-60 cursor-not-allowed' : 'shadow-sm hover:opacity-80'} ${isRight ? 'ml-auto' : ''}`
    } onClick={onClick}>
      {text}
    </button>
  )
}