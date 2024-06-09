import { Posts, Commits } from '#src/components'

export const Home = () => {
    return <div className='flex flex-col sm:flex-row gap-2 w-full justify-center'>
        <Posts />
        <Commits className='sm:w-[calc(33%_-_10px)] p-4 pt-0' />
    </div>
}