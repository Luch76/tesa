import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMe } from "@/lib/api/client";
import { useTesa } from "@/lib/tesa/context";

/** The signed-in Google user, with a Log out action. */
export function AccountMenu() {
  const { t } = useTesa();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe, staleTime: Infinity });
  if (!me) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("Account", "Cuenta")} title={me.email}>
          <Avatar className="size-7">
            {me.picture && <AvatarImage src={me.picture} alt="" referrerPolicy="no-referrer" />}
            <AvatarFallback className="text-[11px]">
              {me.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium truncate">{me.name}</div>
          <div className="text-xs text-muted-foreground truncate">{me.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form method="post" action="/auth/logout">
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut />
              {t("Log out", "Cerrar sesión")}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
