import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts, useRouter } from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';
import appCss from '../styles.css?url';
import { AuthProvider } from '@/lib/auth';

function ErrorComponent({error,reset}:{error:Error;reset:()=>void}){const router=useRouter(); useEffect(()=>console.error(error),[error]); return <div className="grid min-h-screen place-items-center p-6"><div className="max-w-md text-center"><h1 className="text-2xl font-bold">Something went wrong</h1><p className="mt-2 text-sm text-slate-500">{error.message}</p><div className="mt-5 flex justify-center gap-2"><button className="rounded-lg bg-slate-900 px-4 py-2 text-white" onClick={()=>{router.invalidate();reset()}}>Try again</button><Link className="rounded-lg border px-4 py-2" to="/">Home</Link></div></div></div>}
export const Route=createRootRouteWithContext<{queryClient:QueryClient}>()({head:()=>({meta:[{charSet:'utf-8'},{name:'viewport',content:'width=device-width, initial-scale=1'},{title:'FlowPulse — Project Management'},{name:'description',content:'Secure project and task management application'}],links:[{rel:'stylesheet',href:appCss},{rel:'icon',href:'/favicon.svg',type:'image/svg+xml'}]}),shellComponent:RootShell,component:RootComponent,errorComponent:ErrorComponent});
function RootShell({children}:{children:ReactNode}){return <html lang="en"><head><HeadContent/></head><body>{children}<Scripts/></body></html>}
function RootComponent(){const {queryClient}=Route.useRouteContext();return <QueryClientProvider client={queryClient}><AuthProvider><Outlet/></AuthProvider></QueryClientProvider>}
