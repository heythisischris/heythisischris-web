import { Posts } from '#src/components'

export const Home = () => {
    return <div className='flex flex-col sm:flex-row gap-2 w-full justify-center'>
        <Posts />
    </div>
}