import {createFileRoute} from '@tanstack/react-router';import {AuthLayout} from './-auth';export const Route=createFileRoute('/register')({component:()=> <AuthLayout register/>});
