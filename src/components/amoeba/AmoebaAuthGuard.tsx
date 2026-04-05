import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface AmoebaAuthGuardProps {
  children: React.ReactNode;
}

const AmoebaAuthGuard = ({ children }: AmoebaAuthGuardProps) => {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/auth", { replace: true });
    } else {
      try {
        JSON.parse(userStr);
        setIsAuthed(true);
      } catch {
        navigate("/auth", { replace: true });
      }
    }
  }, [navigate]);

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <p className="text-muted-foreground">驗證中...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AmoebaAuthGuard;
