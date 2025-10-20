import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem('user');
    if (user) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch('/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登入失敗');
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);

      toast({
        title: "登入成功",
        description: "歡迎回來！",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "登入失敗",
        description: error.message || "請檢查您的電子郵件和密碼",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    try {
      const response = await fetch('/api/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '註冊失敗');
      }

      // Auto login after signup
      const loginResponse = await fetch('/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginResponse.json();
      
      if (loginResponse.ok) {
        localStorage.setItem('user', JSON.stringify(loginData.user));
        localStorage.setItem('token', loginData.token);
        
        toast({
          title: "註冊成功",
          description: "帳戶已創建，正在登入...",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "註冊失敗",
        description: error.message || "請檢查您的資料",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-gradient-card backdrop-blur-sm border-primary/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary-glow" />
            <span className="text-2xl font-bold">SEO AI Writer</span>
          </div>
          <p className="text-muted-foreground">開始您的AI內容創作之旅</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">登入</TabsTrigger>
            <TabsTrigger value="signup">註冊</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">電子郵件</Label>
                <Input 
                  id="login-email"
                  name="email"
                  type="email" 
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">密碼</Label>
                <Input 
                  id="login-password"
                  name="password"
                  type="password"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:shadow-glow"
                disabled={isLoading}
              >
                {isLoading ? "登入中..." : "登入"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">姓名</Label>
                <Input 
                  id="signup-name"
                  name="name"
                  type="text" 
                  placeholder="您的姓名"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">電子郵件</Label>
                <Input 
                  id="signup-email"
                  name="email"
                  type="email" 
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">密碼</Label>
                <Input 
                  id="signup-password"
                  name="password"
                  type="password"
                  minLength={6}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:shadow-glow"
                disabled={isLoading}
              >
                {isLoading ? "註冊中..." : "創建帳戶"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>註冊即表示您同意我們的服務條款和隱私政策</p>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
