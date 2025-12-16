// app/login/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldSeparator, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { login } from "@/server/actions/login";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import Link from "next/link";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp"

function formatPhoneNumber(value: string): string {
    const numbers = value.replace(/\D/g, '');

    const phone = numbers.startsWith('55')
        ? numbers.slice(2)
        : numbers;

    if (phone.length > 11) return phone.slice(0, 11);

    if (phone.length <= 2) return phone;
    if (phone.length <= 7)
        return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;

    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
}

export default function Page() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [signUpStep, setSignUpStep] = useState(1);
    const [signUpData, setSignUpData] = useState({
        name: "",
        business: "",
        role: "",
        phone: "",
        businessOption: "create",
        businessId: "",
    });
    const router = useRouter();

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setSignUpData({ ...signUpData, phone: formatPhoneNumber(e.target.value) });
    }

    useEffect(() => {
        const saved = localStorage.getItem("email");
        if (saved) setEmail(saved);
    }, []);

    useEffect(() => {
        if (email) {
            localStorage.setItem("email", email);
        }
    }, [email]);

    async function getUserCity() {
        try {
            const res = await fetch("https://ipinfo.io/json", {
                cache: "no-store",
            });
            if (!res.ok) return null;
            const data = await res.json();
            return {
                city: data.city,
                region: data.region,
                country: data.country,
            };
        } catch (err) {
            console.error("getUserCity error:", err);
            return null;
        }
    }

    async function handleLogin() {
        setLoading(true);
        const localization = await getUserCity();
        const user = await login(email, password, rememberMe, localization);
        setLoading(false);
        console.log(user);
        if (user.status !== 200) {
            return toast.error(`${user.data}, Tente novamente.`);
        }
        if (!user?.data?.admin) {
            return toast.error(`${user.data.error}, Tente novamente.`);
        }
        toast.success("Acesso autorizado, bem-vindo!", {
            description: `Bem-vindo de volta, ${user.data.admin.name}!`,
        });
        localStorage.setItem("name", user.data.admin.name);
        localStorage.setItem(
            "permission",
            JSON.stringify(user.data.admin.permission)
        );
        localStorage.setItem("email", user.data.admin.email);
        localStorage.setItem("role_changing_it_wont_help", user.data.admin.role);
        localStorage.setItem("menu", JSON.stringify(user.data.admin.menu));
        router.push("/");
    }

    async function handleGoogleSignUp() {
        toast.info("Google Sign Up em breve!");
    }

    async function handleSignUp() {
        if (!agreeTerms) {
            return toast.error("Você precisa aceitar os termos de serviço.");
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success("Conta criada com sucesso!");
            setIsSignUp(false);
            setSignUpStep(1);
        }, 1500);
    }

    function nextStep() {
        if (signUpStep === 1 && (!email || !password)) {
            return toast.error("Preencha todos os campos.");
        }
        if (signUpStep === 2 && !signUpData.name) {
            return toast.error("Preencha seu nome completo.");
        }
        if (signUpStep === 3 && signUpData.businessOption === "create" && (!signUpData.business || !signUpData.role)) {
            return toast.error("Preencha todos os campos.");
        }
        if (signUpStep === 3 && signUpData.businessOption === "join" && !signUpData.businessId) {
            return toast.error("Preencha o código de vinculação empresa.");
        }
        if (signUpStep < 4) {
            setSignUpStep(signUpStep + 1);
        }
    }

    function prevStep() {
        if (signUpStep > 1) {
            setSignUpStep(signUpStep - 1);
        }
    }

    return (
        <div className="min-h-screen w-full bg-primary flex items-center justify-center p-4 sm:p-6 md:p-8">
            <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden">
                <CardContent className="p-6 sm:p-8 space-y-6">

                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl sm:text-4xl font-semibold text-primary tracking-tight">
                            {isSignUp ? "Sign up" : "Sign in"}
                        </h1>
                        {isSignUp ? (
                            <div className="space-y-2">
                                <div className="flex justify-center items-center gap-2 mt-4">
                                    {[1, 2, 3, 4].map((step) => (
                                        <div
                                            key={step}
                                            className={`h-2 rounded-full transition-all duration-300 ${step === signUpStep
                                                    ? "w-8 bg-primary"
                                                    : step < signUpStep
                                                        ? "w-2 bg-primary"
                                                        : "w-2 bg-gray-300"
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600 font-medium">
                                    {signUpStep === 1 && "Account Details"}
                                    {signUpStep === 2 && "Personal Information"}
                                    {signUpStep === 3 && "Business Information"}
                                    {signUpStep === 4 && "Review & Confirm"}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">
                                Welcome back! Please sign in to continue
                            </p>
                        )}
                    </div>

                    {/* Sign Up / Sign In Content */}
                    {isSignUp ? (
                        <>
                            {signUpStep === 1 && (
                                <div className="space-y-4">
                                    <FieldGroup>
                                        <Field>
                                            <FieldLabel className="text-sm font-medium">
                                                Email <span className="text-red-500">*</span>
                                            </FieldLabel>
                                            <Input
                                                type="email"
                                                value={email}
                                                placeholder="seu@email.com"
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="h-11"
                                            />
                                        </Field>
                                        <FieldSeparator />
                                        <Field>
                                            <FieldLabel className="text-sm font-medium">
                                                Senha <span className="text-red-500">*</span>
                                            </FieldLabel>
                                            <Input
                                                type="password"
                                                value={password}
                                                placeholder="••••••••"
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="h-11"
                                            />
                                        </Field>
                                    </FieldGroup>
                                    <Button
                                        onClick={nextStep}
                                        className="w-full h-11 font-medium"
                                    >
                                        Continue
                                    </Button>
                                </div>
                            )}

                            {signUpStep === 2 && (
                                <div className="space-y-4">
                                    <FieldGroup>
                                        <Field>
                                            <FieldLabel className="text-sm font-medium">
                                                Nome Completo <span className="text-red-500">*</span>
                                            </FieldLabel>
                                            <Input
                                                type="text"
                                                value={signUpData.name}
                                                placeholder="João Silva"
                                                onChange={(e) =>
                                                    setSignUpData({ ...signUpData, name: e.target.value })
                                                }
                                                className="h-11"
                                            />
                                        </Field>
                                        <FieldSeparator />
                                        <Field>
                                            <FieldLabel className="text-sm font-medium">Telefone</FieldLabel>
                                            <Input
                                                type="tel"
                                                value={signUpData.phone}
                                                placeholder="(12) 3456-7890"
                                                onChange={handleChange}
                                                inputMode="numeric"
                                                maxLength={15}
                                                minLength={15}
                                                autoComplete="tel"
                                                className="h-11"
                                            />
                                        </Field>
                                    </FieldGroup>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-11 font-medium"
                                            onClick={prevStep}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            onClick={nextStep}
                                            className="flex-1 h-11 font-medium"
                                        >
                                            Continue
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {signUpStep === 3 && (
                                <div className="space-y-4">
                                    <FieldGroup>
                                        <Field>
                                            <FieldLabel className="text-sm font-medium">Opção de Empresa</FieldLabel>
                                            <div className="flex gap-3">
                                                <Button
                                                    type="button"
                                                    variant={signUpData.businessOption === "create" ? "default" : "outline"}
                                                    className="flex-1 h-11 font-medium"
                                                    onClick={() =>
                                                        setSignUpData({
                                                            ...signUpData,
                                                            businessOption: "create",
                                                        })
                                                    }
                                                >
                                                    Criar Empresa
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={signUpData.businessOption === "join" ? "default" : "outline"}
                                                    className="flex-1 h-11 font-medium"
                                                    onClick={() =>
                                                        setSignUpData({
                                                            ...signUpData,
                                                            businessOption: "join",
                                                        })
                                                    }
                                                >
                                                    Vincular-se
                                                </Button>
                                            </div>
                                        </Field>
                                        <FieldSeparator />
                                        {signUpData.businessOption === "create" ? (
                                            <Field>
                                                <FieldLabel className="text-sm font-medium">
                                                    Nome da empresa <span className="text-red-500">*</span>
                                                </FieldLabel>
                                                <Input
                                                    type="text"
                                                    value={signUpData.business}
                                                    placeholder="Nome da sua empresa"
                                                    onChange={(e) =>
                                                        setSignUpData({
                                                            ...signUpData,
                                                            business: e.target.value,
                                                        })
                                                    }
                                                    className="h-11"
                                                />
                                            </Field>
                                        ) : (
                                            <Field>
                                                <FieldLabel className="text-sm font-medium">
                                                    Código de vinculação da Empresa <span className="text-red-500">*</span>
                                                </FieldLabel>
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <InputOTP
                                                        maxLength={6}
                                                        onChange={(value) =>
                                                            setSignUpData({
                                                                ...signUpData,
                                                                businessId: value,
                                                            })
                                                        }
                                                    >
                                                        <InputOTPGroup>
                                                            <InputOTPSlot index={0} />
                                                            <InputOTPSlot index={1} />
                                                            <InputOTPSlot index={2} />
                                                        </InputOTPGroup>
                                                        <InputOTPSeparator />
                                                        <InputOTPGroup>
                                                            <InputOTPSlot index={3} />
                                                            <InputOTPSlot index={4} />
                                                            <InputOTPSlot index={5} />
                                                        </InputOTPGroup>
                                                    </InputOTP>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full sm:w-auto h-11 font-medium whitespace-nowrap"
                                                    >
                                                        Verificar
                                                    </Button>
                                                </div>
                                            </Field>
                                        )}
                                    </FieldGroup>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-11 font-medium"
                                            onClick={prevStep}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            onClick={nextStep}
                                            className="flex-1 h-11 font-medium"
                                        >
                                            Continue
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {signUpStep === 4 && (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200">
                                        <h3 className="font-semibold text-base text-gray-900">
                                            Revise suas informações
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                <span className="text-gray-600 font-medium">Email:</span>
                                                <span className="text-gray-900 break-all">{email}</span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                <span className="text-gray-600 font-medium">Nome:</span>
                                                <span className="text-gray-900">{signUpData.name}</span>
                                            </div>
                                            {signUpData.phone && (
                                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                    <span className="text-gray-600 font-medium">Telefone:</span>
                                                    <span className="text-gray-900">{signUpData.phone}</span>
                                                </div>
                                            )}
                                            {signUpData.businessOption === "create" ? (
                                                <>
                                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                        <span className="text-gray-600 font-medium">Empresa:</span>
                                                        <span className="text-gray-900">{signUpData.business}</span>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                        <span className="text-gray-600 font-medium">Cargo:</span>
                                                        <span className="text-gray-900">{signUpData.role}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                    <span className="text-gray-600 font-medium">Código Empresa:</span>
                                                    <span className="text-gray-900 font-mono">{signUpData.businessId}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <Checkbox
                                            id="check1"
                                            checked={agreeTerms}
                                            onCheckedChange={(checked) =>
                                                setAgreeTerms(checked as boolean)
                                            }
                                            className="mt-0.5"
                                        />
                                        <FieldLabel htmlFor="check1" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                                            Eu concordo com os{" "}
                                            <Link href="/terms" className="text-primary font-medium hover:underline">
                                                Termos de Serviço
                                            </Link>{" "}
                                            e{" "}
                                            <Link href="/privacypolicy" className="text-primary font-medium hover:underline">
                                                Política de Privacidade
                                            </Link>
                                        </FieldLabel>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-11 font-medium"
                                            onClick={prevStep}
                                        >
                                            Voltar
                                        </Button>
                                        <Button
                                            onClick={handleSignUp}
                                            className="flex-1 h-11 font-medium"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                "Criar Conta"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-3 text-gray-500 font-medium">
                                        Ou cadastre-se com
                                    </span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full h-11 border-gray-300 hover:bg-gray-50 font-medium"
                                onClick={handleGoogleSignUp}
                            >
                                <Image
                                    src="https://www.google.com/favicon.ico"
                                    alt="Google"
                                    width={18}
                                    height={18}
                                    className="mr-2"
                                />
                                Sign up with Google
                            </Button>
                        </>
                    ) : (
                        <>
                            {/* Login Form */}
                            <FieldGroup>
                                <Field>
                                    <FieldLabel className="text-sm font-medium">Email</FieldLabel>
                                    <Input
                                        type="email"
                                        value={email}
                                        placeholder="seu@email.com"
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-11"
                                    />
                                </Field>
                                <FieldSeparator />
                                <Field>
                                    <div className="flex justify-between">
                                        <FieldLabel className="text-sm font-medium">Senha</FieldLabel>

                                        <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                                            Esqueceu?
                                        </Link>
                                    </div>
                                    <Input
                                        type="password"
                                        value={password}
                                        placeholder="••••••••"
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-11"
                                    />

                                </Field>
                                <Field className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="check"
                                            checked={rememberMe}
                                            onCheckedChange={(checked) =>
                                                setRememberMe(checked as boolean)
                                            }
                                        />
                                        <FieldLabel htmlFor="check" className="text-sm text-gray-600 cursor-pointer">
                                            Lembre de mim por 7 dias
                                        </FieldLabel>
                                    </div>
                                </Field>
                            </FieldGroup>

                            <Button
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full h-11 font-medium"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Entrar na sua conta"
                                )}
                            </Button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-3 text-gray-500 font-medium">
                                        Ou entre com
                                    </span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full h-11 border-gray-300 hover:bg-gray-50 font-medium"
                                onClick={handleGoogleSignUp}
                            >
                                <Image
                                    src="https://www.google.com/favicon.ico"
                                    alt="Google"
                                    width={18}
                                    height={18}
                                    className="mr-2"
                                />
                                Sign in with Google
                            </Button>
                        </>
                    )}

                    {/* Switch to Sign Up */}
                    <div className="text-center text-sm text-gray-600 pt-4">
                        {isSignUp ? (
                            <>
                                Já tem uma conta?{" "}
                                <button
                                    className="text-primary font-semibold hover:underline"
                                    onClick={() => {
                                        setIsSignUp(false);
                                        setSignUpStep(1);
                                    }}
                                >
                                    Faça login
                                </button>
                            </>
                        ) : (
                            <>
                                Não tem uma conta?{" "}
                                <button
                                    className="text-primary font-semibold hover:underline"
                                    onClick={() => setIsSignUp(true)}
                                >
                                    Cadastre-se
                                </button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}