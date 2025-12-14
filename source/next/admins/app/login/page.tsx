"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { login } from "@/server/actions/login";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function Page() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // 🔥 Carrega o email salvo (client-side only)
    useEffect(() => {
        const saved = localStorage.getItem("email");
        if (saved) setEmail(saved);
    }, []);

    // 🔥 Salva o email sempre que ele mudar
    useEffect(() => {
        if (email) {
            localStorage.setItem("email", email);
        }
    }, [email]);

    async function handleLogin() {
        setLoading(true);
        const user = await login(email, password, rememberMe);
        setLoading(false);

        if (user.status !== 200) {
            return toast.error(`${user.data}, Tente novamente.`);
        }

        if (!user?.data?.admin) {
            return toast.error("Falha na autenticação.");
        }

        toast.success("Acesso autorizado, bem-vindo!", {
            description: `Bem-vindo de volta, ${user.data.admin.name}!`,
        });

        localStorage.setItem("name", user.data.admin.name);
        localStorage.setItem("permission", JSON.stringify(user.data.admin.permission));
        localStorage.setItem("email", user.data.admin.email);
        localStorage.setItem("role_changing_it_wont_help", user.data.admin.role);
        localStorage.setItem("menu", JSON.stringify(user.data.admin.menu));

        router.push("/");
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-sm px-6 py-10 pt-14">
                <CardContent>
                    <div className="flex flex-col items-center space-y-8">

                        <div className="space-y-2 text-center">
                            <h1 className="text-4xl font-extrabold tracking-tight">
                                TrueBase
                            </h1>
                        </div>

                        <div className="w-full space-y-4">
                            <Input
                                type="email"
                                placeholder="Your email"
                                className="w-full"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />

                            <Input
                                type="password"
                                placeholder="Your password"
                                className="w-full"
                                onChange={e => setPassword(e.target.value)}
                            />

                            <div className="flex items-center">
                                <Checkbox id="rememberMe" onClick={() => { setRememberMe(!rememberMe) }} />
                                <label className="ml-2 text-sm select-none" htmlFor="rememberMe">
                                    Lembre de mim por 7 dias
                                </label>
                            </div>

                            <Button className="w-full" size="lg" onClick={handleLogin}>
                                {loading ? <Loader2 className="animate-spin" /> : "Login"}
                            </Button>
                        </div>

                        <p className="text-center text-xs text-muted-foreground">
                            You agree to our{" "}
                            <a href="#" className="underline">Terms</a>{" "}and{" "}
                            <a href="#" className="underline">Privacy Policy</a>.
                        </p>

                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
