import { Amplify } from 'aws-amplify';
import * as Auth from 'aws-amplify/auth'
import { createBrowserRouter, Link, RouterProvider } from 'react-router-dom';
import { Home, Portfolio, Post, Project, Request, Resume } from '#src/routes';
import { Navigation } from '#src/components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from 'posthog-js/react'
const queryClient = new QueryClient();
import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USERPOOLID,
      userPoolClientId: import.meta.env.VITE_USERPOOLWEBCLIENTID,
    },
  },
  API: {
    GraphQL: {
      endpoint: `${import.meta.env.VITE_GRAPHQL_URL}/v1/graphql`,
      defaultAuthMode: 'none',
    },
    REST: {
      public: {
        endpoint: `${import.meta.env.VITE_API_URL}/public`,
      },
      auth: {
        endpoint: `${import.meta.env.VITE_API_URL}/auth`,
      },
    },
  },
}, {
  API: {
    GraphQL: {
      headers: async () => {
        const jwtToken = (await Auth.fetchAuthSession()).tokens?.idToken?.toString();
        return { ...(jwtToken && { Authorization: `Bearer ${jwtToken}` }) };
      },
    },
    REST: {
      headers: async ({ apiName }) => apiName === 'auth' ? { Authorization: `Bearer ${(await Auth.fetchAuthSession()).tokens?.idToken?.toString()}` } : { 'X-Api-Key': '1' }
    }
  }
});

const router = createBrowserRouter([
  {
    path: '',
    element: <Navigation />,
    children: [
      { path: '', element: <Home /> },
      { path: 'portfolio', element: <Portfolio /> },
      { path: 'resume', element: <Resume /> },
      { path: 'request', element: <Request /> },
      { path: 'portfolio/:projectId', element: <Project /> },
      { path: 'posts/:postId', element: <Post /> },
    ],
    errorElement: <>
      <Navigation />
      <div className='w-full flex flex-row justify-center'>
        <Link to='/' className='text-center text-text'>
          <img className='w-[350px] rounded-xl' src='/christmas.jpg' />
          404 - Oops, nothing to see here, move along!
        </Link>
      </div>
    </>
  },
]);

export const App = () => <PostHogProvider apiKey={import.meta.env.VITE_POSTHOG_KEY} options={{ api_host: 'https://us.posthog.com' }}>
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
</PostHogProvider>