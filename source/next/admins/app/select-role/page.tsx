"use client"
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Package, DollarSign, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface SubItem {
    title: string;
    link: string;
    icon: string;
}

interface MenuItem {
    title: string;
    icon: string;
    link: string;
    isActive: boolean;
    subs?: SubItem[];
}

export default function Page() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter()

    useEffect(() => {
        const menuString = localStorage.getItem('menu');
        const menuData: MenuItem[] = menuString ? JSON.parse(menuString) : [];

        if (menuData.length == 0) {
            console.log("tem que redirecionar nessa buceta")
            return router.push('/login')
        }

        // Filtra apenas itens com subs
        const itemsWithSubs = menuData.filter(item => item.subs && item.subs.length > 0);
        setMenuItems(itemsWithSubs);
        setLoading(false);
    }, [router]);

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case "package":
                return <Package className="w-8 h-8" />;
            case "dollar-sign":
                return <DollarSign className="w-8 h-8" />;
            default:
                return null;
        }
    };

    const handleCardClick = (link: string) => {
        router.push(link);
    };

    return (
        <div className="min-h-screen w-full bg-primary flex items-center justify-center p-4 sm:p-6 md:p-8">
            {loading ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                    <p className="text-white text-lg font-medium">Carregando...</p>
                </div>
            ) : (
                <div className="w-full max-w-4xl space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                            Selecione o seu cargo inicial
                        </h1>
                        <Tooltip>
                            <TooltipTrigger>Hover</TooltipTrigger>
                            <TooltipContent>
                                <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto px-4">
                                    Esta seleção é usada apenas para direcionar você à dashboard correspondente ao cargo escolhido. Poderá trocar no menu lateral com facilidade.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {menuItems.map((item, index) => (
                            <Card
                                key={index}
                                className="cursor-pointer hover:shadow-2xl transition-all duration-200 border-0 overflow-hidden"
                                onClick={() => item.subs && item.subs.length > 0 && handleCardClick(item.subs[0].link)}
                            >
                                <CardContent className="p-6 sm:p-8">
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <div className="text-primary">
                                            {getIcon(item.icon)}
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                            {item.title}
                                        </h3>
                                        {item.subs && item.subs.length > 0 && (
                                            <p className="text-sm text-gray-600">
                                                Ir para: {item.subs[0].title}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
} 