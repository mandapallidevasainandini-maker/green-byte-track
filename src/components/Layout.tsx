import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Leaf, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, userRole, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background blockchain-grid">
      <header className="border-b border-border backdrop-blur-sm bg-card/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-organic flex items-center justify-center shadow-glow">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              OrganicChain
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user && userRole && (
              <>
                <span className="text-sm text-muted-foreground capitalize">
                  {userRole} Dashboard
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
};