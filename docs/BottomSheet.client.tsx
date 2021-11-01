import dynamic from 'next/dynamic'
const BottomSheet = dynamic(() => import('./BottomSheet'), { ssr: false })

export { BottomSheet }
