
import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/legends/i18n";

export function Unauthorized({ page }: { page?: string }) {
  const { lang } = useI18n();
  return (
    <Card className="glass max-w-xl mx-auto mt-12">
      <CardContent className="py-10 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold">{lang === "ar" ? "غير مصرح" : "Access Denied"}</h2>
        <p className="text-sm text-muted-foreground">
          {lang === "ar"
            ? `ليس لديك صلاحية للوصول إلى ${page ?? "هذه الصفحة"}. تواصل مع المسؤول لمنحك الصلاحية.`
            : `You don't have permission to access ${page ?? "this page"}. Contact your administrator.`}
        </p>
        <Button asChild variant="outline">
          <a href="/">{lang === "ar" ? "العودة للرئيسية" : "Back to Dashboard"}</a>
        </Button>
      </CardContent>
    </Card>
  );
}

