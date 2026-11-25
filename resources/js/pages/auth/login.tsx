import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const fillDemoCredentials = () => {
        setData((prev) => ({
            ...prev,
            email: 'test@example.com',
            password: 'password',
        }));
    };

    return (
        <AuthLayout title="Iniciar sesión en Biblioteca" description="Ingresa tus credenciales para acceder al catálogo">
            <Head title="Iniciar sesión" />

            <div className="bg-muted/60 text-muted-foreground mb-4 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs">
                <span>
                    Demo: <strong className="text-foreground">test@example.com</strong> / <strong className="text-foreground">password</strong>
                </span>
                <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={fillDemoCredentials}>
                    Usar demo
                </Button>
            </div>

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Correo electrónico</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="test@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Contraseña</Label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="ml-auto text-sm" tabIndex={5}>
                                    ¿Olvidaste tu contraseña?
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', checked === true)}
                            tabIndex={3}
                        />
                        <Label htmlFor="remember">Recordarme</Label>
                    </div>

                    <Button type="submit" className="mt-2 w-full" tabIndex={4} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Ingresar
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    ¿No tienes una cuenta?{' '}
                    <TextLink href={route('register')} tabIndex={5}>
                        Regístrate
                    </TextLink>
                </div>
            </form>

            {status && <div className="mt-4 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">{status}</div>}
        </AuthLayout>
    );
}
