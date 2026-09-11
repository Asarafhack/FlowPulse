import {createFileRoute} from '@tanstack/react-router';import {AuthLayout} from '../components/auth-layout';export const Route=createFileRoute('/register')({component:()=> <AuthLayout register/>});



